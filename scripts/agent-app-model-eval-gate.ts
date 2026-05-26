#!/usr/bin/env bun
import { AGENT_APP_BENCHMARK_CASES } from "./agent-app-benchmark.ts";
import {
	evalModeForCase,
	goldenEditsForCase,
	verifyGoldenEditsPass,
} from "./agent-app-model-eval.ts";

/** Minimum fixture counts — bump when adding cases; gate fails if cases are removed silently. */
export const AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS = {
	minCases: 13,
	/** Every case must have golden-derived edits that pass point check (no LLM). */
	requiredGoldenEditPassRate: 1,
} as const;

export type AgentAppModelEvalGateSection = {
	total: number;
	passed: number;
	failed: string[];
};

export type AgentAppModelEvalGateResult = {
	passed: boolean;
	goldenEdits: AgentAppModelEvalGateSection;
	thresholdViolations: string[];
};

export function runAgentAppModelEvalGate(): AgentAppModelEvalGateResult {
	const thresholdViolations: string[] = [];

	if (AGENT_APP_BENCHMARK_CASES.length < AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.minCases) {
		thresholdViolations.push(
			`agent-app fixtures: expected at least ${AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.minCases}, got ${AGENT_APP_BENCHMARK_CASES.length}`,
		);
	}

	const failed: string[] = [];
	for (const testCase of AGENT_APP_BENCHMARK_CASES) {
		const issues: string[] = [];
		const edits = goldenEditsForCase(testCase);
		if (edits.length === 0) {
			issues.push("missing golden edits");
		} else if (!verifyGoldenEditsPass(testCase)) {
			issues.push("golden edits fail check");
		}
		if (testCase.category === "app-repair" && evalModeForCase(testCase) !== "single-line") {
			issues.push("app-repair must use single-line eval mode");
		}
		if (testCase.category !== "app-repair" && evalModeForCase(testCase) !== "multi-edit") {
			issues.push("feature/refactor must use multi-edit eval mode");
		}
		if (issues.length > 0) {
			failed.push(`${testCase.id} (${issues.join("; ")})`);
		}
	}

	const goldenEdits: AgentAppModelEvalGateSection = {
		total: AGENT_APP_BENCHMARK_CASES.length,
		passed: AGENT_APP_BENCHMARK_CASES.length - failed.length,
		failed,
	};

	const passRate =
		goldenEdits.total > 0 ? goldenEdits.passed / goldenEdits.total : 0;
	if (passRate < AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.requiredGoldenEditPassRate) {
		thresholdViolations.push(
			`golden edit pass rate: expected ${AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.requiredGoldenEditPassRate * 100}%, got ${Math.round(passRate * 100)}%`,
		);
	}

	const passed = thresholdViolations.length === 0 && failed.length === 0;

	return { passed, goldenEdits, thresholdViolations };
}

function printGateResult(result: AgentAppModelEvalGateResult): void {
	console.log("Point agent app model-eval CI gate");
	console.log("==================================");
	console.log(
		`Threshold: ${AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.requiredGoldenEditPassRate * 100}% golden-edit pass · ≥${AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.minCases} cases · no LLM`,
	);
	console.log("");
	console.log(
		`Golden edits: ${result.goldenEdits.passed}/${result.goldenEdits.total} passed` +
			(result.goldenEdits.failed.length ? ` · failed: ${result.goldenEdits.failed.join(", ")}` : ""),
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
	const result = runAgentAppModelEvalGate();
	printGateResult(result);
	if (!result.passed) {
		process.exit(1);
	}
}
