import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef, mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

describe("semantic diagnostics", () => {
	test("maps unknown-field diagnostics to semantic refs and source line spans", () => {
		const source = `module Broken

record User
  name: Text
  active: Bool

label user status
  input user: User
  output Text
  when user.enabled return user.name
  otherwise return "inactive"
`;
		const program = parsePointSource(source);
		const diagnostics = checkPointCore(program);
		const publicDiagnostics = mapPublicDiagnostics(program, diagnostics);

		expect(publicDiagnostics[0]).toMatchObject({
			code: "unknown-field",
			ref: "point://semantic/Broken/label.user status",
			relatedRefs: ["point://semantic/Broken/record.User.field.name", "point://semantic/Broken/record.User.field.active"],
		});
		expect(publicDiagnostics[0]?.span?.start.line).toBe(10);
		expect(program.semanticSource?.kind).toBe("semanticProgram");
	});

	test("indexes and explains semantic AST nodes directly", () => {
		const program = parsePointSource(`module Billing

record User
  name: Text
  active: Bool

label user status
  input user: User
  output Text
  when user.active return user.name
  otherwise return "inactive"
`);
		const index = createSemanticIndex(program.semanticSource!);
		expect(index.schemaVersion).toBe("point.semantic.index.v1");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/Billing/record.User.field.active");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/Billing/label.user status.input.user");
		expect(index.refs.map((symbol) => symbol.ref)).not.toContain("point://core/Billing/type.User.name");

		const explanation = explainSemanticRef(program.semanticSource!, "point://semantic/Billing/label.user status");
		expect(explanation).toMatchObject({
			found: true,
			summary: "Semantic label user status returns Text.",
			relatedRefs: [
				"point://semantic/Billing/label.user status.input.user",
				"point://semantic/Billing/label.user status.output.result",
			],
		});
	});
});
