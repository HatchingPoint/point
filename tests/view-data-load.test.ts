import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

const repoRoot = join(import.meta.dir, "..");
const dashboardSource = join(repoRoot, "examples/app/dashboard/dashboard.point");

describe("view data loading", () => {
	test("rejects direct action calls in views with load binding", () => {
		const program = parsePointSource(`module Broken

action fetch items
  output result: Text
  touches none
  return "ok"

view items list
  load data from action fetch items
  render fetch items()
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-await")).toBe(true);
		expect(diagnostics.find((diagnostic) => diagnostic.code === "missing-await")?.repair).toContain("data binding");
	});

	test("rejects unknown load actions", () => {
		const program = parsePointSource(`module Broken

view items list
  load data from action missing action
  render "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-load-action")).toBe(true);
	});

	test("emits React useState/useEffect hook for view data load", async () => {
		const program = parsePointSource(await Bun.file(dashboardSource).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("import * as React from \"react\";");
		expect(emitted).toContain("function pointIsEmptyData(value: unknown): boolean");
		expect(emitted).toContain("const [data, setData] = React.useState");
		expect(emitted).toContain("const [loading, setLoading] = React.useState(true)");
		expect(emitted).toContain("await fetchItems()");
		expect(emitted).toContain('if (loading) {');
		expect(emitted).toContain('return <>Loading items...</>;');
		expect(emitted).toContain('return <>Could not load items</>;');
		expect(emitted).toContain('return <>No items yet</>;');
		expect(emitted).toContain('className="point-list"');
		expect(emitted).toContain('pointNavigationLink(String(item.title), String(("/items/" + item.id)))');
	});

	test("indexes data load refs and explain coverage", async () => {
		const program = parsePointSource(await Bun.file(dashboardSource).text());
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/view.items list.load.fetch items`);
		const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/view.items list.load.fetch items`);
		expect(explanation.found).toBe(true);
		expect(explanation.summary).toContain("loads data from action");
	});

	test("check-json surfaces load diagnostics with repair hints", () => {
		const broken = parsePointSource(`module Broken

action list notes
  output notes: List<Text>
  touches none
  return ["a"]

view items list
  load data from action missing action
  render "ok"
`);
		const diagnostics = checkPointCore(broken);
		const diagnostic = diagnostics.find((entry) => entry.code === "unknown-load-action");
		expect(diagnostic?.repair).toContain("missing action");
		expect(diagnostic?.ref).toBe("point://semantic/Broken/view.items list");
		expect(diagnostic?.expected).toEqual(["list notes"]);
	});
});
