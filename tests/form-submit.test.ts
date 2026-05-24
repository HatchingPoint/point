import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("form submit POST", () => {
	test("parses submit inside form blocks", () => {
		const program = parsePointSource(`module Demo

record Login Body
  email: Text
  password: Text

record Create Member Body
  name: Text
  role: Text

view login form
  input credentials: Login Body
  input on credentials change: Handler<Login Body>
  on change call on credentials change
  form
    bind field "Email" to credentials.email
    bind field "Password" to credentials.password
    submit "Sign in" POST "/api/login" body credentials save token field token then navigate "/members"

view create member form
  input draft: Create Member Body
  input on draft change: Handler<Create Member Body>
  on change call on draft change
  form
    bind field "Name" to draft.name
    bind field "Role" to draft.role
    submit "Create member" POST "/api/members" body draft with auth then navigate "/members"
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("emits auth helpers, submit button, and fetch handler", () => {
		const program = parsePointSource(`module Demo

record Login Body
  email: Text
  password: Text

view login form
  input credentials: Login Body
  input on credentials change: Handler<Login Body>
  on change call on credentials change
  form
    bind field "Email" to credentials.email
    submit "Sign in" POST "/api/login" body credentials save token field token then navigate "/members"
`);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("pointAuthGetToken");
		expect(emitted).toContain("pointAuthSetToken");
		expect(emitted).toContain('type="submit"');
		expect(emitted).toContain('fetch("/api/login"');
		expect(emitted).toContain("useNavigate");
		expect(emitted).toContain('navigate("/members")');
		expect(emitted).toContain("point-form-error");
	});
});
