import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("view form controls", () => {
	test("parses select textarea and toast syntax", () => {
		const program = parsePointSource(`module Demo

record Draft
  role: Text
  notes: Text

view create form
  input draft: Draft
  input role options: List<Text>
  input on draft change: Handler<Draft>
  on change call on draft change
  form
  bind select "Role" to draft.role options role options
  bind textarea "Notes" to draft.notes
  toast on success "Saved"
  toast on error "Save failed"
  submit "Save" POST "/api/items" body draft
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("emits select textarea and toast", () => {
		const program = parsePointSource(`module Demo

record Draft
  role: Text
  notes: Text

view create form
  input draft: Draft
  input role options: List<Text>
  input on draft change: Handler<Draft>
  on change call on draft change
  form
  bind select "Role" to draft.role options role options
  bind textarea "Notes" to draft.notes
  toast on success "Saved"
  toast on error "Save failed"
  submit "Save" POST "/api/items" body draft
`);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="point-select"');
		expect(emitted).toContain('className="point-textarea"');
		expect(emitted).toContain("point-toast-success");
		expect(emitted).toContain('setToast("Saved")');
	});
});
