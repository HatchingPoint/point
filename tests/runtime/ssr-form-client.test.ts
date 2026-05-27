import { describe, expect, test } from "bun:test";

import { createPointRuntimeFetchHandler } from "../../packages/point/runtime/index.ts";
import { wrapSsrHtmlDocument } from "../../packages/point/runtime/ssr/form-client.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR form client", () => {
	test("wraps interactive pages with the owned-runtime form script", async () => {
		const program = checkedProgram(`module FormClientDemo

record Login Body
  email: Text
  password: Text

view login form
  input credentials: Login Body
  input on credentials change: Handler<Login Body>
  on change call on credentials change
  form
  bind field "Email" to credentials.email
  bind field "Password" to credentials.password
  submit "Sign in" POST "/api/login" body credentials save token field token then navigate "/members"
  render "Login"

route login
  method POST
  path "/api/login"
  input body: Login Body
  output response: Text
  return json { token: "demo-token" }

page login page
  input credentials: Login Body
  input on credentials change: Handler<Login Body>
  title "Login"
  main render login form(credentials, on credentials change)

navigation app
  path "/login" page login page
  bootstrap router
`);

		const handler = createPointRuntimeFetchHandler(program);
		const page = await handler(new Request("http://point.test/login"));
		expect(page.status).toBe(200);
		const html = await page.text();
		expect(html).toContain("data-point-form-submit");
		expect(html).toContain('<script>(function(){const TOKEN_KEY="point.auth.token"');
		expect(html).toContain("localStorage.setItem(TOKEN_KEY");
	});

	test("does not inject the script when no interactive forms are present", () => {
		const wrapped = wrapSsrHtmlDocument('<div class="point-view-render">Plain text</div>');
		expect(wrapped).not.toContain("<script>");
	});

	test("injects ui client script for tabs and sign-out buttons", async () => {
		const program = checkedProgram(`module UiClientTabs

view admin nav
  button "Sign out" clear auth navigate "/login"
  render "Navigation"

page home page
  title "Home"
  main render admin nav()

navigation app
  path "/" page home page
  bootstrap router
`);

		const handler = createPointRuntimeFetchHandler(program);
		const page = await handler(new Request("http://point.test/"));
		const html = await page.text();
		expect(html).toContain("data-point-view-button");
		expect(html).toContain("localStorage.removeItem(TOKEN_KEY)");
	});
});
