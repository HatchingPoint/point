import { describe, expect, test } from "bun:test";
import { formatPointSource } from "../packages/point/src/core/format.ts";

describe("formatPointSource", () => {
	test("round-trips files that use std.time callables", async () => {
		for (const file of ["examples/std-usage.point", "examples/tools/instant-demo.point", "examples/catalog/price-lookup.point", "std/time.point"]) {
			const source = (await Bun.file(file).text()).replace(/\r\n/g, "\n");
			expect(formatPointSource(source)).toBe(source);
		}
	});
});
