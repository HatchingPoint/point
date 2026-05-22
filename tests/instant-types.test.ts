import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createModuleGraphForFile, loadCoreFile, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");

async function checkPointFile(relativePath: string) {
	const lock = await readPointLock(repoRoot);
	const coreFile = await loadCoreFile(relativePath, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	return checkPointCore(programWithDependencyDeclarations(coreFile, graph));
}

describe("Instant type", () => {
	test("checks std/time and instant demo example", async () => {
		for (const file of ["std/time.point", "examples/tools/instant-demo.point"]) {
			expect(await checkPointFile(file)).toEqual([]);
		}
	});

	test("emits Instant as string in TS and str in Python", async () => {
		const lock = await readPointLock(repoRoot);
		const coreFile = await loadCoreFile("tests/conformance/fixtures/instant.point", lock, repoRoot);
		const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
		const program = programWithDependencyDeclarations(coreFile, graph);
		expect(checkPointCore(program)).toEqual([]);
		const ts = emitPointCoreTypeScript(program);
		const py = emitPointCorePython(program);
		expect(ts).toContain(": string");
		expect(ts).toContain("instantNow");
		expect(py).toContain(": str");
	});

	test("rejects Instant with type arguments", () => {
		const source = `module Bad\n\nuse std.time\n\ncalculation demo\n  output value: Instant<Text>\n  return instant now()\n`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-type-arity")).toBe(true);
	});

	test("rejects assigning Text to Instant without parse", () => {
		const source = `module Bad\n\ncalculation demo\n  output value: Instant\n  value is "2026-01-01T00:00:00.000Z"\n  return value\n`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics.some((diagnostic) => diagnostic.code === "type-mismatch")).toBe(true);
	});
});
