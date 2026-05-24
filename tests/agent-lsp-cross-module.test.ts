import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { analyzePointSource, hoverForPosition } from "../packages/point/src/lsp/analyze.ts";

const repoRoot = join(import.meta.dir, "..");
const moneyDemoPath = join(repoRoot, "examples/tools/money-demo.point");
const moneyDemoSource = readFileSync(moneyDemoPath, "utf8");
const moneyDemoUri = pathToFileURL(moneyDemoPath).href;

describe("LSP cross-module use", () => {
	test("money-demo has no diagnostics when document URI is provided", async () => {
		const analysis = await analyzePointSource(moneyDemoSource, { documentUri: moneyDemoUri });
		expect(analysis.diagnostics).toEqual([]);
	});

	test("money-demo without document path reports diagnostics", async () => {
		const analysis = await analyzePointSource(moneyDemoSource);
		expect(analysis.diagnostics.length).toBeGreaterThan(0);
	});

	test("hover on demo receipt calculation with document URI", async () => {
		const hover = await hoverForPosition(moneyDemoSource, 11, 15, { documentUri: moneyDemoUri });
		expect(hover?.contents).toContain("demo receipt");
	});
});
