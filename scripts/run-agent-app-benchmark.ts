#!/usr/bin/env bun
import {
	AGENT_APP_BENCHMARK_CASES,
	runAgentAppBenchmark,
	summarizeAppTokenReduction,
} from "./agent-app-benchmark.ts";

console.log("Point agent app benchmark");
console.log("=".repeat(60));

const results = runAgentAppBenchmark();
for (const result of results) {
	const testCase = AGENT_APP_BENCHMARK_CASES.find((item) => item.id === result.id)!;
	console.log(`\n${result.id} — ${testCase.title}`);
	console.log(`  category: ${testCase.category}`);
	console.log(`  base → golden: ${result.baseLines} → ${result.goldenLines} lines (+${result.deltaLines})`);
	console.log(`  broken check-json: ~${result.brokenCheckJsonTokens} tok (${result.brokenCheckJsonChars} chars)`);
	console.log(`  TS task paste heuristic: ~${result.tsContextTokens.toLocaleString()} tok`);
	console.log(`  context saved: ${result.tokenReductionPercent}%`);
	console.log(`  golden check: ${result.goldenCheckPasses ? "pass" : "fail"}`);
	console.log(`  broken diagnostic: ${result.brokenHasExpectedDiagnostic ? testCase.expectedCode : "missing"}`);
	console.log(`  structural checks: ${result.structuralChecksPass ? "pass" : "fail"}`);
	console.log(`  overall: ${result.passed ? "PASS" : "FAIL"}`);
}

const summary = summarizeAppTokenReduction();
console.log("\n" + "=".repeat(60));
console.log(
	`Token reduction vs illustrative full-app TS paste: ${summary.minReductionPercent}–${summary.maxReductionPercent}% (avg ${summary.avgReductionPercent}%)`,
);
console.log(`Cases: ${results.length} · passed: ${results.filter((item) => item.passed).length}/${results.length}`);

if (!results.every((item) => item.passed)) process.exit(1);
