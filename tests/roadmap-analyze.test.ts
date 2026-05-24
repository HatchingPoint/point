import { describe, expect, test } from "bun:test";
import { analyzePointRoadmap, POINT_ROADMAP_ANALYZE_SCHEMA } from "../packages/point/src/core/roadmap-analyze.ts";

describe("point roadmap-analyze", () => {
	test("returns structured expansion evidence", async () => {
		const analysis = await analyzePointRoadmap(process.cwd());
		expect(analysis.schemaVersion).toBe(POINT_ROADMAP_ANALYZE_SCHEMA);
		expect(analysis.activePhases.some((phase) => phase.number === 28)).toBe(true);
		expect(analysis.nextSuggestedPhaseNumber).toBeGreaterThanOrEqual(30);
		expect(analysis.auditGaps.length).toBeGreaterThan(0);
		expect(analysis.expansionHints.length).toBeGreaterThan(0);
	});
});
