import { describe, expect, test } from "bun:test";
import {
	AGENT_REPAIR_CASES,
	assertDiagnosticIsAgentReady,
	applyLineRepairFromGolden,
	evaluateRepairSufficiency,
	expectedListIncludesFixField,
	loadFixture,
	runCheckJson,
	serializeCheckJson,
	summarizeTokenReduction,
} from "../scripts/agent-repair-sufficiency.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

describe("agent repair sufficiency", () => {
	for (const testCase of AGENT_REPAIR_CASES) {
		test(`${testCase.id}: check-json is sufficient to reach a passing check`, () => {
			const brokenSource = loadFixture(testCase.brokenFile);
			const fixedSource = loadFixture(testCase.fixedFile);
			const payload = runCheckJson(brokenSource);

			expect(payload.ok).toBe(false);
			expect(payload.diagnostics.length).toBeGreaterThan(0);

			const diagnostic = payload.diagnostics[0]!;
			assertDiagnosticIsAgentReady(diagnostic);
			expect(diagnostic.code).toBe(testCase.expectedCode);

			if (testCase.chosenField) {
				expect(expectedListIncludesFixField(diagnostic, testCase.chosenField)).toBe(true);
			}

			const repaired = applyLineRepairFromGolden(brokenSource, fixedSource, diagnostic);
			expect(repaired).toBe(fixedSource);
			expect(checkPointCore(parsePointSource(repaired))).toHaveLength(0);
		});
	}

	test("check-json context stays compact per case", () => {
		for (const testCase of AGENT_REPAIR_CASES) {
			const payload = runCheckJson(loadFixture(testCase.brokenFile));
			const diagnostic = payload.diagnostics[0]!;
			const context = serializeCheckJson({
				schemaVersion: "point.core.check.v1",
				ok: false,
				diagnostics: [diagnostic],
			});
			expect(context.length).toBeLessThan(1200);
		}
	});

	test("check-json expected lists Point source field syntax for agents", () => {
		const payload = runCheckJson(loadFixture("unknown-field-broken.point"));
		const diagnostic = payload.diagnostics[0]!;
		const expected = Array.isArray(diagnostic.expected) ? diagnostic.expected : [diagnostic.expected!];
		expect(expected).toContain("has bundle id");
		expect(expected).toContain("submitted for review");
		expect(diagnostic.repair).toContain("has bundle id");
	});

	test("benchmark harness reports all cases passing", () => {
		const results = AGENT_REPAIR_CASES.map((testCase) => evaluateRepairSufficiency(testCase));
		expect(results.every((result) => result.passed)).toBe(true);
		expect(results.every((result) => result.estimatedTokens < 350)).toBe(true);
	});

	test("Point check-json stays much smaller than TS paste heuristics", () => {
		const summary = summarizeTokenReduction();
		expect(summary.minReductionPercent).toBeGreaterThanOrEqual(75);
		expect(summary.maxReductionPercent).toBeGreaterThanOrEqual(85);
	});
});
