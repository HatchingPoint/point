import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { startPointRuntimeServer } from "../packages/point/runtime/server.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../packages/point/src/core/cli.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const source = resolve(process.argv[2] ?? "packages/point/templates/runtime-saas-app/src/app.point");
const portFile = resolve(process.argv[3] ?? "port.txt");
const port = Number(process.env.PORT ?? 0);

const repoRoot = resolve(import.meta.dir, "..");
const lock = await readPointLock(repoRoot);
const coreFile = buildCoreFileFromSource(source, readFileSync(source, "utf8"), lock, repoRoot);
const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
const diagnostics = checkPointCore(program);
if (diagnostics.length > 0) {
	console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
	process.exit(1);
}

const server = startPointRuntimeServer(program, { port: port > 0 ? port : 0, hostname: "127.0.0.1" });
writeFileSync(portFile, String(server.port));
