import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { checkPointCore, type PointCoreDiagnostic } from "./check.ts";
import {
	createModuleGraphForFile,
	jsOutputFor,
	loadCoreFile,
	orderByDependencies,
	programWithDependencyDeclarations,
	programWithTypeScriptImports,
	tsOutputFor,
	tsxOutputFor,
} from "./cli.ts";
import { viteWebRoot } from "./dev.ts";
import { emitPointCoreJavaScript } from "./emit-javascript.ts";
import { emitPointCoreTypeScript } from "./emit-typescript.ts";
import { readPointLock } from "./packages.ts";

export interface PointBuildAppResult {
	ok: boolean;
	entry: string;
	jsOutput: string;
	tsOutput: string;
	tsxOutput: string;
	distDir: string;
	diagnostics: PointCoreDiagnostic[];
}

function viteConfigPath(cwd: string): string | null {
	const candidates = ["web/vite.config.ts", "web/vite.config.js", "web/vite.config.mts"];
	for (const candidate of candidates) {
		const configPath = resolve(cwd, candidate);
		if (existsSync(configPath)) return configPath;
	}
	return null;
}

export async function buildPointApp(entry: string, cwd = process.cwd()): Promise<PointBuildAppResult> {
	const normalizedEntry = entry.replaceAll("\\", "/");
	const distDir = resolve(cwd, "dist");
	const lock = await readPointLock(cwd);
	const coreFile = await loadCoreFile(normalizedEntry, lock, cwd);
	const graph = await createModuleGraphForFile(coreFile, lock, cwd);
	const ordered = orderByDependencies([...graph.values()].map((node) => node.result), graph);
	const diagnostics: PointCoreDiagnostic[] = [];
	for (const result of ordered) {
		const fileDiagnostics = checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({
			...diagnostic,
			file: result.input,
		}));
		diagnostics.push(...fileDiagnostics);
	}
	const jsOutput = resolve(cwd, jsOutputFor(normalizedEntry));
	const tsOutput = resolve(cwd, tsOutputFor(normalizedEntry));
	const tsxOutput = resolve(cwd, tsxOutputFor(normalizedEntry));
	if (diagnostics.length > 0) {
		return { ok: false, entry: normalizedEntry, jsOutput, tsOutput, tsxOutput, distDir, diagnostics };
	}
	const program = programWithTypeScriptImports(coreFile, graph);
	const emittedTs = emitPointCoreTypeScript(program, normalizedEntry);
	await Bun.$`mkdir -p ${dirname(jsOutput)}`.quiet();
	await Bun.write(jsOutput, emitPointCoreJavaScript(program));
	await Bun.write(tsOutput, emittedTs);
	await Bun.write(tsxOutput, emittedTs);
	const webRoot = viteWebRoot(cwd);
	const configPath = viteConfigPath(cwd);
	if (!webRoot || !configPath) {
		throw new Error("point build-app requires web/vite.config.ts (or .js/.mts) for the UI bundle.");
	}
	const vite = Bun.spawn(["bunx", "vite", "build", "--config", configPath.replaceAll("\\", "/")], {
		cwd: webRoot,
		stdout: "inherit",
		stderr: "inherit",
	});
	const exitCode = await vite.exited;
	if (exitCode !== 0) {
		throw new Error(`vite build failed with exit code ${exitCode}`);
	}
	return { ok: true, entry: normalizedEntry, jsOutput, tsOutput, tsxOutput, distDir, diagnostics: [] };
}

export async function runPointBuildApp(entry: string, cwd = process.cwd()): Promise<void> {
	const result = await buildPointApp(entry, cwd);
	if (!result.ok) {
		console.error(JSON.stringify({ ok: false, diagnostics: result.diagnostics }, null, 2));
		process.exit(1);
	}
	console.log(`Point build-app wrote ${result.jsOutput.replaceAll("\\", "/")}`);
	console.log(`Point build-app wrote ${result.tsOutput.replaceAll("\\", "/")}`);
	console.log(`Point build-app wrote ${result.tsxOutput.replaceAll("\\", "/")}`);
	console.log(`Point build-app wrote ${result.distDir.replaceAll("\\", "/")}`);
}
