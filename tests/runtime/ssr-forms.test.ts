import { describe, expect, test } from "bun:test";

import { renderPointViewToHtml } from "../../packages/point/runtime/index.ts";
import { serializePointFormSubmitConfig } from "../../packages/point/runtime/ssr/form-client.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR forms", () => {
	test("renders bind select, bind textarea, submit, and toast hints", () => {
		const program = checkedProgram(`module SsrForms

record Draft
  name: Text
  role: Text
  notes: Text

view create form
  input draft: Draft
  input role options: List<Text>
  input on draft change: Handler<Draft>
  on change call on draft change
  form
  bind field "Name" to draft.name
  bind select "Role" to draft.role options role options
  bind textarea "Notes" to draft.notes
  toast on success "Member created"
  toast on error "Could not create member"
  submit "Create member" POST "/api/members" body draft
  render "Creates a member"
`);

		const html = renderPointViewToHtml(program, "create form", [
			{ name: "Ada", role: "Admin", notes: "Pilot" },
			["Admin", "Member"],
			() => {},
		]);

		expect(html).toContain('class="point-form"');
		expect(html).toContain('data-point-form-submit=');
		expect(html).toContain('data-point-field="name"');
		expect(html).toContain('data-point-field="role"');
		expect(html).toContain('class="point-select"');
		expect(html).toContain('class="point-textarea"');
		expect(html).toContain('value="Ada"');
		expect(html).toContain(">Pilot</textarea>");
		expect(html).toContain('class="point-button point-form-submit"');
		expect(html).toContain("Create member");
		expect(html).toContain('data-success-toast="Member created"');
		expect(html).toContain('data-error-toast="Could not create member"');
		expect(html).not.toContain("React");
	});

	test("serializes save token, with auth, and navigate submit metadata", () => {
		const program = checkedProgram(`module SsrFormSubmitMeta

record Credentials
  email: Text
  password: Text

view login form
  input credentials: Credentials
  input on credentials change: Handler<Credentials>
  on change call on credentials change
  form
  bind field "Email" to credentials.email
  bind field "Password" to credentials.password
  toast on error "Sign in failed"
  submit "Sign in" POST "/api/login" body credentials save token field token then navigate "/members"
  render "Login"
`);

		const fn = program.declarations.find((declaration) => declaration.kind === "function" && declaration.semantic?.name === "login form");
		expect(fn?.kind).toBe("function");
		const config = serializePointFormSubmitConfig(fn!.semantic!.viewControls!);
		expect(config).toEqual({
			url: "/api/login",
			fields: ["email", "password"],
			saveTokenField: "token",
			navigateTo: "/members",
			errorToast: "Sign in failed",
		});

		const html = renderPointViewToHtml(program, "login form", [{ email: "pilot@example.com", password: "demo" }, () => {}]);
		expect(html).toContain("saveTokenField&quot;:&quot;token");
		expect(html).toContain("navigateTo&quot;:&quot;/members");
	});
});
