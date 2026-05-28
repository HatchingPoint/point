#!/usr/bin/env bun
import {
	AGENT_REPAIR_CASES,
	AGENT_REPAIR_MULTISTEP_CASES,
	runMultistepRepairBenchmark,
	runRepairSufficiencyBenchmark,
} from "./agent-repair-sufficiency.ts";

/** Minimum fixture counts — bump when adding cases; gate fails if cases are removed silently. */
export const AGENT_REPAIR_GATE_THRESHOLDS = {
	minSingleShotCases: 37,
	minMultistepCases: 4,
	/** All registered cases must pass sufficiency (no partial credit). */
	requiredPassRate: 1,
} as const;

export type AgentRepairGateSection = {
	total: number;
	passed: number;
	failed: string[];
};

export type AgentRepairGateResult = {
	passed: boolean;
	singleShot: AgentRepairGateSection;
	multistep: AgentRepairGateSection;
	thresholdViolations: string[];
};

export function runAgentRepairGate(): AgentRepairGateResult {
	const thresholdViolations: string[] = [];

	if (AGENT_REPAIR_CASES.length < AGENT_REPAIR_GATE_THRESHOLDS.minSingleShotCases) {
		thresholdViolations.push(
			`single-shot fixtures: expected at least ${AGENT_REPAIR_GATE_THRESHOLDS.minSingleShotCases}, got ${AGENT_REPAIR_CASES.length}`,
		);
	}
	if (AGENT_REPAIR_MULTISTEP_CASES.length < AGENT_REPAIR_GATE_THRESHOLDS.minMultistepCases) {
		thresholdViolations.push(
			`multistep fixtures: expected at least ${AGENT_REPAIR_GATE_THRESHOLDS.minMultistepCases}, got ${AGENT_REPAIR_MULTISTEP_CASES.length}`,
		);
	}

	const singleResults = runRepairSufficiencyBenchmark();
	const multistepResults = runMultistepRepairBenchmark();

	const singleFailed = singleResults.filter((result) => !result.passed).map((result) => result.id);
	const multistepFailed = multistepResults.filter((result) => !result.passed).map((result) => result.id);

	const singleShot: AgentRepairGateSection = {
		total: singleResults.length,
		passed: singleResults.length - singleFailed.length,
		failed: singleFailed,
	};
	const multistep: AgentRepairGateSection = {
		total: multistepResults.length,
		passed: multistepResults.length - multistepFailed.length,
		failed: multistepFailed,
	};

	const passRate =
		singleShot.total + multistep.total > 0
			? (singleShot.passed + multistep.passed) / (singleShot.total + multistep.total)
			: 0;
	if (passRate < AGENT_REPAIR_GATE_THRESHOLDS.requiredPassRate) {
		thresholdViolations.push(
			`pass rate: expected ${AGENT_REPAIR_GATE_THRESHOLDS.requiredPassRate * 100}%, got ${Math.round(passRate * 100)}%`,
		);
	}

	const passed =
		thresholdViolations.length === 0 && singleFailed.length === 0 && multistepFailed.length === 0;

	return { passed, singleShot, multistep, thresholdViolations };
}

function printGateResult(result: AgentRepairGateResult): void {
	console.log("Point agent repair CI gate");
	console.log("==========================");
	console.log(
		`Threshold: ${AGENT_REPAIR_GATE_THRESHOLDS.requiredPassRate * 100}% pass · ≥${AGENT_REPAIR_GATE_THRESHOLDS.minSingleShotCases} single-shot · ≥${AGENT_REPAIR_GATE_THRESHOLDS.minMultistepCases} multistep`,
	);
	console.log("");
	console.log(
		`Single-shot: ${result.singleShot.passed}/${result.singleShot.total} passed` +
			(result.singleShot.failed.length ? ` · failed: ${result.singleShot.failed.join(", ")}` : ""),
	);
	console.log(
		`Multistep:   ${result.multistep.passed}/${result.multistep.total} passed` +
			(result.multistep.failed.length ? ` · failed: ${result.multistep.failed.join(", ")}` : ""),
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
	const result = runAgentRepairGate();
	printGateResult(result);
	if (!result.passed) {
		process.exit(1);
	}
}
