import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	AGENT_APP_BENCHMARK_CASES,
	evaluateAgentAppCase,
	summarizeAppTokenReduction,
} from "./agent-app-benchmark.ts";
import { runCheckJson, serializeCheckJson } from "./agent-repair-sufficiency.ts";
import { resolveTypescriptContext } from "./agent-app-benchmark.ts";

const repoRoot = join(import.meta.dir, "..");
const outputPath = join(repoRoot, "benchmarks/agent-app-cases.json");

function exportCase(testCase: (typeof AGENT_APP_BENCHMARK_CASES)[number]) {
	const baseSource = readFileSync(join(repoRoot, "tests/fixtures/agent-app", testCase.baseFile), "utf8");
	const brokenSource = readFileSync(join(repoRoot, "tests/fixtures/agent-app", testCase.brokenFile), "utf8");
	const goldenSource = readFileSync(join(repoRoot, "tests/fixtures/agent-app", testCase.goldenFile), "utf8");
	const result = evaluateAgentAppCase(testCase);
	const typescriptContext = resolveTypescriptContext(testCase);
	const brokenPayload = runCheckJson(brokenSource);
	const diagnostic = brokenPayload.diagnostics[0];
	const checkJson = diagnostic
		? serializeCheckJson({ schemaVersion: brokenPayload.schemaVersion, ok: false, diagnostics: [diagnostic] })
		: "";

	return {
		id: testCase.id,
		title: testCase.title,
		category: testCase.category,
		agentTask: testCase.agentTask,
		sourceExample: testCase.sourceExample,
		baseLines: result.baseLines,
		goldenLines: result.goldenLines,
		deltaLines: result.deltaLines,
		baseSource,
		brokenSource,
		goldenSource,
		checkJson,
		diagnosticCode: diagnostic?.code ?? "none",
		requiredDeclarations: testCase.requiredDeclarations,
		requiredNavPaths: testCase.requiredNavPaths,
		contextTokens: result.brokenCheckJsonTokens,
		contextChars: result.brokenCheckJsonChars,
		tsContextTokens: result.tsContextTokens,
		tsContextSource: result.tsContextSource,
		tsHeuristicTokens: result.tsHeuristicTokens,
		tsTaskDescription: testCase.typescriptContext.taskDescription,
		typescriptExcerpt: typescriptContext.excerpt,
		nextDashboardCaseId: testCase.nextDashboardCaseId ?? null,
		nextNotesCaseId: testCase.nextNotesCaseId ?? null,
		nextDashboardFilesMissing: typescriptContext.filesMissing,
		tokenReductionPercent: result.tokenReductionPercent,
		ciPass: result.passed,
	};
}

const cases = AGENT_APP_BENCHMARK_CASES.map(exportCase);
const tokenSummary = summarizeAppTokenReduction();

const report = {
	schemaVersion: "point.agent-app-cases.v1",
	generatedAt: new Date().toISOString(),
	cases,
	summary: {
		caseCount: cases.length,
		categories: [...new Set(cases.map((item) => item.category))],
		tokenReductionPercent: tokenSummary,
	},
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(
	`Cases: ${cases.length} · token reduction ${tokenSummary.minReductionPercent}–${tokenSummary.maxReductionPercent}% (avg ${tokenSummary.avgReductionPercent}%)`,
);
