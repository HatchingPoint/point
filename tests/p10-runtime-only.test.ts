import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseCreateAppArgs, scaffoldAppFromTemplate } from "../packages/point/src/core/app-cli.ts";
import { programHasAppSurface, removedLegacyAppHostMessage, shouldUseRuntimeExecution } from "../packages/point/src/core/runtime-project.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

describe("P10 runtime-only execution", () => {
	test("point run uses interpreter for pure logic without point.json", async () => {
		const result = await Bun.$`bun ${cli} run examples/pure/math-only.point`.cwd(repoRoot).quiet();
		expect(result.stdout.toString().trim()).toBe("120");
	});

	test("programHasAppSurface detects routes", () => {
		const program = parsePointSource(`module Demo
route health
  method GET
  path "/health"
  output response: Text
  return "ok"`);
		expect(programHasAppSurface(program)).toBe(true);
		expect(shouldUseRuntimeExecution("demo.point", program)).toBe(true);
	});

	test("legacy template ids are rejected on create", () => {
		expect(() => parseCreateAppArgs(["demo", "--template", "saas-app"])).toThrow(/Unknown template/);
		expect(() => parseCreateAppArgs(["demo", "--legacy"])).toThrow(/Legacy emit\/Vite templates were removed/);
	});

	test("point build-app is removed", async () => {
		const projectDir = mkdtempSync(join(tmpdir(), "point-p10-build-app-"));
		try {
			await scaffoldAppFromTemplate("p10-demo", { cwd: projectDir });
			const result = await Bun.$`bun ${cli} build-app src/app.point`.cwd(join(projectDir, "p10-demo")).quiet().nothrow();
			expect(result.exitCode).not.toBe(0);
			expect(result.stderr.toString()).toContain("point build-app");
			expect(result.stderr.toString()).toContain(removedLegacyAppHostMessage("point build-app"));
		} finally {
			rmSync(projectDir, { recursive: true, force: true });
		}
	});
});
