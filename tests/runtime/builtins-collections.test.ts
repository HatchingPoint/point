import { describe, expect, test } from "bun:test";
import { clampInt, countMatching, listLength, maxInt, roundInt } from "../../packages/point/runtime/builtins/collections";

describe("runtime collection and integer builtins", () => {
	test("listLength returns the number of list items", () => {
		expect(listLength([])).toBe(0);
		expect(listLength(["ready", "steady", "ship"])).toBe(3);
	});

	test("countMatching counts items accepted by a predicate", () => {
		const scores = [0, 4, 7, 10, 12];

		expect(countMatching(scores, (score) => score >= 7)).toBe(3);
		expect(countMatching(scores, (score) => score < 0)).toBe(0);
	});

	test("maxInt returns the larger integer value", () => {
		expect(maxInt(8, 3)).toBe(8);
		expect(maxInt(-4, -2)).toBe(-2);
		expect(maxInt(4.9, 4.1)).toBe(4);
	});

	test("roundInt rounds numbers to the nearest integer", () => {
		expect(roundInt(3.49)).toBe(3);
		expect(roundInt(3.5)).toBe(4);
		expect(roundInt(-2.5)).toBe(-2);
	});

	test("clampInt constrains integer values to an inclusive range", () => {
		expect(clampInt(5, 0, 10)).toBe(5);
		expect(clampInt(-2, 0, 10)).toBe(0);
		expect(clampInt(12, 0, 10)).toBe(10);
		expect(clampInt(9.9, 0, 9.2)).toBe(9);
	});
});
