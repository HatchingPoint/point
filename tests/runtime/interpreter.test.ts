import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { executeBundledEntry } from "../../packages/point/runtime/eval-js.ts";
import { interpretCoreProgramEntry } from "../../packages/point/runtime/interpreter/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { findRunEntryName } from "../../packages/point/src/core/cli.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");

function checkedProgram(source: string) {
	const program = parsePointSource(source);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime bytecode interpreter", () => {
	test("matches eval-js for examples/pure/math-only.point", async () => {
		const source = readFileSync(join(repoRoot, "examples/pure/math-only.point"), "utf8");
		const program = checkedProgram(source);
		const entryName = findRunEntryName(program);
		expect(entryName).toBe("demoResult");

		expect(interpretCoreProgramEntry(program, entryName!)).toBe(await executeBundledEntry(program, entryName!));
	});

	test("executes records, calculations, rules, and labels", async () => {
		const program = checkedProgram(`module Runtime Readiness

record Deploy Signals
  has build artifact: Bool
  has passing checks: Bool
  has rollback plan: Bool

calculation complete signals
  output signals: Deploy Signals
  return { has build artifact: true, has passing checks: true, has rollback plan: true }

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 25 when signals.has build artifact
  add 50 when signals.has passing checks
  add 25 when signals.has rollback plan
  return score

label readiness label
  input score: Int
  output Text
  when score >= 90 return "ready"
  when score >= 50 return "review"
  otherwise return "blocked"

calculation readiness summary
  output summary: Text
  return readiness label(deploy readiness(complete signals()))
`);

		expect(interpretCoreProgramEntry(program, "completeSignals")).toEqual({
			hasBuildArtifact: true,
			hasPassingChecks: true,
			hasRollbackPlan: true,
		});
		expect(interpretCoreProgramEntry(program, "readinessSummary")).toBe("ready");
		expect(() => interpretCoreProgramEntry(program, "readinessLabel")).toThrow("expected 1 argument");
	});
});
