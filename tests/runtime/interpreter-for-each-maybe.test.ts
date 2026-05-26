import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
	interpretPointIrFunction,
	lowerCheckedCoreProgramToBytecode,
	type PointIrProgram,
} from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const experimentSourcePath = join(repoRoot, "experiments/point-only/src/app.point");

function checkedIr(source: string, input = "inline.point"): PointIrProgram {
	const program = parsePointSource(source, { cwd: repoRoot, input });
	expect(checkPointCore(program)).toEqual([]);
	return lowerCheckedCoreProgramToBytecode(program);
}

function functionName(ir: PointIrProgram, semanticName: string): string {
	const fn = ir.functions.find((candidate) => candidate.semantic?.name === semanticName);
	expect(fn).toBeDefined();
	return fn!.name;
}

describe("runtime interpreter for-each and Maybe", () => {
	test("interprets for-each accumulation", () => {
		const source = `module RuntimeForEach

record Cart Item
  name: Text
  unit price: Int
  quantity: Int

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total
`;
		const ir = checkedIr(source);
		const cartTotal = functionName(ir, "cart total");
		const items = [
			{ name: "A", unitPrice: 1200, quantity: 2 },
			{ name: "B", unitPrice: 350, quantity: 3 },
		];

		expect(interpretPointIrFunction(ir, cartTotal, [items])).toBe(3450);
		expect(interpretPointIrFunction(ir, cartTotal, [[]])).toBe(0);
	});

	test("interprets Maybe present and none branches", () => {
		const source = `module RuntimeMaybe

record Contact
  email: Text

label contact banner
  input contact: Maybe<Contact>
  output Text
  when contact present return contact.email
  when contact is none return "none"
  otherwise return "fallback"
`;
		const ir = checkedIr(source);
		const contactBanner = functionName(ir, "contact banner");
		const contact = { email: "ops@example.test" };

		expect(interpretPointIrFunction(ir, contactBanner, [contact])).toBe("ops@example.test");
		expect(interpretPointIrFunction(ir, contactBanner, [null])).toBe("none");
	});

	test("experiment app rules and labels run through bytecode interpreter", async () => {
		const source = await readFile(experimentSourcePath, "utf8");
		const ir = checkedIr(source, experimentSourcePath);
		const deployReadiness = functionName(ir, "deploy readiness");
		const readinessSummary = functionName(ir, "readiness summary");
		const readinessLabel = functionName(ir, "readiness label");
		const readinessTone = functionName(ir, "readiness tone");
		const cases = [
			{
				signals: {
					hasBuildArtifact: true,
					hasPassingChecks: true,
					hasRollbackPlan: true,
					hasOwnerApproval: true,
				},
				score: 100,
			},
			{
				signals: {
					hasBuildArtifact: true,
					hasPassingChecks: true,
					hasRollbackPlan: false,
					hasOwnerApproval: false,
				},
				score: 60,
			},
			{
				signals: {
					hasBuildArtifact: false,
					hasPassingChecks: false,
					hasRollbackPlan: false,
					hasOwnerApproval: false,
				},
				score: 0,
			},
		];
		const labels = new Map([
			[100, ["ready", "positive"]],
			[60, ["blocked", "warning"]],
			[0, ["not ready", "critical"]],
		]);

		for (const { signals, score } of cases) {
			const [label, tone] = labels.get(score)!;
			expect(interpretPointIrFunction(ir, deployReadiness, [signals])).toBe(score);
			expect(interpretPointIrFunction(ir, readinessSummary, [signals])).toBe(label);
			expect(interpretPointIrFunction(ir, readinessLabel, [score])).toBe(label);
			expect(interpretPointIrFunction(ir, readinessTone, [score])).toBe(tone);
		}
	});
});
