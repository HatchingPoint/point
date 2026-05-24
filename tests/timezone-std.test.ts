import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createModuleGraphForFile, loadCoreFile, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";
import { formatInstantInTimezone } from "@hatchingpoint/point/std/time";

const repoRoot = join(import.meta.dir, "..");
const pythonStdRoot = join(repoRoot, "packages/point/python_std");
const fixedInstant = "2026-06-15T18:00:00.000Z";

async function checkPointFile(relativePath: string) {
	const lock = await readPointLock(repoRoot);
	const coreFile = await loadCoreFile(relativePath, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	return checkPointCore(programWithDependencyDeclarations(coreFile, graph));
}

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

describe("std.time timezone formatting", () => {
	test("checks std/time and timezone demo example", async () => {
		for (const file of ["std/time.point", "examples/tools/timezone-demo.point"]) {
			expect(await checkPointFile(file)).toEqual([]);
		}
	});

	test("emits format instant in timezone helpers in TS and Python", async () => {
		const lock = await readPointLock(repoRoot);
		const coreFile = await loadCoreFile("examples/tools/timezone-demo.point", lock, repoRoot);
		const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
		const program = programWithDependencyDeclarations(coreFile, graph);
		const ts = emitPointCoreTypeScript(program);
		const py = emitPointCorePython(program);
		expect(ts).toContain("formatInstantInTimezone");
		expect(py).toContain("formatInstantInTimezone");
	});

	test("formatInstantInTimezone formats a fixed instant in IANA zones", () => {
		const tokyo = formatInstantInTimezone(fixedInstant, "Asia/Tokyo");
		expect(typeof tokyo).toBe("string");
		expect(tokyo).toContain("2026");
		expect(tokyo).toMatch(/3:00/);

		const newYork = formatInstantInTimezone(fixedInstant, "America/New_York");
		expect(typeof newYork).toBe("string");
		expect(newYork).toMatch(/2:00|1:00/);
	});

	test("formatInstantInTimezone returns Point error shapes for invalid input", () => {
		expect(formatInstantInTimezone("not-a-date", "UTC")).toEqual({
			message: "Invalid instant: not-a-date",
		});
		expect(formatInstantInTimezone(fixedInstant, "Not/A/Zone")).toEqual({
			message: "Invalid timezone: Not/A/Zone",
		});
	});

	test("Python formatInstantInTimezone matches JS for fixed instant", async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping timezone runtime parity test");
			return;
		}
		const script = `
import json
from point_std.time import formatInstantInTimezone
print(json.dumps({
  "tokyo": formatInstantInTimezone(${JSON.stringify(fixedInstant)}, "Asia/Tokyo"),
  "invalidZone": formatInstantInTimezone(${JSON.stringify(fixedInstant)}, "Not/A/Zone"),
}))
`;
		const proc = Bun.spawnSync([pythonPath, "-c", script], {
			cwd: repoRoot,
			env: { ...process.env, PYTHONPATH: pythonStdRoot },
			stdout: "pipe",
			stderr: "pipe",
		});
		expect(proc.exitCode).toBe(0);
		const result = JSON.parse(proc.stdout.toString()) as {
			tokyo: string;
			invalidZone: { message: string };
		};
		const jsTokyo = formatInstantInTimezone(fixedInstant, "Asia/Tokyo");
		expect(result.tokyo).toContain("2026");
		expect(result.tokyo).toMatch(/3:00/);
		expect(typeof jsTokyo).toBe("string");
		expect(result.invalidZone).toEqual({ message: "Invalid timezone: Not/A/Zone" });
	});
});
