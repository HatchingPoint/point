import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import {
	bundledTemplateDir,
	RUNTIME_APP_TEMPLATE_ID,
	RUNTIME_SAAS_APP_TEMPLATE_ID,
	scaffoldAppFromTemplate,
} from "../packages/point/src/core/app-cli.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

describe("onboarding smoke", () => {
	test("runtime-saas-app template passes check + launch + init db", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/onboarding-saas-"));
		try {
			const bundled = bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID);
			expect(await Bun.file(join(bundled, "src/app.point")).exists()).toBe(true);
			const result = await scaffoldAppFromTemplate("saas-smoke", {
				cwd: projectDir,
				templateId: RUNTIME_SAAS_APP_TEMPLATE_ID,
			});
			const appDir = result.targetDir;
			await Bun.$`bun ${cli} check src/app.point`.cwd(appDir).quiet();
			const demo = await Bun.$`bun ${cli} demo src/app.point`.cwd(appDir).quiet();
			expect(demo.stdout.toString()).toContain("Next steps");
			const launch = await Bun.$`bun ${cli} launch src/app.point admin demo`.cwd(appDir).quiet();
			expect(launch.stdout.toString()).toContain("ready");
			await mkdir(join(appDir, "data"), { recursive: true });
			await Bun.$`bun ${cli} launch src/app.point init database`
				.cwd(appDir)
				.env({ ...process.env, DATABASE_URL: "sqlite:./data/members.db" })
				.quiet();
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	}, 90000);

	test("runtime-app template scaffolds, checks, and runs through owned runtime", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/onboarding-runtime-"));
		try {
			const result = await scaffoldAppFromTemplate("runtime-smoke", {
				cwd: projectDir,
				templateId: RUNTIME_APP_TEMPLATE_ID,
			});
			const appDir = result.targetDir;
			await Bun.$`bun ${cli} check src/app.point`.cwd(appDir).quiet();
			const run = await Bun.$`bun ${cli} run src/app.point smoke`.cwd(appDir).quiet();
			expect(run.stdout.toString().trim()).toBe("ready");
			const test = await Bun.$`bun ${cli} test tests/score.test.point`.cwd(appDir).quiet();
			expect(test.stdout.toString()).toContain('"ok": true');
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	}, 60000);
});
