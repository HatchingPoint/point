import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

describe("action outcome exhaustiveness", () => {
	test("Payment Outcome label missing Failed uses action-outcome-not-exhaustive", () => {
		const program = parsePointSource(`module Payment Outcomes

variant Payment Outcome
  Succeeded
  Failed

label receipt copy
  input outcome: Payment Outcome
  output Text
  on Succeeded return "ok"
`);

		const diagnostics = checkPointCore(program);

		expect(diagnostics).toContainEqual(
			expect.objectContaining({
				code: "action-outcome-not-exhaustive",
				path: "label.receipt copy",
				ref: "point://semantic/Payment Outcomes/label.receipt copy",
				message: expect.stringContaining("outcome dispatch cases"),
				repair: expect.stringContaining("outcome dispatch branches"),
			}),
		);
		const diagnostic = diagnostics.find((entry) => entry.code === "action-outcome-not-exhaustive");
		expect(diagnostic?.expected).toEqual(["Succeeded", "Failed"]);
		expect(diagnostic?.repair).toContain("on Failed return ...");

		const semanticRefs = createSemanticIndex(program.semanticSource!).refs.map((symbol) => symbol.ref);
		expect(semanticRefs).toContain("point://semantic/Payment Outcomes/label.receipt copy");
		expect(
			explainSemanticRef(program.semanticSource!, diagnostic!.ref, "action-outcome-not-exhaustive"),
		).toMatchObject({ found: true });
		expect(
			explainSemanticRef(program.semanticSource!, diagnostic!.ref, "action-outcome-not-exhaustive").summary,
		).toContain("Exhaustive outcome dispatch");
	});

	test("fully covered Payment Outcome dispatch passes", () => {
		const diagnostics = checkPointCore(
			parsePointSource(`module Payment Outcomes

variant Payment Outcome
  Succeeded
  Failed

label receipt copy
  input outcome: Payment Outcome
  output Text
  on Succeeded return "ok"
  on Failed return "no"
`),
		);

		expect(diagnostics.some((entry) => entry.code === "action-outcome-not-exhaustive")).toBe(false);
		expect(diagnostics.some((entry) => entry.code === "missing-variant-case")).toBe(false);
	});
});
