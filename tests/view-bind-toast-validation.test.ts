import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("view bind select and toast validation", () => {
	test("bind select with non-field target reports invalid-view-bind-target", () => {
		const program = parsePointSource(`module SelectRepair

record Draft
  role: Text

view create form
  input draft: Draft
  input role options: List<Text>
  input on draft change: Handler<Draft>
  on change call on draft change
  form
  bind select "Role" to draft options role options
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-view-bind-target")).toBe(true);
	});

	test("toast without submit reports toast-without-submit", () => {
		const program = parsePointSource(`module ToastRepair

record Draft
  name: Text

view create form
  input draft: Draft
  input on draft change: Handler<Draft>
  on change call on draft change
  form
  bind field "Name" to draft.name
  toast on success "Saved"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "toast-without-submit")).toBe(true);
	});
});
