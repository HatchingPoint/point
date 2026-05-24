import { join } from "node:path";
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
import { createPointCoreRepairPlan, sortDiagnosticsForRepairPlan } from "../packages/point/src/core/context.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

describe("agent repair multistep (repair-plan loop)", () => {
	for (const testCase of AGENT_REPAIR_MULTISTEP_CASES) {
		test(`${testCase.id}: repair-plan loop reaches passing check in ${testCase.expectedSteps} steps`, () => {
			const brokenSource = loadFixture(testCase.brokenFile);
			const fixedSource = loadFixture(testCase.fixedFile);
			const initial = runCheckJson(brokenSource, testCase.brokenFile);
			expect(initial.ok).toBe(false);
			expect(initial.diagnostics.length).toBeGreaterThanOrEqual(testCase.expectedSteps);

			const { source, stepsApplied, codes } = applyRepairPlanFromGolden(
				brokenSource,
				fixedSource,
				testCase.brokenFile,
				testCase.expectedSteps + 2,
			);
			expect(stepsApplied).toBe(testCase.expectedSteps);
			expect(codes).toEqual(testCase.expectedCodes);
			expect(source).toBe(fixedSource);
			expect(checkPointCore(parsePointSource(source, { cwd: join(import.meta.dir, ".."), input: `tests/fixtures/agent-repair/${testCase.brokenFile}` }))).toHaveLength(0);
		});
	}

	test("multistep benchmark reports all cases passing", () => {
		const results = runMultistepRepairBenchmark();
		expect(results.every((result) => result.passed)).toBe(true);
	});

	test("repair-plan orders steps by source position (notes: load before nav)", () => {
		const brokenSource = loadFixture("feature-multistep-notes-broken.point");
		const program = parsePointSource(brokenSource);
		const raw = mapPublicDiagnostics(program, checkPointCore(program));
		const plan = createPointCoreRepairPlan(raw);
		expect(plan.steps.map((step) => step.code)).toEqual(["unknown-load-action", "unknown-nav-page"]);
		expect(sortDiagnosticsForRepairPlan(raw)[0]?.code).toBe("unknown-load-action");
	});
});
