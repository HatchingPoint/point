import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { createModuleGraphForFile, loadCoreFile, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { checkPointCore, parsePointSource } from "../packages/point/src/core/index.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");

async function checkedProgram(input: string) {
	const lock = await readPointLock();
	const coreFile = await loadCoreFile(input, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	return programWithDependencyDeclarations(coreFile, graph);
}

describe("cross-module use imports", () => {
	test("order.point resolves Catalog Product type via single-file check", async () => {
		const result = await Bun.$`bun ${pointCli} check examples/multi-file/order.point`.cwd(repoRoot).quiet();
		expect(result.exitCode).toBe(0);
	});

	test("money-demo resolves std money callables and Money record", async () => {
		expect(checkPointCore(await checkedProgram("examples/tools/money-demo.point"))).toEqual([]);
	});

	test("money-demo passes point test with linked std module", async () => {
		const result = await Bun.$`bun ${pointCli} test examples/tools/money-demo.point`.cwd(repoRoot).quiet();
		expect(result.exitCode).toBe(0);
	});
});
