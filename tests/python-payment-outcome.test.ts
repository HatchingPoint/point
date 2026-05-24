import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const repoRoot = join(import.meta.dir, "..");

async function resolvePythonCommand(): Promise<string | null> {
	for (const candidate of ["python3", "python", "py"]) {
		try {
			const probe = Bun.spawnSync([candidate, "--version"], { stdout: "pipe", stderr: "pipe" });
			if (probe.exitCode === 0) return candidate;
		} catch {
			continue;
		}
	}
	return null;
}

/** Minimal payment outcome slice: variant action returns tagged dict matching emit-python `{ kind: ... }`. */
const PAYMENT_OUTCOME_POINT = `module Payments

variant Payment Outcome
  Succeeded with receipt id: Text
  Failed with message: Text

action charge receipt
  input amount cents: Int
  output receipt: Payment Outcome
  touches network
  return Succeeded with receipt id: "rcpt-101"

label payment detail line
  input outcome: Payment Outcome
  output Text
  on Succeeded with receipt id return "Receipt " + receipt id
  on Failed with message return "Error: " + message
`;

describe("payment outcome Python emit", () => {
	test("build-py emits async action returning tagged outcome dict", async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping payment-outcome smoke test");
			return;
		}

		const tempDir = mkdtempSync(join(tmpdir(), "point-pay-outcome-"));
		const srcPath = join(tempDir, "payment-outcome.point");
		const outPath = join(tempDir, "payment-outcome.py");
		try {
			writeFileSync(srcPath, PAYMENT_OUTCOME_POINT);
			const build = await Bun.$`bun ${join(repoRoot, "packages/point/src/cli.ts")} build-py ${srcPath} ${outPath}`.quiet();
			expect(build.exitCode).toBe(0);

			const pySource = await Bun.file(outPath).text();
			expect(pySource).toContain('"kind"');
			expect(pySource).toContain("Succeeded");

			const script = `
import asyncio
import importlib.util
import json
import sys

spec = importlib.util.spec_from_file_location("payment_outcome_module", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

async def main():
    result = await module.chargeReceipt(100)
    assert result.get("kind") == "Succeeded", result
    assert "receiptId" in result, result
    print(json.dumps(result))

asyncio.run(main())
`;
			const proc = Bun.spawnSync([pythonPath, "-c", script, outPath], { stdout: "pipe", stderr: "pipe" });
			if (proc.exitCode !== 0) {
				throw new Error(proc.stderr.toString() || proc.stdout.toString() || "Python smoke test failed");
			}
			const parsed = JSON.parse(proc.stdout.toString()) as Record<string, unknown>;
			expect(parsed.kind).toBe("Succeeded");
			expect(parsed.receiptId).toBe("rcpt-101");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
