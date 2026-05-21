import { dirname, resolve } from "node:path";
import { watch } from "node:fs";
import type { PointCoreProgram } from "./ast.ts";
import { checkPointCore, type PointCoreDiagnostic } from "./check.ts";
import {
	createModuleGraphForFile,
	findRunEntryName,
	jsOutputFor,
	loadCoreFile,
	orderByDependencies,
	programWithDependencyDeclarations,
	programWithTypeScriptImports,
} from "./cli.ts";
import { emitPointCoreJavaScript } from "./emit-javascript.ts";
import { isCacheHit, readBuildCache, recordCacheEntry, writeBuildCache } from "./incremental.ts";
import { readPointLock } from "./packages.ts";

const DEV_CACHE_DIR = ".point-cache";
const DEV_RUNNER = "dev-runner.ts";

export interface PointDevOptions {
	port: number;
	cwd?: string;
}

export type PointDevMode =
	| { kind: "routes" }
	| { kind: "schedules"; entryName: string }
	| { kind: "run"; entryName: string };

export interface PointDevBuildResult {
	ok: boolean;
	entry: string;
	jsOutput: string;
	mode: PointDevMode;
	diagnostics: PointCoreDiagnostic[];
	watchedInputs: string[];
}

export function parseDevCliFlags(args: string[]): { port: number; positional: string[] } {
	let port = 3456;
	const positional: string[] = [];
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index]!;
		if (arg === "--port" && args[index + 1]) {
			port = Number(args[++index]);
			continue;
		}
		if (arg.startsWith("--port=")) {
			port = Number(arg.slice("--port=".length));
			continue;
		}
		positional.push(arg);
	}
	if (!Number.isFinite(port) || port <= 0) throw new Error(`Invalid --port value: ${port}`);
	return { port, positional };
}

export function detectDevMode(program: PointCoreProgram): PointDevMode {
	const hasRoutes =
		program.semanticSource?.declarations.some((declaration) => declaration.kind === "route" || declaration.kind === "streamRoute") ??
		false;
	if (hasRoutes) return { kind: "routes" };

	const schedules = program.semanticSource?.declarations.filter((declaration) => declaration.kind === "schedule") ?? [];
	if (schedules.length > 0) {
		const entryName = findRunEntryName(program);
		if (entryName) return { kind: "schedules", entryName };
	}

	const entryName = findRunEntryName(program);
	if (!entryName) {
		throw new Error("No dev entrypoint found. Define routes with a serve command, schedules with a run command, or a zero-input action/command.");
	}
	return { kind: "run", entryName };
}

export async function buildDevEntry(entry: string, cwd = process.cwd()): Promise<PointDevBuildResult> {
	const normalizedEntry = entry.replaceAll("\\", "/");
	const lock = await readPointLock(cwd);
	const coreFile = await loadCoreFile(normalizedEntry, lock, cwd);
	const graph = await createModuleGraphForFile(coreFile, lock, cwd);
	const ordered = orderByDependencies([...graph.values()].map((node) => node.result), graph);
	const watchedInputs = ordered.map((result) => result.input);

	let cache = await readBuildCache(cwd);
	const diagnostics: PointCoreDiagnostic[] = [];
	for (const result of ordered) {
		if (isCacheHit(cache, result.input, result.source)) continue;
		const fileDiagnostics = checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({
			...diagnostic,
			file: result.input,
		}));
		diagnostics.push(...fileDiagnostics);
		cache = recordCacheEntry(cache, result.input, result.source, fileDiagnostics.length === 0);
	}
	await writeBuildCache(cache, cwd);

	if (diagnostics.length > 0) {
		return {
			ok: false,
			entry: normalizedEntry,
			jsOutput: resolve(cwd, jsOutputFor(normalizedEntry)),
			mode: detectDevMode(coreFile.program),
			diagnostics,
			watchedInputs,
		};
	}

	const program = programWithTypeScriptImports(coreFile, graph);
	const jsOutput = resolve(cwd, jsOutputFor(normalizedEntry));
	await Bun.$`mkdir -p ${dirname(jsOutput)}`.quiet();
	await Bun.write(jsOutput, emitPointCoreJavaScript(program));

	return {
		ok: true,
		entry: normalizedEntry,
		jsOutput,
		mode: detectDevMode(program),
		diagnostics: [],
		watchedInputs,
	};
}

