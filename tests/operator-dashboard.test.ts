import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/app/operator-dashboard/operator-dashboard.point";

describe("operator dashboard", () => {
	test("point check succeeds", async () => {
		const result = await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).nothrow().quiet();
		expect(result.exitCode).toBe(0);
	});

	test("parses chart and datagrid syntax", () => {
		const program = parsePointSource(`module Demo

record Metric
  label: Text
  value: Int

record Job Row
  name: Text
  status: Text
  score: Int

view operator panel
  input metrics: List<Metric>
  input jobs: List<Job Row>
  chart bar from metrics label field label value field value
  datagrid row in jobs columns name, status, score sort by score filter by name
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("emits chart bars and sortable datagrid with filter", () => {
		const program = parsePointSource(`module Demo

record Metric
  label: Text
  value: Int

record Job Row
  name: Text
  status: Text
  score: Int

view operator panel
  input metrics: List<Metric>
  input jobs: List<Job Row>
  chart bar from metrics label field label value field value
  datagrid row in jobs columns name, status, score sort by score filter by name
`);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="point-chart point-chart-bar"');
		expect(emitted).toContain("point-chart-bar-value");
		expect(emitted).toContain("point-datagrid-sort");
		expect(emitted).toContain("setSortColumn");
		expect(emitted).toContain("filterText");
		expect(emitted).toContain("point-datagrid-filter");
		expect(emitted).toContain("point-datagrid-wrap");
	});
});
