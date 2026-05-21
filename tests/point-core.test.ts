import { describe, expect, test } from "bun:test";
import {
	checkPointCore,
	createPointCoreIndex,
	createPointCoreRepairPlan,
	emitPointCoreTypeScript,
	explainPointCoreRef,
	formatPointCore,
	lexPointCore,
	parsePointCore,
	parsePointSource,
} from "../packages/point/src/core/index.ts";

describe("Point core language", () => {
	test("lexes core source with source spans", () => {
		const tokens = lexPointCore("let answer: Int = 42\n");
		expect(tokens.map((token) => token.type).slice(0, 6)).toEqual([
			"identifier",
			"identifier",
			"colon",
			"identifier",
			"equals",
			"number",
		]);
		expect(tokens[1]?.span.start).toEqual({ line: 1, column: 5, offset: 4 });
	});

	test("parses modules, values, functions, and types without UI assumptions", () => {
		const program = parsePointCore(`module Math

import { Clock } from "std/time"

type User {
  name: Text
  active: Bool
}

let answer: Int = 42

fn identity(value: Text): Text {
  return value
}

fn add(left: Int, right: Int): Int {
  return left + right
}
`);

		expect(program.module).toBe("Math");
		expect(program.declarations.map((declaration) => declaration.kind)).toEqual([
			"import",
			"type",
			"value",
			"function",
			"function",
		]);
		expect(program.declarations[3]).toMatchObject({
			kind: "function",
			name: "identity",
			params: [{ name: "value", type: { kind: "typeRef", name: "Text" } }],
			returnType: { kind: "typeRef", name: "Text" },
		});
		expect(program.declarations[4]).toMatchObject({
			kind: "function",
			body: [
				{
					kind: "return",
					value: {
						kind: "binary",
						operator: "+",
					},
				},
			],
		});
	});

	test("supports general-purpose branching and expressions", () => {
		const program = parsePointCore(`module Scores

fn label(score: Int, active: Bool): Text {
  if score >= 90 and active {
    return "excellent"
  }
  else {
    return "review"
  }
}
`);

		expect(checkPointCore(program)).toEqual([]);
		expect(formatPointCore(program)).toContain("if score >= 90 and active {");
	});

	test("supports mutable local assignment and += updates", () => {
		const program = parsePointCore(`module Scores

fn total(base: Int, bonus: Int): Int {
  var score: Int = base
  score += bonus
  score = score + 1
  return score
}
`);

		expect(checkPointCore(program)).toEqual([]);
		expect(formatPointCore(program)).toContain("score += bonus");
		expect(emitPointCoreTypeScript(program)).toContain("let score: number = base;");
		expect(emitPointCoreTypeScript(program)).toContain("score += bonus;");
		expect(emitPointCoreTypeScript(program)).toContain("score = (score + 1);");
	});

	test("lowers semantic record, calculation, rule, and label syntax into typed core", () => {
		const program = parsePointSource(`module Readiness

record Deploy Signals
  has bundle id: Bool
  submitted for review: Bool

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 10 when signals.has bundle id
  add 20 when signals.submitted for review
  return score

label deploy readiness
  input score: Int
  output Text
  when score >= 90 return "Ready"
  otherwise return "Not ready"
`);

		expect(checkPointCore(program)).toEqual([]);
		expect(program.declarations.map((declaration) => declaration.kind)).toEqual(["type", "function", "function", "function"]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export interface DeploySignals");
		expect(emitted).toContain("export function annualPrice(monthlyPrice: number): number");
		expect(emitted).toContain("return (monthlyPrice * 12);");
		expect(emitted).toContain("export function deployReadinessScore(signals: DeploySignals): number");
		expect(emitted).toContain("score += 10;");
		expect(emitted).toContain("if (signals.hasBundleId)");
		expect(emitted).toContain("export function deployReadinessLabel(score: number): string");
	});

	test("emits importable TypeScript for JS ecosystems", () => {
		const program = parsePointSource(`module Pricing

record Plan
  name: Text
  monthly price: Int
  active: Bool

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12

label plan status
  input plan: Plan
  output Text
  when plan.active return plan.name
  otherwise return "Inactive"

`);

		expect(emitPointCoreTypeScript(program)).toContain("export interface Plan");
		expect(emitPointCoreTypeScript(program)).toContain("monthlyPrice: number;");
		expect(emitPointCoreTypeScript(program)).toContain("export function annualPrice(monthlyPrice: number): number");
		expect(emitPointCoreTypeScript(program)).toContain("return (monthlyPrice * 12);");
		expect(emitPointCoreTypeScript(program)).toContain("return plan.name;");
	});

	test("checks types, identifiers, functions, and spans", () => {
		const diagnostics = checkPointCore(
			parsePointCore(`module Broken

let answer: Int = "no"

fn bad(value: Missing): Text {
  return unknown
}

fn broken(score: Int): Text {
  if score + 1 {
    return "bad"
  }
}

type User {
  name: Text
  active: Bool
}

let badUser: User = { name: "Ada", enabled: true }

fn badField(user: User): Text {
  return user.email
}

fn badAssign(value: Int): Int {
  let locked: Int = 1
  locked += value
  value = locked
  return locked
}
`),
		);

		expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
			"type-mismatch",
			"unknown-type",
			"unknown-identifier",
			"type-mismatch",
			"missing-field",
			"unknown-field",
			"unknown-field",
			"immutable-assignment",
			"immutable-assignment",
		]);
		expect(diagnostics[0]?.span?.start).toEqual({ line: 3, column: 19, offset: 33 });
		expect(diagnostics[0]).toMatchObject({
			ref: "point://core/Broken/value.answer.value",
			expected: "Int",
			actual: "Text",
			repair: "Return or assign a Int value here.",
		});
		expect(diagnostics.at(-1)).toMatchObject({
			ref: "point://core/Broken/fn.badAssign.value.assignment",
			repair: "Declare value with var if it needs to change.",
		});
		expect(diagnostics.at(-3)).toMatchObject({
			ref: "point://core/Broken/fn.badField.return",
			expected: ["name", "active"],
			actual: "email",
			repair: "Use one of: name, active.",
			relatedRefs: ["point://core/Broken/type.User.name", "point://core/Broken/type.User.active"],
		});
	});

	test("indexes and explains stable Point refs for agents", () => {
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
		const index = createPointCoreIndex(program);
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/Billing/type.User.name");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/Billing/fn.userStatusLabel.param.user");
		const explanation = explainPointCoreRef(program, "point://core/Billing/type.User.name");
		expect(explanation).toMatchObject({
			found: true,
			summary: "Field name: Text.",
			relatedRefs: ["point://core/Billing/type.User.active"],
		});
	});

	test("creates repair plans from diagnostics", () => {
		const program = parsePointCore(`module Broken

type User {
  name: Text
  active: Bool
}

fn label(user: User): Text {
  return user.email
}
`);
		const plan = createPointCoreRepairPlan(checkPointCore(program));
		expect(plan).toMatchObject({
			ok: false,
			steps: [
				{
					ref: "point://core/Broken/fn.label.return",
					code: "unknown-field",
					repair: "Use one of: name, active.",
					relatedRefs: ["point://core/Broken/type.User.name", "point://core/Broken/type.User.active"],
				},
			],
		});
	});

	test("rejects internal core syntax as public Point source", () => {
		expect(() =>
			parsePointSource(`module Broken

fn userLabel(user: User): Text {
  return user.name
}
`),
		).toThrow("Point source uses internal core syntax");
	});
});
