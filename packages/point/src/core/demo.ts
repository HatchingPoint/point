import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatPointCapabilitiesCatalog, listPointCapabilities } from "./capabilities.ts";
import { formatPointCommandsCatalog, listPointCommandsCatalog, listPointCommandsFromProgram, listPointCommandsFromSource } from "./commands.ts";
import { checkPointCore } from "./check.ts";
import { buildCoreFileFromSource, createModuleGraphForFile, programWithDependencyDeclarations } from "./cli.ts";
import { mapPublicDiagnostics } from "../semantic/context.ts";
import { readPointLock } from "./packages.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function resolveDemoFile(input: string | undefined, cwd: string): string {
	if (input) return resolve(cwd, input);
	const local = resolve(cwd, "src/app.point");
	if (existsSync(local)) return local;
	const bundled = resolve(PACKAGE_ROOT, "templates/full-stack-app/src/app.point");
	if (existsSync(bundled)) return bundled;
	return resolve(cwd, "examples/full-stack-template/src/app.point");
}

export async function runPointDemo(input: string | undefined, cwd = process.cwd()): Promise<number> {
	const file = resolveDemoFile(input, cwd);
	if (!existsSync(file)) {
		console.error(`No demo file found. Run: point create my-app  or  point demo path/to/app.point`);
		return 1;
	}
	const relative = (file.replace(resolve(cwd), "").replace(/^[/\\]/, "") || file).replaceAll("\\", "/");
	const source = await Bun.file(file).text();
	const lock = await readPointLock(cwd);
	const coreFile = buildCoreFileFromSource(relative, source, lock, cwd);
	const graph = coreFile.uses.length > 0 ? await createModuleGraphForFile(coreFile, lock, cwd) : null;
	const program = graph ? programWithDependencyDeclarations(coreFile, graph) : coreFile.program;
	const diagnostics = checkPointCore(program);
	if (diagnostics.length > 0) {
		console.error(JSON.stringify({ ok: false, file: relative, diagnostics: mapPublicDiagnostics(program, diagnostics) }, null, 2));
		return 1;
	}

	const commands = program.semanticSource
		? listPointCommandsFromProgram(program.semanticSource, relative)
		: listPointCommandsFromSource(source, relative, program.module);
	const catalog = listPointCommandsCatalog(commands);
	const launch = catalog.commands.find((entry) => !entry.name.toLowerCase().startsWith("serve ")) ?? catalog.commands[0];

	console.log("Point golden demo");
	console.log("");
	console.log(formatPointCapabilitiesCatalog(listPointCapabilities()));
	console.log("");
	console.log(formatPointCommandsCatalog(catalog));
	console.log("");
	console.log("Next steps:");
	console.log(`  point dev ${relative}`);
	if (launch) console.log(`  point launch ${relative} ${launch.name}`);
	console.log(`  point check-json ${relative}`);
	console.log(`  point repair ${relative}`);
	console.log("");
	console.log("Guide: docs/site/guide/golden-app-demo.md");
	return 0;
}
