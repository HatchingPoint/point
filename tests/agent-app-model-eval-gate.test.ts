import { describe, expect, test } from "bun:test";
import {
	AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS,
	runAgentAppModelEvalGate,
} from "../scripts/agent-app-model-eval-gate.ts";
import { AGENT_APP_BENCHMARK_CASES } from "../scripts/agent-app-benchmark.ts";

describe("agent app model eval gate", () => {
	test("registered cases meet minimum gate threshold", () => {
		expect(AGENT_APP_BENCHMARK_CASES.length).toBeGreaterThanOrEqual(
			AGENT_APP_MODEL_EVAL_GATE_THRESHOLDS.minCases,
		);
	});

	test("runAgentAppModelEvalGate passes with current fixtures", () => {
		const result = runAgentAppModelEvalGate();
		expect(result.passed).toBe(true);
		expect(result.goldenEdits.failed).toHaveLength(0);
		expect(result.thresholdViolations).toHaveLength(0);
	});

	test("benchmark:agent-app:model-eval-gate script exits zero", async () => {
		const proc = Bun.spawn(["bun", "scripts/agent-app-model-eval-gate.ts"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);
	});
});
