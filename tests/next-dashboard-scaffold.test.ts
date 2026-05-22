import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	loadNextDashboardManifest,
	measureAllNextDashboardCases,
	readVariantFile,
} from "../scripts/next-dashboard-context.ts";

const NEXT_DIR = join(import.meta.dir, "../benchmarks/next-dashboard");

describe("next-dashboard paired scaffold", () => {
	test("manifest maps both agent-app cases", () => {
		const manifest = loadNextDashboardManifest();
		expect(Object.keys(manifest.caseMapping)).toEqual(["dashboard-add-search", "dashboard-search-wiring"]);
	});

	test("base and golden variants exist with expected search wiring", () => {
		expect(readVariantFile("base", "lib/searchItems.ts")).toBeNull();
		expect(readVariantFile("golden", "lib/searchItems.ts")).toContain("searchItems");
		expect(readVariantFile("golden", "app/admin/search/page.tsx")).toContain("Search");
		expect(readVariantFile("golden", "components/AdminNav.tsx")).toContain("/admin/search");
	});

	test("broken-feature-add mirrors Point broken state (missing loader module)", () => {
		expect(readVariantFile("broken-feature-add", "lib/searchItems.ts")).toBeNull();
		expect(readVariantFile("broken-feature-add", "components/SearchPanel.tsx")).toContain("searchItems");
		expect(readVariantFile("broken-feature-add", "app/admin/search/page.tsx")).toContain("SearchPage");
	});

	test("broken-wiring mirrors Point wiring mistake", () => {
		const panel = readVariantFile("broken-wiring", "components/SearchPanel.tsx") ?? "";
		expect(panel).toContain("searchItem");
		expect(panel).not.toMatch(/searchItems\(/);
	});

	test("measured TS context is smaller than old char heuristic", () => {
		const metrics = measureAllNextDashboardCases();
		for (const item of metrics) {
			expect(item.brokenContextTokens).toBeGreaterThan(200);
			expect(item.brokenContextTokens).toBeLessThan(6000);
		}
		const featureAdd = metrics.find((item) => item.caseId === "dashboard-add-search");
		expect(featureAdd?.filesMissing).toContain("lib/searchItems.ts");
	});

	test("README documents variants", () => {
		const readme = readFileSync(join(NEXT_DIR, "README.md"), "utf8");
		expect(readme).toContain("broken-feature-add");
		expect(readme).toContain("broken-wiring");
	});
});
