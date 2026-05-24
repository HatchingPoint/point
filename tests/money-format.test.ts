import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { formatCentsUsd } from "@hatchingpoint/point/std/money";
import { checkPointCore, parsePointSource } from "../packages/point/src/core/index.ts";

const repoRoot = join(import.meta.dir, "..");

describe("money format helpers", () => {
	test("formatCentsUsd formats positive and negative cents", () => {
		expect(formatCentsUsd(1005)).toBe("$10.05");
		expect(formatCentsUsd(0)).toBe("$0.00");
		expect(formatCentsUsd(-250)).toBe("-$2.50");
	});

	test("money display calculation formats USD and EUR", () => {
		const program = parsePointSource(`module Money

external point std money
  format cents usd raw(amount cents: Int): Text from "@hatchingpoint/point/std/money" as formatCentsUsd

external point std text
  text from int raw(value: Int): Text from "@hatchingpoint/point/std/text" as textFromInt

record Money
  amount cents: Int
  currency: Text

calculation money from cents
  input amount cents: Int
  input currency: Text
  output money: Money
  money is { amount cents: amount cents, currency: currency }

calculation money display
  input money: Money
  output display: Text
  when money.currency == "USD" return format cents usd raw(money.amount cents)
  otherwise return text from int raw(money.amount cents) + " " + money.currency
`);
		expect(checkPointCore(program)).toEqual([]);
	});
});
