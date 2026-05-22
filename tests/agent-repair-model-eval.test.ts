import { describe, expect, test } from "bun:test";
import {
	AGENT_REPAIR_CASES,
	applyLineRepairFromGolden,
	estimateTokens,
	loadFixture,
	runCheckJson,
} from "../scripts/agent-repair-sufficiency.ts";
import {
	applyFixedLine,
	buildEvalPrompt,
	parseModelJson,
	summarizeRuns,
	verifyPointSource,
	type ModelEvalRun,
} from "../scripts/agent-repair-model-eval.ts";

describe("agent repair model eval", () => {
	test("buildEvalPrompt — Point workflow context is smaller than TS paste estimate", () => {
		for (const testCase of AGENT_REPAIR_CASES) {
			const point = buildEvalPrompt(testCase, "point");
			const ts = buildEvalPrompt(testCase, "typescript");
			const tsMeta = testCase.id === "unknown-field-rule" ? 12000 : 4200;
			expect(point.contextTokens).toBeLessThan(estimateTokens("x".repeat(tsMeta)));
			expect(point.context).toContain("point check-json output:");
			expect(ts.context).toContain("TypeScript compiler error:");
		}
	});

	test("parseModelJson handles fenced and bare JSON", () => {
		expect(parseModelJson('{"fixedLine":"  add 30 when signals.has bundle id"}').fixedLine).toContain("has bundle id");
		expect(
			parseModelJson('```json\n{"fixedLine":"  when user.active return user.name"}\n```').fixedLine,
		).toContain("user.active");
	});

	test("golden line passes verifyPointSource for every fixture", () => {
		for (const testCase of AGENT_REPAIR_CASES) {
			const broken = loadFixture(testCase.brokenFile);
			const fixed = loadFixture(testCase.fixedFile);
			const diagnostic = runCheckJson(broken).diagnostics[0]!;
			const repaired = applyLineRepairFromGolden(broken, fixed, diagnostic);
			expect(verifyPointSource(repaired)).toBe(true);
		}
	});

	test("summarizeRuns aggregates by model and condition", () => {
		const runs: ModelEvalRun[] = [
			{
				modelId: "gpt-4o-mini",
				modelLabel: "GPT-4o mini",
				provider: "openai",
				caseId: "unknown-field-rule",
				condition: "point",
				success: true,
				checkPassed: true,
				contextChars: 200,
				contextTokens: 50,
				promptTokens: 120,
				completionTokens: 30,
				latencyMs: 400,
				fixedLine: "x",
				modelResponseExcerpt: null,
				error: null,
			},
			{
				modelId: "gpt-4o-mini",
				modelLabel: "GPT-4o mini",
				provider: "openai",
				caseId: "unknown-field-rule",
				condition: "typescript",
				success: false,
				checkPassed: false,
				contextChars: 4000,
				contextTokens: 1000,
				promptTokens: 1100,
				completionTokens: 40,
				latencyMs: 500,
				fixedLine: null,
				modelResponseExcerpt: null,
				error: "point check failed",
			},
		];
		const summary = summarizeRuns(runs);
		expect(summary.overall.point.rate).toBe(100);
		expect(summary.overall.typescript.rate).toBe(0);
		expect(summary.byModel["gpt-4o-mini"]?.point.passed).toBe(1);
	});

	test("applyFixedLine replaces only the target line", () => {
		const source = "a\nb\nc";
		expect(applyFixedLine(source, 2, "B")).toBe("a\nB\nc");
	});
});
