#!/usr/bin/env bun
import { AGENT_REPAIR_CASES, estimateTokens, loadFixture, runRepairSufficiencyBenchmark, serializeCheckJson, runCheckJson } from "./agent-repair-sufficiency.ts";

const results = runRepairSufficiencyBenchmark();
const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;

console.log("Point agent repair sufficiency benchmark");
console.log("========================================");
console.log(`Cases: ${results.length}  Passed: ${passed}  Failed: ${failed}`);
console.log("");

for (const result of results) {
	const status = result.passed ? "PASS" : "FAIL";
	console.log(`[${status}] ${result.id}`);
	console.log(`  code: ${result.diagnosticCode}`);
	console.log(`  ref: ${result.ref ?? "n/a"}`);
	console.log(`  check-json context: ~${result.estimatedTokens} tokens (${result.contextChars} chars)`);
	console.log(`  expected includes fix: ${result.expectedIncludesFix}`);
	console.log(`  check passes after repair: ${result.checkPassesAfterRepair}`);
	console.log("");
}

const typicalTsPasteChars = 12_000;
console.log("Context comparison (same repair task)");
console.log(`  TypeScript file paste heuristic: ~${estimateTokens("x".repeat(typicalTsPasteChars))} tokens (${typicalTsPasteChars} chars)`);
for (const testCase of AGENT_REPAIR_CASES) {
	const payload = runCheckJson(loadFixture(testCase.brokenFile), testCase.brokenFile);
	const diagnostic = payload.diagnostics[0];
	if (!diagnostic) continue;
	const context = serializeCheckJson({ schemaVersion: "point.core.check.v1", ok: false, diagnostics: [diagnostic] });
	console.log(`  ${testCase.id} check-json only: ~${estimateTokens(context)} tokens (${context.length} chars)`);
}

if (failed > 0) {
	process.exit(1);
}

console.log("All sufficiency cases passed.");
