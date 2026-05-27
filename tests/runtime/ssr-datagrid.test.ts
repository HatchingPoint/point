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

describe("runtime SSR datagrid", () => {
	test("renders sorted datagrid columns and filter field", () => {
		const program = checkedProgram(`module SsrDatagrid

record Member
  id: Text
  name: Text
  role: Text

view members grid
  input members: List<Member>
  datagrid member in members columns name, role sort by name filter by name link name to "/members/" + member.id
  render "Members"
`);

		const html = renderPointViewToHtml(program, "members grid", [
			[
				{ id: "2", name: "Zed", role: "Admin" },
				{ id: "1", name: "Amy", role: "Member" },
			],
		]);

		expect(html).toContain("point-datagrid");
		expect(html).toContain("point-datagrid-filter");
		expect(html).toContain("<th scope=\"col\">Name</th>");
		expect(html).toContain('<a class="point-link" href="/members/1">Amy</a>');
		expect(html).toContain("Zed");
		expect(html.indexOf("Amy")).toBeLessThan(html.indexOf("Zed"));
		expect(html).toContain("Members");
	});

	test("renders paginated datagrid first page", () => {
		const program = checkedProgram(`module SsrDatagridPage

record Row
  name: Text

view grid
  input rows: List<Row>
  datagrid row in rows columns name sort by name page size 2
`);

		const html = renderPointViewToHtml(program, "grid", [[{ name: "a" }, { name: "b" }, { name: "c" }]]);

		expect(html).toContain("point-datagrid-pagination");
		expect(html).toContain("Showing 2 of 3");
		expect(html).not.toContain(">c<");
	});
});
