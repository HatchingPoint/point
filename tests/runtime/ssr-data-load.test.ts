import { describe, expect, test } from "bun:test";

import { renderPointViewToHtml } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR load data", () => {
	test("loads action data then renders datagrid rows", () => {
		const program = checkedProgram(`module SsrDataLoad

record Item
  name: Text

action list items
  output items: List<Item>
  return [{ name: "Zed" }, { name: "Amy" }]

view inventory
  load data from action list items
  when loading render "Loading..."
  when error render "Failed"
  when empty render "Empty"
  datagrid item in data columns name sort by name
  render "Inventory"
`);

		const html = renderPointViewToHtml(program, "inventory");

		expect(html).toContain("point-datagrid");
		expect(html).toContain("Amy");
		expect(html).toContain("Zed");
		expect(html.indexOf("Amy")).toBeLessThan(html.indexOf("Zed"));
		expect(html).not.toContain("Loading...");
		expect(html).toContain("Inventory");
	});

	test("renders empty state when action returns an empty list", () => {
		const program = checkedProgram(`module SsrDataLoadEmpty

record Item
  name: Text

action list items
  output items: List<Item>
  return []

view inventory
  load data from action list items
  when empty render "Nothing here yet"
  datagrid item in data columns name sort by name
  render "Inventory"
`);

		const html = renderPointViewToHtml(program, "inventory");

		expect(html).toContain("Nothing here yet");
		expect(html).not.toContain("point-datagrid");
	});
});
