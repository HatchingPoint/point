import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
	AGENT_REPAIR_GATE_THRESHOLDS,
	runAgentRepairGate,
} from "../scripts/agent-repair-gate.ts";
import {
	AGENT_REPAIR_CASES,
	AGENT_REPAIR_MULTISTEP_CASES,
} from "../scripts/agent-repair-sufficiency.ts";

const repoRoot = join(import.meta.dir, "..");

describe("agent repair gate", () => {
	test("runAgentRepairGate passes with current fixtures", () => {
		const result = runAgentRepairGate();
		expect(result.passed).toBe(true);
		expect(result.singleShot.failed).toEqual([]);
		expect(result.multistep.failed).toEqual([]);
		expect(result.thresholdViolations).toEqual([]);
	});

	test("thresholds match registered fixture counts", () => {
		expect(AGENT_REPAIR_CASES.length).toBeGreaterThanOrEqual(
			AGENT_REPAIR_GATE_THRESHOLDS.minSingleShotCases,
		);
		expect(AGENT_REPAIR_MULTISTEP_CASES.length).toBeGreaterThanOrEqual(
			AGENT_REPAIR_GATE_THRESHOLDS.minMultistepCases,
		);
	});

	test("benchmark:agent-repair:gate script exits zero", async () => {
		const proc = Bun.spawn(["bun", "scripts/agent-repair-gate.ts"], {
			cwd: repoRoot,
			stdout: "pipe",
			stderr: "pipe",
		});
		const [stdout, stderr, code] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);
		expect(code).toBe(0);
		expect(stdout).toContain("Gate PASSED");
		expect(stderr).toBe("");
	});
});
