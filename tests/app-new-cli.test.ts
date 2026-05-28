import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, cp } from "node:fs/promises";
import { join } from "node:path";
import {
	bundledTemplateDir,
	DEFAULT_APP_TEMPLATE_ID,
	fullStackTemplateDir,
	locatePointToolkitRoot,
	parseCreateAppArgs,
	REPO_TEMPLATE_REL,
	RUNTIME_APP_TEMPLATE_ID,
	RUNTIME_SAAS_APP_TEMPLATE_ID,
	resolveAppTemplateDir,
	scaffoldAppFromTemplate,
	validateAppName,
} from "../packages/point/src/core/app-cli.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const localPointPackage = join(repoRoot, "packages/point");
const templateApp = join(repoRoot, REPO_TEMPLATE_REL, "src/app.point");

describe("runtime templates and point create", () => {
	let projectDir = "";

	beforeEach(async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		projectDir = await mkdtemp(join(repoRoot, "tests/tmp/app-new-"));
	});

	afterEach(async () => {
		if (projectDir && existsSync(projectDir)) await rm(projectDir, { recursive: true, force: true });
	});

	test("validateAppName accepts kebab-case identifiers", () => {
		expect(() => validateAppName("my-app")).not.toThrow();
		expect(() => validateAppName("MyApp")).toThrow(/Invalid app name/);
		expect(() => validateAppName("")).toThrow(/Invalid app name/);
	});

	test("bundled default template ships inside @hatchingpoint/point package", () => {
		const bundled = bundledTemplateDir(DEFAULT_APP_TEMPLATE_ID);
		expect(existsSync(bundled)).toBe(true);
		expect(existsSync(join(bundled, "src/app.point"))).toBe(true);
		expect(existsSync(join(bundled, "point.json"))).toBe(true);
		expect(JSON.parse(readFileSync(join(bundled, "point.json"), "utf8")).runtime).toBe("owned");
	});

	test("resolveAppTemplateDir prefers bundled runtime template", () => {
		const dir = resolveAppTemplateDir(DEFAULT_APP_TEMPLATE_ID);
		expect(dir.replaceAll("\\", "/")).toContain("/packages/point/templates/runtime-app");
	});

	test("runtime SaaS template resolves explicitly", () => {
		const dir = resolveAppTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID);
		expect(dir.replaceAll("\\", "/")).toContain("/packages/point/templates/runtime-saas-app");
		expect(existsSync(join(dir, "src/app.point"))).toBe(true);
		expect(existsSync(join(dir, "web"))).toBe(false);
	});

	test("locatePointToolkitRoot finds examples/full-stack-template", () => {
		const root = locatePointToolkitRoot();
		expect(existsSync(fullStackTemplateDir(root))).toBe(true);
		expect(existsSync(join(fullStackTemplateDir(root), "src/app.point"))).toBe(true);
	});

	test("parseCreateAppArgs supports template flag and list", () => {
		expect(parseCreateAppArgs(["--list-templates"]).listTemplates).toBe(true);
		expect(parseCreateAppArgs(["my-app", "./out", "--template", "runtime-saas-app"])).toEqual({
			appName: "my-app",
			targetDir: "./out",
			templateId: "runtime-saas-app",
			listTemplates: false,
		});
		expect(() => parseCreateAppArgs(["demo", "--legacy"])).toThrow(/Legacy emit\/Vite templates were removed/);
	});

	test("examples/full-stack-template checks, builds TypeScript, and runs via interpreter", async () => {
		await Bun.$`bun ${cli} check ${templateApp}`.quiet();
		const out = join(repoRoot, "generated/full-stack-template-app.ts");
		await Bun.$`bun ${cli} build-ts ${templateApp} ${out}`.quiet();
		const emitted = await Bun.file(out).text();
		expect(emitted).toContain("export function adminShellLayout");
		expect(emitted).toContain("createBrowserRouter");
		const run = await Bun.$`bun ${cli} run ${templateApp}`.quiet();
		expect(run.stdout.toString().trim()).toBe("Admin app navigation ready");
	}, 30000);

	test("scaffoldAppFromTemplate copies tree and substitutes app name", async () => {
		const target = join(projectDir, "acme-admin");
		const result = await scaffoldAppFromTemplate("acme-admin", {
			cwd: projectDir,
			targetDir: target,
		});
		expect(result.files.length).toBeGreaterThan(3);
		expect(existsSync(join(target, "point.json"))).toBe(true);
		expect(existsSync(join(target, "src/app.point"))).toBe(true);
		const manifest = JSON.parse(readFileSync(join(target, "point.json"), "utf8")) as { name: string };
		expect(manifest.name).toBe("acme-admin");
		await Bun.$`bun ${cli} check ${join(target, "src/app.point")}`.cwd(target).quiet();
	});

	test("point create CLI creates runtime-native scaffold in cwd", async () => {
		const name = "demo-runtime";
		await Bun.$`bun ${cli} create ${name}`.cwd(projectDir).quiet();
		const appDir = join(projectDir, name);
		expect(existsSync(join(appDir, "src/app.point"))).toBe(true);
		const manifest = JSON.parse(readFileSync(join(appDir, "point.json"), "utf8")) as { name: string; runtime?: string };
		expect(manifest.name).toBe(name);
		expect(manifest.runtime).toBe("owned");
		await Bun.$`bun ${cli} check src/app.point`.cwd(appDir).quiet();
		const blocked = await Bun.$`bun ${cli} build-ts src/app.point generated/app.ts`.cwd(appDir).quiet().nothrow();
		expect(blocked.exitCode).toBe(1);
	});

	test("point app new remains available as alias", async () => {
		const name = "legacy-new";
		await Bun.$`bun ${cli} app new ${name}`.cwd(projectDir).quiet();
		expect(existsSync(join(projectDir, name, "src/app.point"))).toBe(true);
	});

	test("runtime-saas-app template is bundled without web or Vite", async () => {
		const bundled = bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID);
		expect(existsSync(bundled)).toBe(true);
		const source = readFileSync(join(bundled, "src/app.point"), "utf8");
		expect(source).toContain("capabilities auth sql");
		expect(source).toContain("workflow init members db");
		await Bun.$`bun ${cli} check ${join(bundled, "src/app.point")}`.quiet();
		const result = await scaffoldAppFromTemplate("runtime-saas-demo", {
			cwd: projectDir,
			templateId: RUNTIME_SAAS_APP_TEMPLATE_ID,
		});
		expect(result.templateId).toBe(RUNTIME_SAAS_APP_TEMPLATE_ID);
		const appDir = join(projectDir, "runtime-saas-demo");
		expect(JSON.parse(readFileSync(join(appDir, "point.json"), "utf8")).runtime).toBe("owned");
		await Bun.$`bun ${cli} run src/app.point admin demo`.cwd(appDir).quiet();
	});
});
