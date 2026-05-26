import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	loadPairedScaffoldManifest,
	measureAllPairedScaffoldCases,
	readScaffoldVariantFile,
} from "../scripts/paired-scaffold-context.ts";

const NEXT_DIR = join(import.meta.dir, "../benchmarks/next-ops-dashboard");

describe("next-ops-dashboard paired scaffold", () => {
	test("manifest maps ops agent-app cases", () => {
		const manifest = loadPairedScaffoldManifest("next-ops-dashboard");
		expect(Object.keys(manifest.caseMapping)).toEqual([
			"ops-add-dashboard",
			"ops-dashboard-chart-wiring",
			"ops-dashboard-sort-wiring",
			"ops-dashboard-filter-wiring",
			"ops-dashboard-page-size-wiring",
			"ops-dashboard-refresh-wiring",
		]);
	});

	test("base and golden variants exist with expected ops wiring", () => {
		expect(readScaffoldVariantFile("next-ops-dashboard", "base", "lib/fetchOpsDashboard.ts")).toBeNull();
		expect(readScaffoldVariantFile("next-ops-dashboard", "base", "components/JobsList.tsx")).toContain("JobsList");
		expect(readScaffoldVariantFile("next-ops-dashboard", "golden", "lib/fetchOpsDashboard.ts")).toContain(
			"fetchOpsDashboard",
		);
		expect(readScaffoldVariantFile("next-ops-dashboard", "golden", "components/OpsDashboard.tsx")).toContain(
			"dataKey=\"label\"",
		);
	});

	test("broken-feature-add mirrors Point broken state (missing loader module)", () => {
		expect(readScaffoldVariantFile("next-ops-dashboard", "broken-feature-add", "lib/fetchOpsDashboard.ts")).toBeNull();
		expect(readScaffoldVariantFile("next-ops-dashboard", "broken-feature-add", "components/OpsDashboard.tsx")).toContain(
			"fetchOpsPanel",
		);
	});

	test("broken repair variants mirror Point wiring mistakes", () => {
		expect(readScaffoldVariantFile("next-ops-dashboard", "broken-chart-wiring", "components/OpsDashboard.tsx")).toContain(
			'dataKey="title"',
		);
		expect(readScaffoldVariantFile("next-ops-dashboard", "broken-sort-wiring", "components/OpsDashboard.tsx")).toContain(
			'sortBy: Column = "title"',
		);
		expect(
			readScaffoldVariantFile("next-ops-dashboard", "broken-filter-wiring", "components/OpsDashboard.tsx"),
		).toContain('filterColumn: Column = "title"');
		expect(
			readScaffoldVariantFile("next-ops-dashboard", "broken-page-size-wiring", "components/OpsDashboard.tsx"),
		).toContain("pageSize: PositiveInteger = 0");
		expect(
			readScaffoldVariantFile("next-ops-dashboard", "broken-refresh-wiring", "components/OpsDashboard.tsx"),
		).toContain("setInterval(refetch");
	});

	test("measured TS context is smaller than old char heuristic", () => {
		const metrics = measureAllPairedScaffoldCases("next-ops-dashboard");
		for (const item of metrics) {
			expect(item.brokenContextTokens).toBeGreaterThan(200);
			expect(item.brokenContextTokens).toBeLessThan(6000);
		}
	});

	test("README documents variants", () => {
		const readme = readFileSync(join(NEXT_DIR, "README.md"), "utf8");
		expect(readme).toContain("broken-feature-add");
		expect(readme).toContain("broken-chart-wiring");
	});
});
