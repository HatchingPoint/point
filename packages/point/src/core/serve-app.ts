import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { PointCoreProgram } from "./ast.ts";
import { checkPointCore, type PointCoreDiagnostic } from "./check.ts";
import {
	createModuleGraphForFile,
	jsOutputFor,
	loadCoreFile,
	orderByDependencies,
	programWithDependencyDeclarations,
	programWithTypeScriptImports,
} from "./cli.ts";
import { emitPointCoreJavaScript } from "./emit-javascript.ts";
import { hasBootstrapNavigation, hasRoutes } from "./dev.ts";
import { readPointLock } from "./packages.ts";

const DEFAULT_STATIC_DIR = "dist";
const DEFAULT_PORT = 3456;

export interface PointServeOptions {
	port: number;
	cwd?: string;
	staticDir?: string;
}

export interface PointServeBuildResult {
	ok: boolean;
	entry: string;
	jsOutput: string;
	staticDir: string;
	diagnostics: PointCoreDiagnostic[];
}

export function parseServeCliFlags(args: string[]): { port: number; staticDir: string; positional: string[] } {
	let port = DEFAULT_PORT;
	let staticDir = DEFAULT_STATIC_DIR;
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
		if (arg === "--static" && args[index + 1]) {
			staticDir = args[++index]!;
			continue;
		}
		if (arg.startsWith("--static=")) {
			staticDir = arg.slice("--static=".length);
			continue;
		}
		positional.push(arg);
	}
	if (!Number.isFinite(port) || port <= 0) throw new Error(`Invalid --port value: ${port}`);
	return { port, staticDir, positional };
}

export function supportsPointServe(program: PointCoreProgram): boolean {
	return hasRoutes(program);
}

export function createServeBootstrap(jsOutput: string, staticDir: string): string {
	const importPath = jsOutput.replaceAll("\\", "/");
	const staticPath = staticDir.replaceAll("\\", "/");
	return [
		`import { createPointRouteFetchHandler } from ${JSON.stringify(importPath)};`,
		"import { existsSync } from \"node:fs\";",
		"import { join } from \"node:path\";",
		`const staticRoot = ${JSON.stringify(staticPath)};`,
		"const apiHandler = createPointRouteFetchHandler();",
		"function contentTypeForPath(path) {",
		'  if (path.endsWith(".html")) return "text/html; charset=utf-8";',
		'  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";',
		'  if (path.endsWith(".css")) return "text/css; charset=utf-8";',
		'  if (path.endsWith(".json")) return "application/json; charset=utf-8";',
		'  if (path.endsWith(".svg")) return "image/svg+xml";',
		'  if (path.endsWith(".png")) return "image/png";',
		'  if (path.endsWith(".ico")) return "image/x-icon";',
		'  return "application/octet-stream";',
		"}",
		"async function serveStatic(pathname) {",
		"  let filePath = pathname === \"/\" ? \"/index.html\" : pathname;",
		"  const candidate = join(staticRoot, filePath);",
		"  if (existsSync(candidate)) {",
		"    const file = Bun.file(candidate);",
		"    return new Response(file, { headers: { \"content-type\": contentTypeForPath(filePath) } });",
		"  }",
		"  if (!filePath.includes(\".\")) {",
		"    const fallback = join(staticRoot, \"index.html\");",
		"    if (existsSync(fallback)) {",
		"      const file = Bun.file(fallback);",
		"      return new Response(file, { headers: { \"content-type\": \"text/html; charset=utf-8\" } });",
		"    }",
		"  }",
		"  return new Response(\"Not found\", { status: 404 });",
		"}",
		"export function startAppServer() {",
		"  const port = Number(process.env.PORT ?? 0);",
		"  return Bun.serve({",
		"    port,",
		"    async fetch(req) {",
		"      const url = new URL(req.url);",
		"      if (url.pathname.startsWith(\"/api/\")) {",
		"        return apiHandler(req);",
		"      }",
		"      return serveStatic(url.pathname);",
		"    },",
		"  });",
		"}",
		"if (import.meta.main) {",
		"  const server = startAppServer();",
		'  console.log(`Point serve listening on http://localhost:${server.port}`);',
		"}",
		"",
	].join("\n");
}

export async function buildServeEntry(entry: string, cwd = process.cwd(), staticDir = DEFAULT_STATIC_DIR): Promise<PointServeBuildResult> {
	const normalizedEntry = entry.replaceAll("\\", "/");
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
	if (diagnostics.length > 0) {
		return {
			ok: false,
			entry: normalizedEntry,
			jsOutput: resolve(cwd, jsOutputFor(normalizedEntry)),
			staticDir: resolve(cwd, staticDir),
			diagnostics,
		};
	}
	const program = programWithTypeScriptImports(coreFile, graph);
	if (!supportsPointServe(program)) {
		throw new Error("point serve requires route blocks in the entry module.");
	}
	const jsOutput = resolve(cwd, jsOutputFor(normalizedEntry));
	await Bun.$`mkdir -p ${dirname(jsOutput)}`.quiet();
	await Bun.write(jsOutput, emitPointCoreJavaScript(program));
	return {
		ok: true,
		entry: normalizedEntry,
		jsOutput,
		staticDir: resolve(cwd, staticDir),
		diagnostics: [],
	};
}


export async function runPointServe(entry: string, options: PointServeOptions): Promise<void> {
	const cwd = options.cwd ?? process.cwd();
	const staticDir = options.staticDir ?? DEFAULT_STATIC_DIR;
	const resolvedStatic = resolve(cwd, staticDir);
	if (!existsSync(resolvedStatic)) {
		throw new Error(`Static directory not found: ${resolvedStatic}. Run your frontend build first (e.g. vite build).`);
	}
	const build = await buildServeEntry(entry, cwd, staticDir);
	if (!build.ok) {
		console.error(JSON.stringify({ ok: false, diagnostics: build.diagnostics }, null, 2));
		process.exit(1);
	}
	const runnerPath = resolve(cwd, ".point-cache", "serve-runner.ts");
	await Bun.$`mkdir -p ${dirname(runnerPath)}`.quiet();
	await Bun.write(runnerPath, createServeBootstrap(build.jsOutput, build.staticDir));
	process.env.PORT = String(options.port);
	const serverProcess = Bun.spawn(["bun", runnerPath], {
		cwd,
		env: { ...process.env, PORT: String(options.port) },
		stdout: "inherit",
		stderr: "inherit",
	});
	await serverProcess.exited;
}

export function validateServeProgram(program: PointCoreProgram): void {
	if (!hasRoutes(program)) {
		throw new Error("point serve requires route blocks.");
	}
	if (hasBootstrapNavigation(program) && !existsSync(resolve(process.cwd(), DEFAULT_STATIC_DIR))) {
		// navigation-only warning is fine — caller checks static dir separately
	}
}
