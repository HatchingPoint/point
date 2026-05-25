import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("chart field validation", () => {
	test("reports invalid chart label field", () => {
		const program = parsePointSource(`module Demo

record Metric
  label: Text
  value: Int

view metrics chart
  input metrics: List<Metric>
  chart bar from metrics label field title value field value
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-chart-field")).toBe(true);
	});

	test("accepts valid chart fields", () => {
		const program = parsePointSource(`module Demo

record Metric
  label: Text
  value: Int

view metrics chart
  input metrics: List<Metric>
  chart bar from metrics label field label value field value
`);
		expect(checkPointCore(program)).toEqual([]);
	});
});
