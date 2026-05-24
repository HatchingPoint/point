import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("view button and table", () => {
	test("parses button clear auth navigate and table link syntax", () => {
		const program = parsePointSource(`module Demo

record Member
  id: Text
  name: Text
  role: Text

view admin nav
  link "Members" to "/members"
  button "Sign out" clear auth navigate "/login"

view members list
  input members: List<Member>
  table member in members columns name, role link name to "/members/" + member.id
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("emits sign-out button, clear token, and semantic table", () => {
		const program = parsePointSource(`module Demo

record Member
  id: Text
  name: Text
  role: Text

view admin nav
  button "Sign out" clear auth navigate "/login"

view members list
  input members: List<Member>
  table member in members columns name, role link name to "/members/" + member.id
`);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("pointAuthClearToken");
		expect(emitted).toContain('navigate("/login")');
		expect(emitted).toContain('className="point-table"');
		expect(emitted).toContain("<thead>");
		expect(emitted).toContain("pointNavigationLink(String(member.name)");
	});
});
