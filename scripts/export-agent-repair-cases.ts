#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	AGENT_REPAIR_CASES,
	AGENT_REPAIR_MULTISTEP_CASES,
	applyRepairPlanFromGolden,
	estimateTokens,
	loadFixture,
	runCheckJson,
	serializeCheckJson,
	summarizeTokenReduction,
	type AgentRepairCase,
	type AgentRepairMultistepCase,
} from "./agent-repair-sufficiency.ts";

const repoRoot = join(import.meta.dir, "..");
const outputPath = join(repoRoot, "benchmarks/agent-repair-cases.json");

function exportCase(testCase: AgentRepairCase) {
	const brokenSource = loadFixture(testCase.brokenFile);
	const fixedSource = loadFixture(testCase.fixedFile);
	const payload = runCheckJson(brokenSource, testCase.brokenFile);
	const diagnostic = payload.diagnostics[0];
	if (!diagnostic?.span) {
		throw new Error(`Fixture ${testCase.id} missing diagnostic span`);
	}

	const checkJson = serializeCheckJson({
		schemaVersion: payload.schemaVersion,
		ok: false,
		diagnostics: [diagnostic],
	});
	const expected = Array.isArray(diagnostic.expected)
		? diagnostic.expected
		: diagnostic.expected
			? [diagnostic.expected]
			: [];

	return {
		id: testCase.id,
		title: testCase.title,
		category: testCase.category,
		agentTask: testCase.agentTask,
		repairMode: testCase.repairMode,
		summary: `tests/fixtures/agent-repair/${testCase.brokenFile}`,
		fixturePath: `tests/fixtures/agent-repair/${testCase.brokenFile}`,
		brokenSource,
		fixedSource,
		errorLine: diagnostic.span.start.line,
		checkJson,
		diagnosticCode: diagnostic.code,
		typescriptExcerpt: testCase.typescriptContext.excerpt,
		typescriptNote: `Illustrative ~${testCase.typescriptContext.totalChars.toLocaleString()}-char paste heuristic. Not from a logged agent session.`,
		typescriptTotalChars: testCase.typescriptContext.totalChars,
		tscError: testCase.typescriptContext.tscError,
		ref: diagnostic.ref,
		repairHint: diagnostic.repair ?? "",
		expectedFields: expected.map(String),
		contextChars: checkJson.length,
		contextTokens: estimateTokens(checkJson),
		tsContextTokens: estimateTokens("x".repeat(testCase.typescriptContext.totalChars)),
		tokenReductionPercent:
			testCase.typescriptContext.totalChars > 0
				? Math.round(
						(1 - estimateTokens(checkJson) / estimateTokens("x".repeat(testCase.typescriptContext.totalChars))) *
							100,
					)
				: 0,
		ciPass: true,
	};
}

function exportMultistepCase(testCase: AgentRepairMultistepCase) {
	const brokenSource = loadFixture(testCase.brokenFile);
	const fixedSource = loadFixture(testCase.fixedFile);
	const firstPayload = runCheckJson(brokenSource, testCase.brokenFile);
	const firstDiagnostic = firstPayload.diagnostics[0];
	if (!firstDiagnostic?.span) {
		throw new Error(`Multistep fixture ${testCase.id} missing first diagnostic span`);
	}
	const checkJson = serializeCheckJson({
		schemaVersion: firstPayload.schemaVersion,
		ok: false,
		diagnostics: [firstDiagnostic],
	});
	const { stepsApplied, codes } = applyRepairPlanFromGolden(brokenSource, fixedSource, testCase.brokenFile, testCase.expectedSteps + 2);
	return {
		id: testCase.id,
		title: testCase.title,
		category: "feature-build" as const,
		agentTask: testCase.agentTask,
		repairMode: "repair-plan" as const,
		summary: `tests/fixtures/agent-repair/${testCase.brokenFile}`,
		fixturePath: `tests/fixtures/agent-repair/${testCase.brokenFile}`,
		brokenSource,
		fixedSource,
		errorLine: firstDiagnostic.span.start.line,
		checkJson,
		diagnosticCode: firstDiagnostic.code,
		repairSteps: testCase.expectedSteps,
		repairStepCodes: testCase.expectedCodes,
		repairStepsApplied: stepsApplied,
		typescriptExcerpt: testCase.typescriptContext.excerpt,
		typescriptNote: `Illustrative ~${testCase.typescriptContext.totalChars.toLocaleString()}-char paste heuristic. Not from a logged agent session.`,
		typescriptTotalChars: testCase.typescriptContext.totalChars,
		tscError: testCase.typescriptContext.tscError,
		ref: firstDiagnostic.ref,
		repairHint: firstDiagnostic.repair ?? "",
		expectedFields: [],
		contextChars: checkJson.length,
		contextTokens: estimateTokens(checkJson),
		tsContextTokens: estimateTokens("x".repeat(testCase.typescriptContext.totalChars)),
		tokenReductionPercent:
			testCase.typescriptContext.totalChars > 0
				? Math.round(
						(1 - estimateTokens(checkJson) / estimateTokens("x".repeat(testCase.typescriptContext.totalChars))) *
							100,
					)
				: 0,
		ciPass: stepsApplied === testCase.expectedSteps && codes.join(",") === testCase.expectedCodes.join(","),
	};
}

const cases = [...AGENT_REPAIR_CASES.map(exportCase), ...AGENT_REPAIR_MULTISTEP_CASES.map(exportMultistepCase)];
const tokenSummary = summarizeTokenReduction();
const report = {
	schemaVersion: "point.agent-repair-cases.v1",
	generatedAt: new Date().toISOString(),
	cases,
	summary: {
		caseCount: cases.length,
		diagnosticCodes: [...new Set(cases.map((item) => item.diagnosticCode))],
		categories: [...new Set(cases.map((item) => item.category))],
		featureBuildCount: cases.filter((item) => item.category === "feature-build").length,
		multistepCount: cases.filter((item) => item.repairMode === "repair-plan").length,
		tokenReductionPercent: tokenSummary,
	},
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(
	`Cases: ${cases.length} · token reduction ${tokenSummary.minReductionPercent}–${tokenSummary.maxReductionPercent}% (avg ${tokenSummary.avgReductionPercent}%)`,
);
