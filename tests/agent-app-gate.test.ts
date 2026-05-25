import { describe, expect, test } from "bun:test";
import {
	AGENT_APP_GATE_THRESHOLDS,
	runAgentAppGate,
} from "../scripts/agent-app-gate.ts";
import { AGENT_APP_BENCHMARK_CASES } from "../scripts/agent-app-benchmark.ts";

describe("agent app gate", () => {
	test("registered cases meet minimum gate threshold", () => {
		expect(AGENT_APP_BENCHMARK_CASES.length).toBeGreaterThanOrEqual(
			AGENT_APP_GATE_THRESHOLDS.minCases,
		);
	});

	test("runAgentAppGate passes with current fixtures", () => {
		const result = runAgentAppGate();
		expect(result.passed).toBe(true);
		expect(result.cases.failed).toHaveLength(0);
		expect(result.thresholdViolations).toHaveLength(0);
	});

	test("benchmark:agent-app:gate script exits zero", async () => {
		const proc = Bun.spawn(["bun", "scripts/agent-app-gate.ts"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);
	});
});
