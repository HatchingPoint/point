import { describe, expect, test } from "bun:test";
import { AGENT_APP_BENCHMARK_CASES } from "../scripts/agent-app-benchmark.ts";
import {
	applyAppEdits,
	buildAppEvalPrompt,
	buildAppTscError,
	evalModeForCase,
	goldenEditsForCase,
	numberSourceLines,
	parseAppModelResponse,
	summarizeAppRuns,
	verifyGoldenEditsPass,
	type AppModelEvalRun,
} from "../scripts/agent-app-model-eval.ts";
import { loadAppFixture } from "../scripts/agent-app-benchmark.ts";
import { estimateTokens } from "../scripts/agent-repair-sufficiency.ts";

describe("agent app model eval", () => {
	for (const testCase of AGENT_APP_BENCHMARK_CASES) {
		test(`${testCase.id}: eval mode matches category`, () => {
			expect(evalModeForCase(testCase)).toBe(testCase.category === "app-repair" ? "single-line" : "multi-edit");
		});

		test(`${testCase.id}: golden-derived edits pass point check`, () => {
			expect(verifyGoldenEditsPass(testCase)).toBe(true);
		});

		test(`${testCase.id}: Point workflow context is smaller than TS scaffold`, () => {
			const point = buildAppEvalPrompt(testCase, "point");
			const ts = buildAppEvalPrompt(testCase, "typescript");
			expect(point.contextTokens).toBeLessThan(ts.contextTokens);
			expect(point.context).toContain("point check-json output:");
			expect(ts.context).toContain("TypeScript compiler error:");
			expect(buildAppTscError(testCase)).toContain("error TS");
		});
	}

	test("parseAppModelResponse handles multi-edit JSON", () => {
		const parsed = parseAppModelResponse(
			'{"edits":[{"kind":"insertAfterLine","line":37,"lines":["action search items"]},{"kind":"replaceLine","line":58,"text":"  load data from action search items"}]}',
			"multi-edit",
		);
		expect(parsed.edits).toHaveLength(2);
	});

	test("applyAppEdits uses original line numbers bottom-up", () => {
		const source = "a\nb\nc\nd";
		const edited = applyAppEdits(source, [
			{ kind: "insertAfterLine", line: 2, lines: ["B2"] },
			{ kind: "replaceLine", line: 3, text: "C2" },
		]);
		expect(edited).toBe("a\nb\nB2\nC2\nd");
	});

	test("numberSourceLines prefixes each line", () => {
		expect(numberSourceLines("a\nb")).toContain("  1| a");
		expect(numberSourceLines("a\nb")).toContain("  2| b");
	});

	test("goldenEditsForCase matches fixture intent", () => {
		const featureEdits = goldenEditsForCase(AGENT_APP_BENCHMARK_CASES[0]!);
		expect(featureEdits.some((edit) => edit.kind === "insertAfterLine")).toBe(true);
		const wiringEdits = goldenEditsForCase(AGENT_APP_BENCHMARK_CASES[1]!);
		expect(wiringEdits[0]).toEqual({
			kind: "replaceLine",
			line: 58,
			text: "  load data from action search items",
		});
	});

	test("golden edits on real broken fixtures pass check", () => {
		for (const testCase of AGENT_APP_BENCHMARK_CASES) {
			const candidate = applyAppEdits(loadAppFixture(testCase.brokenFile), goldenEditsForCase(testCase));
			expect(candidate.split("\n").length).toBeGreaterThan(0);
			expect(verifyGoldenEditsPass(testCase)).toBe(true);
		}
	});

	test("summarizeAppRuns aggregates by model, condition, and category", () => {
		const runs: AppModelEvalRun[] = [
			{
				modelId: "gpt-4.1",
				modelLabel: "GPT-4.1",
				provider: "openai",
				caseId: "dashboard-add-search",
				category: "feature-add",
				condition: "point",
				mode: "multi-edit",
				success: true,
				checkPassed: true,
				contextChars: 800,
				contextTokens: 200,
				promptTokens: 900,
				completionTokens: 120,
				latencyMs: 1200,
				stepsUsed: 1,
				editCount: 3,
				modelResponseExcerpt: null,
				error: null,
			},
		];
		const summary = summarizeAppRuns(runs);
		expect(summary.overall.point.rate).toBe(100);
		expect(summary.byCategory["feature-add"]?.point.passed).toBe(1);
		expect(estimateTokens("x".repeat(800))).toBeGreaterThan(100);
	});
});
