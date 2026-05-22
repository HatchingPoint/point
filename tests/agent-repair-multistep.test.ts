import { describe, expect, test } from "bun:test";
import {
	AGENT_REPAIR_MULTISTEP_CASES,
	applyRepairPlanFromGolden,
	evaluateMultistepRepair,
	loadFixture,
	runCheckJson,
	runMultistepRepairBenchmark,
} from "../scripts/agent-repair-sufficiency.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("agent repair multistep (repair-plan loop)", () => {
	for (const testCase of AGENT_REPAIR_MULTISTEP_CASES) {
		test(`${testCase.id}: repair-plan loop reaches passing check in ${testCase.expectedSteps} steps`, () => {
			const brokenSource = loadFixture(testCase.brokenFile);
			const fixedSource = loadFixture(testCase.fixedFile);
			const initial = runCheckJson(brokenSource);
			expect(initial.ok).toBe(false);
			expect(initial.diagnostics.length).toBeGreaterThanOrEqual(testCase.expectedSteps);

			const { source, stepsApplied, codes } = applyRepairPlanFromGolden(
				brokenSource,
				fixedSource,
				testCase.expectedSteps + 2,
			);
			expect(stepsApplied).toBe(testCase.expectedSteps);
			expect(codes).toEqual(testCase.expectedCodes);
			expect(source).toBe(fixedSource);
			expect(checkPointCore(parsePointSource(source))).toHaveLength(0);
		});
	}

	test("multistep benchmark reports all cases passing", () => {
		const results = runMultistepRepairBenchmark();
		expect(results.every((result) => result.passed)).toBe(true);
	});
});
