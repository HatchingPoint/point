import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { formatSemanticProgram } from "../packages/point/src/semantic/format.ts";
import { parseSemanticSource } from "../packages/point/src/semantic/parse.ts";

describe("calculation on failure", () => {
	test("parses on failure return after output and on … return body lines", () => {
		const source = `module Pay

variant Payment Outcome
  Failed with message: Text
  Succeeded with charge id: Text

calculation fallback message
  input outcome: Payment Outcome
  output message: Text
  on failure return "Payment failed"
  on Failed with message return message
  on Succeeded with charge id return "Paid"
`;
		const semantic = parseSemanticSource(source).declarations.find((d) => d.kind === "calculation");
		expect(semantic?.kind).toBe("calculation");
		if (semantic?.kind !== "calculation") return;
		expect(semantic.onFailure?.kind).toBe("literal");
		expect((semantic.onFailure as { value?: unknown })?.value).toBe("Payment failed");
		expect(semantic.body.map((s) => s.kind)).toEqual(["onVariantReturn", "onVariantReturn"]);
	});

	test("format preserves on failure line before body statements", () => {
		const source = `module Pay

variant Payment Outcome
  Failed with message: Text
  Succeeded with charge id: Text

calculation fallback message
  input outcome: Payment Outcome
  output message: Text
  on failure return "Payment failed"
  on Failed with message return message
  on Succeeded with charge id return "Paid"
`;
		expect(formatSemanticProgram(parseSemanticSource(source)).trim()).toBe(source.trim());
	});

	test("lowering appends trailing return after variant dispatch", () => {
		const program = parsePointSource(
			`module Pay

variant Payment Outcome
  Failed with message: Text
  Succeeded with charge id: Text

calculation fallback message
  input outcome: Payment Outcome
  output message: Text
  on failure return "Payment failed"
  on Failed with message return message
  on Succeeded with charge id return "Paid"
`,
		);
		const calculationFn = program.declarations.find(
			(d) => d.kind === "function" && d.semantic?.kind === "calculation" && d.semantic.name === "fallback message",
		);
		expect(calculationFn?.kind).toBe("function");
		if (calculationFn?.kind !== "function") return;
		const lastStmt = calculationFn.body[calculationFn.body.length - 1];
		expect(lastStmt?.kind).toBe("return");
		if (lastStmt?.kind !== "return" || lastStmt.value?.kind !== "literal") return;
		expect(lastStmt.value.value).toBe("Payment failed");
	});

	test("reports calculation-on-failure-type-mismatch when on failure expr does not match output type", () => {
		const program = parsePointSource(
			`module Pay

variant Payment Outcome
  Failed with message: Text

calculation bad fallback
  input outcome: Payment Outcome
  output message: Text
  on failure return 404
  on Failed with message return message
`,
		);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((d) => d.code === "calculation-on-failure-type-mismatch")).toBe(true);
		expect(diagnostics.some((d) => d.code === "type-mismatch" && d.path.includes("badFallback"))).toBe(false);
		const mismatch = diagnostics.find((d) => d.code === "calculation-on-failure-type-mismatch");
		expect(mismatch?.path).toBe("calculation.bad fallback.onFailure");
		expect(mismatch?.ref).toContain("calculation.bad fallback");
	});
});
