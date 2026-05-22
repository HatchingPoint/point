import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("field alias resolution", () => {
	test("resolves camelCase field access to spaced record field names when unique", () => {
		const source = `module Pricing

record Price Input
  monthly price: Int
  discount percent: Int

calculation annual price
  input input: Price Input
  output annual price: Int
  annual price is input.monthlyAmount * 12
`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics).toHaveLength(0);
	});

	test("reports ambiguous camelCase aliases with candidate labels", () => {
		const source = `module Pricing

record Price Input
  monthly price: Int
  monthly prize: Int

calculation annual price
  input input: Price Input
  output annual price: Int
  annual price is input.monthlyAmount * 12
`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]).toMatchObject({
			code: "unknown-field",
			expected: ["monthly price", "monthly prize"],
			actual: "monthlyamount",
			repair: "Field alias monthlyamount is ambiguous. Choose one of: monthly price, monthly prize.",
		});
	});

	test("adds did-you-mean suggestions for unknown fields when close", () => {
		const source = `module Users

record User
  name: Text
  active: Bool

rule user points
  input user: User
  output score: Int
  score starts at 0
  add 10 when user.enabled
  return score
`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]).toMatchObject({
			code: "unknown-field",
			actual: "enabled",
			repair: 'Use one of: name, active. Did you mean "active"?',
		});
	});

	test("keeps generic unknown-field repair when there is no close label", () => {
		const source = `module LaunchApp

record Launch Signals
  has bundle id: Bool
  submitted for review: Bool
  has passing tests: Bool

rule launch readiness
  input signals: Launch Signals
  output score: Int
  score starts at 0
  add 30 when signals.unknownField
  return score
`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.code).toBe("unknown-field");
		expect(diagnostics[0]?.repair).toBe("Use one of: has bundle id, submitted for review, has passing tests.");
	});
});
