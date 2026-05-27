import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	FULL_STACK_APP_TEMPLATE_ID,
	SAAS_APP_TEMPLATE_ID,
	VERCEL_APP_TEMPLATE_ID,
	isLegacyAppTemplate,
	parseCreateAppArgs,
	scaffoldAppFromTemplate,
} from "../packages/point/src/core/app-cli.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

describe("legacy template gate", () => {
	test("marks emit/Vite templates as legacy", () => {
		expect(isLegacyAppTemplate(FULL_STACK_APP_TEMPLATE_ID)).toBe(true);
		expect(isLegacyAppTemplate(SAAS_APP_TEMPLATE_ID)).toBe(true);
		expect(isLegacyAppTemplate(VERCEL_APP_TEMPLATE_ID)).toBe(true);
		expect(isLegacyAppTemplate("runtime-app")).toBe(false);
		expect(isLegacyAppTemplate("runtime-saas-app")).toBe(false);
	});

	test("parseCreateAppArgs accepts --legacy", () => {
		expect(parseCreateAppArgs(["demo", "--template", SAAS_APP_TEMPLATE_ID, "--legacy"]).legacy).toBe(true);
	});

	test("rejects legacy template scaffold without --legacy", async () => {
		const projectDir = mkdtempSync(join(tmpdir(), "point-legacy-gate-"));
		try {
			await expect(
				scaffoldAppFromTemplate("legacy-demo", { cwd: projectDir, templateId: SAAS_APP_TEMPLATE_ID }),
			).rejects.toThrow(/legacy \(emit \+ Vite\)/);
		} finally {
			rmSync(projectDir, { recursive: true, force: true });
		}
	});

	test("allows legacy template scaffold with legacy opt-in", async () => {
		const projectDir = mkdtempSync(join(tmpdir(), "point-legacy-gate-"));
		try {
			const result = await scaffoldAppFromTemplate("legacy-demo", {
				cwd: projectDir,
				templateId: FULL_STACK_APP_TEMPLATE_ID,
				legacy: true,
			});
			expect(result.templateId).toBe(FULL_STACK_APP_TEMPLATE_ID);
		} finally {
			rmSync(projectDir, { recursive: true, force: true });
		}
	});

	test("point create CLI requires --legacy for saas-app", async () => {
		const projectDir = mkdtempSync(join(tmpdir(), "point-legacy-gate-cli-"));
		try {
			const blocked = await Bun.$`bun ${cli} create legacy-saas --template ${SAAS_APP_TEMPLATE_ID}`.cwd(projectDir).quiet().nothrow();
			expect(blocked.exitCode).toBe(1);
			expect(blocked.stderr.toString()).toContain("legacy (emit + Vite)");

			await Bun.$`bun ${cli} create legacy-saas --template ${SAAS_APP_TEMPLATE_ID} --legacy`.cwd(projectDir).quiet();
			expect(await Bun.file(join(projectDir, "legacy-saas/src/app.point")).exists()).toBe(true);
		} finally {
			rmSync(projectDir, { recursive: true, force: true });
		}
	}, 60000);
});