export function createDevBootstrap(jsOutput: string, mode: PointDevMode): string {
	const importPath = jsOutput.replaceAll("\\", "/");
	if (mode.kind === "routes") {
		return [
			`import { startRoutesServer } from ${JSON.stringify(importPath)};`,
			"const server = startRoutesServer();",
			'console.log(`Point dev listening on http://localhost:${server.port}`);',
			"",
		].join("\n");
	}
	if (mode.kind === "schedules") {
		return [
			`import { ${mode.entryName} } from ${JSON.stringify(importPath)};`,
			`await ${mode.entryName}();`,
			"",
		].join("\n");
	}
	return [
		`import { ${mode.entryName} } from ${JSON.stringify(importPath)};`,
		`const value = await ${mode.entryName}();`,
		'if (value !== undefined) console.log(typeof value === "string" ? value : JSON.stringify(value));',
		"",
	].join("\n");
}

function devRunnerPath(cwd: string): string {
	return resolve(cwd, DEV_CACHE_DIR, DEV_RUNNER);
}

async function writeDevRunner(cwd: string, jsOutput: string, mode: PointDevMode): Promise<string> {
	const runnerPath = devRunnerPath(cwd);
	await Bun.$`mkdir -p ${dirname(runnerPath)}`.quiet();
	await Bun.write(runnerPath, createDevBootstrap(jsOutput, mode));
	return runnerPath;
}

type DevProcess = ReturnType<typeof Bun.spawn>;
type RouteServer = ReturnType<typeof Bun.serve>;

function pathToFileUrl(path: string): string {
	return `file://${path.replaceAll("\\", "/")}`;
}

export async function runPointDev(entry: string, options: PointDevOptions): Promise<void> {
	const cwd = options.cwd ?? process.cwd();
	const normalizedEntry = entry.replaceAll("\\", "/");
	let activeProcess: DevProcess | null = null;
	let routeServer: RouteServer | null = null;
	let watchedPaths = new Set<string>();
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let reloadGeneration = 0;
	let watcherStop: (() => void) | null = null;

	const stopActiveProcess = async () => {
		if (routeServer) {
			routeServer.stop(true);
			routeServer = null;
		}
		if (!activeProcess) return;
		activeProcess.kill();
		await activeProcess.exited.catch(() => undefined);
		activeProcess = null;
	};

	const startDevProcess = async (build: PointDevBuildResult) => {
		await stopActiveProcess();
		const env = { ...process.env, PORT: String(options.port) };
		if (build.mode.kind === "routes") {
			process.env.PORT = String(options.port);
			const devModulePath = resolve(cwd, DEV_CACHE_DIR, `serve-${Date.now()}.js`);
			await Bun.$`mkdir -p ${dirname(devModulePath)}`.quiet();
			await Bun.write(devModulePath, await Bun.file(build.jsOutput).text());
			const mod = await import(pathToFileUrl(devModulePath));
			routeServer = mod.startRoutesServer();
			console.log(`Point dev listening on http://localhost:${routeServer.port}`);
			return;
		}
		const runnerPath = await writeDevRunner(cwd, build.jsOutput, build.mode);
		if (build.mode.kind === "run") {
			activeProcess = Bun.spawn(["bun", runnerPath], { cwd, env, stdout: "inherit", stderr: "inherit" });
			await activeProcess.exited;
			activeProcess = null;
			return;
		}
		activeProcess = Bun.spawn(["bun", runnerPath], { cwd, env, stdout: "inherit", stderr: "inherit" });
	};

	const restartWatcher = () => {
		watcherStop?.();
		watcherStop = null;
		const paths = [...watchedPaths].map((path) => resolve(cwd, path));
		if (paths.length === 0) return;
		const watchers = paths.map((path) =>
			watch(path, { persistent: true }, (eventType) => {
				if (eventType !== "change" && eventType !== "rename") return;
				scheduleRebuild();
			}),
		);
		watcherStop = () => {
			for (const watcher of watchers) watcher.close();
		};
	};

	const rebuild = async (initial = false) => {
		const generation = ++reloadGeneration;
		console.log(`Point dev rebuilding ${normalizedEntry}...`);
		const build = await buildDevEntry(normalizedEntry, cwd);
		if (generation !== reloadGeneration) return;
		if (!build.ok) {
			console.error(JSON.stringify({ ok: false, diagnostics: build.diagnostics }, null, 2));
			if (initial) process.exit(1);
			console.error("Point dev kept the previous build running.");
			return;
		}
		watchedPaths = new Set(build.watchedInputs);
		await startDevProcess(build);
		restartWatcher();
		console.log(`Point dev ready (${build.mode.kind}) — watching ${build.watchedInputs.length} file(s)`);
	};

	const scheduleRebuild = () => {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			void rebuild();
		}, 150);
	};

	process.on("SIGINT", () => {
		watcherStop?.();
		void stopActiveProcess().finally(() => process.exit(0));
	});
	process.on("SIGTERM", () => {
		watcherStop?.();
		void stopActiveProcess().finally(() => process.exit(0));
	});

	console.log(`Point dev starting ${normalizedEntry} on port ${options.port}...`);
	await rebuild(true);
	await new Promise(() => {});
}
