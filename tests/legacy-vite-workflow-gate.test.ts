import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { scaffoldAppFromTemplate, SAAS_APP_TEMPLATE_ID } from "../packages/point/src/core/app-cli.ts";
import {
	assertLegacyViteAppWorkflowAllowed,
	hasLegacyViteWebHost,
	isLegacyViteAppProject,
} from "../packages/point/src/core/legacy-app-workflow.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

describe("legacy Vite app workflow gate", () => {
	test("detects legacy Vite web host in scaffolded saas-app", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/legacy-vite-gate-"));
		try {
			await scaffoldAppFromTemplate("legacy-saas", {
				cwd: projectDir,
				templateId: SAAS_APP_TEMPLATE_ID,
				legacy: true,
			});
			const appDir = join(projectDir, "legacy-saas");
			expect(hasLegacyViteWebHost(appDir)).toBe(true);
			expect(isLegacyViteAppProject("src/app.point", appDir)).toBe(true);
			expect(() => assertLegacyViteAppWorkflowAllowed("point dev", "src/app.point", { cwd: appDir })).toThrow(
				/legacy/,
			);
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});

	test("allows route-only dev without web/ host", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/legacy-vite-route-"));
		try {
			await writeFile(
				join(projectDir, "app.point"),
				`module RouteOnly
route hello
  method GET
  path "/hello"
  output response: Text
  return "ok"
`,
			);
			expect(isLegacyViteAppProject("app.point", projectDir)).toBe(false);
			expect(() => assertLegacyViteAppWorkflowAllowed("point dev", "app.point", { cwd: projectDir })).not.toThrow();
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});

	test("point build-app CLI requires --legacy for Vite scaffold", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/legacy-vite-cli-"));
		try {
			await scaffoldAppFromTemplate("legacy-build", {
				cwd: projectDir,
				templateId: SAAS_APP_TEMPLATE_ID,
				legacy: true,
			});
			const appDir = join(projectDir, "legacy-build");
			const blocked = await Bun.$`bun ${cli} build-app src/app.point`.cwd(appDir).quiet().nothrow();
			expect(blocked.exitCode).toBe(1);
			expect(blocked.stderr.toString()).toContain("legacy");
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});
