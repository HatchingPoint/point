import { describe, expect, test } from "bun:test";
import {
	AGENT_APP_BENCHMARK_CASES,
	evaluateAgentAppCase,
	evaluateStructuralChecks,
	loadAppFixture,
	runAgentAppBenchmark,
	simulateAppRepairFromGolden,
	summarizeAppTokenReduction,
} from "../scripts/agent-app-benchmark.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("agent app benchmark", () => {
	for (const testCase of AGENT_APP_BENCHMARK_CASES) {
		test(`${testCase.id}: golden app passes check and adds required structure`, () => {
			const goldenSource = loadAppFixture(testCase.goldenFile);
			expect(checkPointCore(parsePointSource(goldenSource))).toHaveLength(0);
			expect(evaluateStructuralChecks(testCase, goldenSource)).toBe(true);
			if (testCase.category === "feature-add") {
				const baseLines = loadAppFixture(testCase.baseFile).split("\n").length;
				expect(goldenSource.split("\n").length).toBeGreaterThan(baseLines);
			}
		});

		test(`${testCase.id}: broken app surfaces agent-ready diagnostic`, () => {
			const result = evaluateAgentAppCase(testCase);
			expect(result.brokenHasExpectedDiagnostic).toBe(true);
			expect(result.brokenCheckJsonChars).toBeLessThan(2000);
		});

		test(`${testCase.id}: check-json loop can reach passing app when category is app-repair`, () => {
			if (testCase.category !== "app-repair") return;
			const simulation = simulateAppRepairFromGolden(testCase);
			expect(simulation.checkPasses).toBe(true);
			expect(simulation.stepsApplied).toBeGreaterThan(0);
		});
	}

	test("benchmark summary reports all cases passing", () => {
		const results = runAgentAppBenchmark();
		expect(results.every((item) => item.passed)).toBe(true);
	});

	test("full-app tasks stay smaller than paired Next.js scaffold paste", () => {
		const summary = summarizeAppTokenReduction();
		expect(summary.minReductionPercent).toBeGreaterThanOrEqual(45);
		expect(summary.avgReductionPercent).toBeGreaterThanOrEqual(60);
	});
});
