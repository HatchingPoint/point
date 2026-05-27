import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { bundledTemplateDir, RUNTIME_APP_TEMPLATE_ID, scaffoldAppFromTemplate } from "../packages/point/src/core/app-cli.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const localPointPackage = join(repoRoot, "packages/point");

async function installLocalPoint(appDir: string): Promise<void> {
	const packagePath = join(appDir, "package.json");
	const pkg = JSON.parse(await Bun.file(packagePath).text()) as { devDependencies?: Record<string, string> };
	pkg.devDependencies = { ...(pkg.devDependencies ?? {}), "@hatchingpoint/point": `file:${localPointPackage}` };
	await Bun.write(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
	await Bun.$`bun install`.cwd(appDir).quiet();
}

describe("onboarding smoke", () => {
	test("saas-app template bundles and passes check + launch + init db", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/onboarding-saas-"));
		try {
			const bundled = bundledTemplateDir("saas-app");
			expect(existsSync(join(bundled, "src/app.point"))).toBe(true);
			const result = await scaffoldAppFromTemplate("saas-smoke", {
				cwd: projectDir,
				templateId: "saas-app",
				legacy: true,
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

	test("full-stack-app template still scaffolds and launches", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/onboarding-full-"));
		try {
			await scaffoldAppFromTemplate("full-smoke", { cwd: projectDir, templateId: "full-stack-app", legacy: true });
			const appDir = join(projectDir, "full-smoke");
			await Bun.$`bun ${cli} check src/app.point`.cwd(appDir).quiet();
			const launch = await Bun.$`bun ${cli} launch src/app.point admin demo`.cwd(appDir).quiet();
			expect(launch.stdout.toString()).toContain("ready");
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	}, 60000);
});
