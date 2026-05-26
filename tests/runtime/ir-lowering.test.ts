import { describe, expect, test } from "bun:test";

import { lowerCheckedCoreProgramToBytecode, PointIrLoweringError } from "../../packages/point/runtime/ir/index.ts";
import type { PointIrFunction, PointIrInstruction } from "../../packages/point/runtime/ir/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

function checkedProgram(source: string) {
	const program = parsePointSource(source);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

function functionByName(functions: PointIrFunction[], name: string): PointIrFunction {
	const fn = functions.find((candidate) => candidate.name === name);
	expect(fn).toBeDefined();
	return fn!;
}

function ops(fn: PointIrFunction): PointIrInstruction["op"][] {
	return fn.bytecode.map((instruction) => instruction.op);
}

describe("runtime IR lowering", () => {
	test("lowers checked rules and labels into stack bytecode", () => {
		const program = checkedProgram(`module Readiness

record Deploy Signals
  has build artifact: Bool
  has passing checks: Bool

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 40 when signals.has build artifact
  add 60 when signals.has passing checks
  return score

label readiness label
  input score: Int
  output Text
  when score >= 90 return "ready"
  otherwise return "review"

calculation readiness summary
  input signals: Deploy Signals
  output summary: Text
  return readiness label(deploy readiness(signals))
`);

		const ir = lowerCheckedCoreProgramToBytecode(program);
		expect(ir.schemaVersion).toBe("point.runtime.ir.v1");
		expect(ir.records[0]?.name).toBe("DeploySignals");
		expect(ir.records[0]?.fields.map((field) => ({ name: field.name, type: field.type.name, semanticName: field.semanticName }))).toEqual([
			{ name: "hasBuildArtifact", type: "Bool", semanticName: "has build artifact" },
			{ name: "hasPassingChecks", type: "Bool", semanticName: "has passing checks" },
		]);

		const score = functionByName(ir.functions, "deployReadinessScore");
		expect(ops(score)).toContain("JUMP_IF_FALSE");
		expect(ops(score)).toContain("STORE_LOCAL");
		expect(ops(score)).toContain("RETURN");

		const summary = functionByName(ir.functions, "readinessSummary");
		expect(summary.bytecode).toContainEqual({ op: "CALL", callee: "deployReadinessScore", argc: 1 });
		expect(summary.bytecode).toContainEqual({ op: "CALL", callee: "readinessLabel", argc: 1 });
	});

	test("lowers record construction through a named calculation", () => {
		const program = checkedProgram(`module RecordLowering

record Deploy Signals
  has build artifact: Bool
  has passing checks: Bool

calculation complete signals
  output signals: Deploy Signals
  return { has build artifact: true, has passing checks: true }
`);

		const ir = lowerCheckedCoreProgramToBytecode(program);
		const completeSignals = functionByName(ir.functions, "completeSignals");
		expect(completeSignals.bytecode).toContainEqual({
			op: "MAKE_RECORD",
			fields: ["hasBuildArtifact", "hasPassingChecks"],
		});
	});

	test("rejects unchecked core programs before lowering", () => {
		const program = parsePointSource(`module Broken

calculation bad score
  output score: Int
  return "not a number"
`);

		expect(() => lowerCheckedCoreProgramToBytecode(program)).toThrow(PointIrLoweringError);
	});
});
