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

	test("emits importable TypeScript for JS ecosystems", () => {
		const program = parsePointCore(`module Pricing

type Plan {
  name: Text
  monthly: Int
}

let starter: Plan = { name: "Starter", monthly: 29 }

let prices: List<Int> = [19, 29, 49]

let defaultMonthly: Int = 29

fn annualPrice(monthly: Int): Int {
  return monthly * 12
}

fn canAccess(active: Bool, seats: Int): Bool {
  return active and seats > 0
}

fn planLabel(plan: Plan): Text {
  return plan.name
}
`);

		expect(emitPointCoreTypeScript(program)).toContain("export interface Plan");
		expect(emitPointCoreTypeScript(program)).toContain('export const starter: Plan = { name: "Starter", monthly: 29 };');
		expect(emitPointCoreTypeScript(program)).toContain("export const prices: Array<number> = [19, 29, 49];");
		expect(emitPointCoreTypeScript(program)).toContain("export const defaultMonthly: number = 29;");
		expect(emitPointCoreTypeScript(program)).toContain("export function annualPrice(monthly: number): number");
		expect(emitPointCoreTypeScript(program)).toContain("return (monthly * 12);");
		expect(emitPointCoreTypeScript(program)).toContain("return (active && (seats > 0));");
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
		]);
		expect(diagnostics[0]?.span?.start).toEqual({ line: 3, column: 19, offset: 33 });
		expect(diagnostics[0]).toMatchObject({
			ref: "point://core/Broken/value.answer.value",
			expected: "Int",
			actual: "Text",
			repair: "Return or assign a Int value here.",
		});
		expect(diagnostics.at(-1)).toMatchObject({
			ref: "point://core/Broken/fn.badField.return",
			expected: ["name", "active"],
			actual: "email",
			repair: "Use one of: name, active.",
			relatedRefs: ["point://core/Broken/type.User.name", "point://core/Broken/type.User.active"],
		});
	});

	test("indexes and explains stable Point refs for agents", () => {
		const program = parsePointCore(`module Billing

type User {
  name: Text
  active: Bool
}

let defaultUser: User = { name: "Ada", active: true }

fn userLabel(user: User): Text {
  return user.name
}
`);
		const index = createPointCoreIndex(program);
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/Billing/type.User.name");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/Billing/fn.userLabel.param.user");
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
});
