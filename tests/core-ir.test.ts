import { describe, expect, test } from "bun:test";
import {
	checkPointCore,
	createPointCoreRepairPlan,
	emitPointCoreTypeScript,
	lexPointCore,
} from "../packages/point/src/core/index.ts";
import { formatPointCore, parsePointCore } from "../packages/point/src/core/test-only/index.ts";

describe("core IR", () => {
	test("lexes core text with source spans", () => {
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

	test("parses modules, values, functions, and types from core text", () => {
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

	test("checks branching and mutation on core IR", () => {
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

	test("checks mutable locals and compound assignment on core IR", () => {
		const program = parsePointCore(`module Scores

fn total(base: Int, bonus: Int): Int {
  var score: Int = base
  score += bonus
  score -= 2
  score = score + 1
  return score
}
`);

		expect(checkPointCore(program)).toEqual([]);
		expect(formatPointCore(program)).toContain("score += bonus");
		expect(emitPointCoreTypeScript(program)).toContain("let score: number = base;");
		expect(emitPointCoreTypeScript(program)).toContain("score += bonus;");
	});

	test("checks for loops on core IR", () => {
		const program = parsePointCore(`module Lists

fn sum(values: List<Int>): Int {
  var total: Int = 0
  for value in values {
    total += value
  }
  return total
}
`);

		expect(checkPointCore(program)).toEqual([]);
		expect(formatPointCore(program)).toContain("for value in values {");
		expect(emitPointCoreTypeScript(program)).toContain("for (const value of values) {");
	});

	test("reports structured diagnostics for invalid core IR iteration", () => {
		const diagnostics = checkPointCore(
			parsePointCore(`module Broken

fn bad(value: Int): Int {
  var total: Int = 0
  for item in value {
    total += item
  }
  return total
}
`),
		);

		expect(diagnostics[0]).toMatchObject({
			code: "iteration-type-mismatch",
			ref: "point://core/Broken/fn.bad.for.item",
			expected: "List<T>",
			actual: "Int",
			repair: "Iterate over a List<T> value or change this expression to a list.",
		});
	});

	test("checks types, identifiers, functions, and spans on core IR", () => {
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
	});

	test("reports nullable field access diagnostics on core IR", () => {
		const diagnostics = checkPointCore(
			parsePointCore(`module Broken

type User {
  name: Text
}

fn bad(user: Maybe<User>): Text {
  return user.name
}
`),
		);
		expect(diagnostics[0]).toMatchObject({
			code: "nullable-field-access",
			expected: "User",
			actual: "Maybe<User>",
			repair: "Check that this Maybe value is present before accessing its fields.",
		});
	});

	test("creates repair plans from core IR diagnostics", () => {
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
					repair: expect.stringContaining("Use one of: name, active."),
					relatedRefs: ["point://core/Broken/type.User.name", "point://core/Broken/type.User.active"],
				},
			],
		});
	});
});
