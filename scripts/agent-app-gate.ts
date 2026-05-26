#!/usr/bin/env bun
import { AGENT_APP_BENCHMARK_CASES, runAgentAppBenchmark } from "./agent-app-benchmark.ts";

/** Minimum fixture counts — bump when adding cases; gate fails if cases are removed silently. */
export const AGENT_APP_GATE_THRESHOLDS = {
	minCases: 13,
	/** All registered cases must pass structural + diagnostic checks (no partial credit). */
	requiredPassRate: 1,
} as const;

export type AgentAppGateSection = {
	total: number;
	passed: number;
	failed: string[];
};

export type AgentAppGateResult = {
	passed: boolean;
	cases: AgentAppGateSection;
	thresholdViolations: string[];
};

export function runAgentAppGate(): AgentAppGateResult {
	const thresholdViolations: string[] = [];

	if (AGENT_APP_BENCHMARK_CASES.length < AGENT_APP_GATE_THRESHOLDS.minCases) {
		thresholdViolations.push(
			`agent-app fixtures: expected at least ${AGENT_APP_GATE_THRESHOLDS.minCases}, got ${AGENT_APP_BENCHMARK_CASES.length}`,
		);
	}

	const results = runAgentAppBenchmark();
	const failed = results.filter((result) => !result.passed).map((result) => result.id);

	const cases: AgentAppGateSection = {
		total: results.length,
		passed: results.length - failed.length,
		failed,
	};

	const passRate = cases.total > 0 ? cases.passed / cases.total : 0;
	if (passRate < AGENT_APP_GATE_THRESHOLDS.requiredPassRate) {
		thresholdViolations.push(
			`pass rate: expected ${AGENT_APP_GATE_THRESHOLDS.requiredPassRate * 100}%, got ${Math.round(passRate * 100)}%`,
		);
	}

	const passed = thresholdViolations.length === 0 && failed.length === 0;

	return { passed, cases, thresholdViolations };
}

function printGateResult(result: AgentAppGateResult): void {
	console.log("Point agent app CI gate");
	console.log("=======================");
	console.log(
		`Threshold: ${AGENT_APP_GATE_THRESHOLDS.requiredPassRate * 100}% pass · ≥${AGENT_APP_GATE_THRESHOLDS.minCases} cases`,
	);
	console.log("");
	console.log(
		`Cases: ${result.cases.passed}/${result.cases.total} passed` +
			(result.cases.failed.length ? ` · failed: ${result.cases.failed.join(", ")}` : ""),
	);

	if (result.thresholdViolations.length > 0) {
		console.log("");
		console.log("Threshold violations:");
		for (const violation of result.thresholdViolations) {
			console.log(`  - ${violation}`);
		}
	}

	console.log("");
	console.log(result.passed ? "Gate PASSED" : "Gate FAILED");
}

if (import.meta.main) {
	const result = runAgentAppGate();
	printGateResult(result);
	if (!result.passed) {
		process.exit(1);
	}
}
