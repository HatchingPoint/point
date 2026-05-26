import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { interpretPointIrFunction, lowerCheckedCoreProgramToBytecode } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const experimentSourcePath = join(repoRoot, "experiments/point-only/src/app.point");
const experimentScoreTestPath = join(repoRoot, "experiments/point-only/tests/score.test.point");

describe("point-only experiment runtime interpreter", () => {
	test("score test point file checks as Point-only source", async () => {
		const source = await readFile(experimentScoreTestPath, "utf8");
		const program = parsePointSource(source, { cwd: repoRoot, input: experimentScoreTestPath });
		expect(checkPointCore(program)).toEqual([]);
	});

	test("rules and labels execute without an emit oracle", async () => {
		const source = await readFile(experimentSourcePath, "utf8");
		const program = parsePointSource(source, { cwd: repoRoot, input: experimentSourcePath });
		expect(checkPointCore(program)).toEqual([]);
		const ir = lowerCheckedCoreProgramToBytecode(program);

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

		for (const { signals, score } of cases) {
			const expectedLabel = score >= 90 ? "ready" : score >= 70 ? "review" : score >= 40 ? "blocked" : "not ready";
			const expectedTone = score >= 90 ? "positive" : score >= 70 ? "caution" : score >= 40 ? "warning" : "critical";
			expect(interpretPointIrFunction(ir, "deployReadinessScore", [signals])).toBe(score);
			expect(interpretPointIrFunction(ir, "readinessSummary", [signals])).toBe(expectedLabel);
			expect(interpretPointIrFunction(ir, "readinessLabel", [score])).toBe(expectedLabel);
			expect(interpretPointIrFunction(ir, "readinessToneLabel", [score])).toBe(expectedTone);
		}
	});
});
