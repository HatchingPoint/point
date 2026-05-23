import { expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

test("reports float-money-field for money-like Float record fields", () => {
	const program = parsePointSource(`module Pricing

record Line Item
  label: Text
  unit price: Float
  amount cents: Float
`);

	const diagnostics = checkPointCore(program);
	const codes = diagnostics.map((entry) => entry.code);
	expect(codes.filter((code) => code === "float-money-field")).toEqual(["float-money-field", "float-money-field"]);
	expect(diagnostics.find((entry) => entry.code === "float-money-field")?.repair).toContain("std/money.point");
});

test("allows Int cents money fields", () => {
	const program = parsePointSource(`module Pricing

record Line Item
  label: Text
  amount cents: Int
  unit price: Int
`);

	expect(checkPointCore(program).filter((entry) => entry.code === "float-money-field")).toEqual([]);
});
