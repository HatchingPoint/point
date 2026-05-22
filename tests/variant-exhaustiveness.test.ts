import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

describe("variant exhaustiveness", () => {
	test("reports missing-variant-case for on Case dispatch with uncovered variant cases", () => {
		const program = parsePointSource(`module Variant Coverage

variant Order Status
  Pending
  Processing
  Shipped with tracking number: Text
  Delivered
  Cancelled with reason: Text

label status message
  input status: Order Status
  output Text
  on Pending return "Your order is pending"
  on Shipped with tracking number return "Shipped: " + tracking number
  otherwise return "In progress"
`);
		const diagnostics = checkPointCore(program);

		expect(diagnostics).toContainEqual(
			expect.objectContaining({
				code: "missing-variant-case",
				path: "label.status message",
				ref: "point://semantic/Variant Coverage/label.status message",
			}),
		);
		const diagnostic = diagnostics.find((entry) => entry.code === "missing-variant-case");
		expect(diagnostic?.expected).toEqual(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]);
		expect(diagnostic?.repair).toContain("on Processing return ...");
		expect(diagnostic?.repair).toContain("on Delivered return ...");
		expect(diagnostic?.repair).toContain("on Cancelled return ...");
		const semanticRefs = createSemanticIndex(program.semanticSource!).refs.map((symbol) => symbol.ref);
		expect(semanticRefs).toContain("point://semantic/Variant Coverage/label.status message");
		expect(explainSemanticRef(program.semanticSource!, "point://semantic/Variant Coverage/label.status message")).toMatchObject({ found: true });
	});

	test("accepts fully covered on Case dispatch", () => {
		const diagnostics = checkPointCore(
			parsePointSource(`module Variant Coverage

variant Order Status
  Pending
  Processing
  Shipped with tracking number: Text
  Delivered
  Cancelled with reason: Text

label status message
  input status: Order Status
  output Text
  on Pending return "pending"
  on Processing return "processing"
  on Shipped with tracking number return tracking number
  on Delivered return "delivered"
  on Cancelled with reason return reason
`),
		);

		expect(diagnostics.some((entry) => entry.code === "missing-variant-case")).toBe(false);
	});
});
