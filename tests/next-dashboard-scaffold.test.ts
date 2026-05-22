import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	loadPairedScaffoldManifest,
	measureAllPairedScaffoldCases,
	readScaffoldVariantFile,
} from "../scripts/paired-scaffold-context.ts";

const NEXT_DIR = join(import.meta.dir, "../benchmarks/next-dashboard");

describe("next-dashboard paired scaffold", () => {
	test("manifest maps dashboard agent-app cases", () => {
		const manifest = loadPairedScaffoldManifest("next-dashboard");
		expect(Object.keys(manifest.caseMapping)).toEqual([
			"dashboard-add-search",
			"dashboard-search-wiring",
			"dashboard-rename-products",
		]);
	});

	test("base and golden variants exist with expected search wiring", () => {
		expect(readScaffoldVariantFile("next-dashboard", "base", "lib/searchItems.ts")).toBeNull();
		expect(readScaffoldVariantFile("next-dashboard", "golden", "lib/searchItems.ts")).toContain("searchItems");
		expect(readScaffoldVariantFile("next-dashboard", "golden", "app/admin/search/page.tsx")).toContain("Search");
	});

	test("broken-feature-add mirrors Point broken state (missing loader module)", () => {
		expect(readScaffoldVariantFile("next-dashboard", "broken-feature-add", "lib/searchItems.ts")).toBeNull();
		expect(readScaffoldVariantFile("next-dashboard", "broken-feature-add", "components/SearchPanel.tsx")).toContain(
			"searchItems",
		);
	});

	test("broken-rename mirrors partial products rename", () => {
		const list = readScaffoldVariantFile("next-dashboard", "broken-rename", "components/ProductsList.tsx") ?? "";
		expect(list).toContain("fetchItems");
		expect(readScaffoldVariantFile("next-dashboard", "broken-rename", "lib/products.ts")).toContain("listProducts");
	});

	test("measured TS context is smaller than old char heuristic", () => {
		const metrics = measureAllPairedScaffoldCases("next-dashboard");
		for (const item of metrics) {
			expect(item.brokenContextTokens).toBeGreaterThan(200);
			expect(item.brokenContextTokens).toBeLessThan(6000);
		}
	});

	test("README documents variants", () => {
		const readme = readFileSync(join(NEXT_DIR, "README.md"), "utf8");
		expect(readme).toContain("broken-feature-add");
		expect(readme).toContain("broken-wiring");
	});
});
