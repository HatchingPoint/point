import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createModuleGraphForFile, loadCoreFile, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";
import { durationFromMinutes, durationFromSeconds, durationToSeconds } from "@hatchingpoint/point/std/time";

const repoRoot = join(import.meta.dir, "..");

async function checkPointFile(relativePath: string) {
	const lock = await readPointLock(repoRoot);
	const coreFile = await loadCoreFile(relativePath, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	return checkPointCore(programWithDependencyDeclarations(coreFile, graph));
}

describe("std.time Duration helpers", () => {
	test("checks std/time with duration calculations", async () => {
		expect(await checkPointFile("std/time.point")).toEqual([]);
	});

	test("durationFromSeconds, durationToSeconds, and durationFromMinutes round-trip", () => {
		expect(durationFromSeconds(42)).toBe(42);
		expect(durationFromMinutes(2)).toBe(120);
		const elapsed = durationFromMinutes(5);
		expect(durationToSeconds(elapsed)).toBe(300);
		expect(durationFromSeconds(durationToSeconds(elapsed))).toBe(elapsed);
	});
});
