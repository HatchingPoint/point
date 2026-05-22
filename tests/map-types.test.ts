import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");

describe("Map<Text, T> primitives", () => {
	test("checks catalog price lookup example", async () => {
		const source = await Bun.file(join(repoRoot, "examples/catalog/price-lookup.point")).text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("emits map literal and lookup to JS/TS/Python", async () => {
		const source = await Bun.file(join(repoRoot, "tests/conformance/fixtures/map-lookup.point")).text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const js = emitPointCoreJavaScript(program);
		const ts = emitPointCoreTypeScript(program);
		const py = emitPointCorePython(program);
		expect(js).toContain('"alpha": 10');
		expect(js).toContain('[String("alpha")]');
		expect(ts).toContain('"alpha": 10');
		expect(py).toContain('"alpha": 10');
		expect(py).toContain('.get(str("alpha"))');
	});

	test("rejects Map with non-Text keys", () => {
		const source = `module Bad\n\ncalculation demo\n  output values: Map<Int, Int>\n  values is map { "a": 1 }\n  return values\n`;
		const program = parsePointSource(source);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-map-key-type")).toBe(true);
	});

	test("checks std money module", async () => {
		const source = await Bun.file(join(repoRoot, "std/money.point")).text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
	});
});
