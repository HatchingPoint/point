import { describe, expect, test } from "bun:test";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";

describe("datagrid pagination", () => {
	test("rejects non-positive page size", () => {
		const program = parsePointSource(`module Demo

record Row
  name: Text

view grid
  input rows: List<Row>
  datagrid row in rows columns name sort by name page size 0
`);
		expect(checkPointCore(program).some((diagnostic) => diagnostic.code === "invalid-datagrid-page-size")).toBe(true);
	});

	test("emits pagination controls", () => {
		const program = parsePointSource(`module Demo

record Row
  name: Text

view grid
  input rows: List<Row>
  datagrid row in rows columns name sort by name page size 5
`);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("point-datagrid-pagination");
		expect(emitted).toContain("setPage");
		expect(emitted).toContain(".slice(page * 5");
	});
});
