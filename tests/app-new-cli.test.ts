import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, cp } from "node:fs/promises";
import { join } from "node:path";
import {
	bundledTemplateDir,
	DEFAULT_APP_TEMPLATE_ID,
	FULL_STACK_APP_TEMPLATE_ID,
	fullStackTemplateDir,
	locatePointToolkitRoot,
	parseCreateAppArgs,
	REPO_TEMPLATE_REL,
	RUNTIME_APP_TEMPLATE_ID,
	resolveAppTemplateDir,
	scaffoldAppFromTemplate,
	validateAppName,
} from "../packages/point/src/core/app-cli.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const localPointPackage = join(repoRoot, "packages/point");
const templateApp = join(repoRoot, REPO_TEMPLATE_REL, "src/app.point");

async function installLocalPoint(appDir: string): Promise<void> {
	const packagePath = join(appDir, "package.json");
	const pkg = JSON.parse(await Bun.file(packagePath).text()) as { devDependencies?: Record<string, string> };
	pkg.devDependencies = { ...(pkg.devDependencies ?? {}), "@hatchingpoint/point": `file:${localPointPackage}` };
	await Bun.write(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
	await Bun.$`bun install`.cwd(appDir).quiet();
}

describe("full-stack template and point create", () => {
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
		expect(existsSync(join(bundled, ".gitignore"))).toBe(true);
		expect(JSON.parse(readFileSync(join(bundled, "point.json"), "utf8")).runtime).toBe("owned");
	});

	test("resolveAppTemplateDir prefers bundled runtime template", () => {
		const dir = resolveAppTemplateDir(DEFAULT_APP_TEMPLATE_ID);
		expect(dir.replaceAll("\\", "/")).toContain("/packages/point/templates/runtime-app");
	});

	test("full-stack template resolves explicitly", () => {
		const dir = resolveAppTemplateDir(FULL_STACK_APP_TEMPLATE_ID);
		expect(dir.replaceAll("\\", "/")).toContain("/packages/point/templates/full-stack-app");
	});

	test("locatePointToolkitRoot finds examples/full-stack-template", () => {
		const root = locatePointToolkitRoot();
		expect(existsSync(fullStackTemplateDir(root))).toBe(true);
		expect(existsSync(join(fullStackTemplateDir(root), "src/app.point"))).toBe(true);
	});

	test("parseCreateAppArgs supports template flag and list", () => {
		expect(parseCreateAppArgs(["--list-templates"]).listTemplates).toBe(true);
		expect(parseCreateAppArgs(["my-app", "./out", "--template", "full-stack-app"])).toEqual({
			appName: "my-app",
			targetDir: "./out",
			templateId: "full-stack-app",
			listTemplates: false,
		});
	});

	test("full-stack template checks and builds TypeScript", async () => {
		await Bun.$`bun ${cli} check ${templateApp}`.quiet();
		const out = join(repoRoot, "generated/full-stack-template-app.ts");
		await Bun.$`bun ${cli} build-ts ${templateApp} ${out}`.quiet();
		const emitted = await Bun.file(out).text();
		expect(emitted).toContain("export function adminShellLayout");
		expect(emitted).toContain("createBrowserRouter");
		expect(emitted).toContain('fetch("/api/members")');
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
		expect(existsSync(join(target, "package.json"))).toBe(true);
		expect(existsSync(join(target, "src/app.point"))).toBe(true);
		const manifest = JSON.parse(readFileSync(join(target, "point.json"), "utf8")) as { name: string };
		expect(manifest.name).toBe("acme-admin");
		const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as { name: string };
		expect(pkg.name).toBe("acme-admin");
		const readme = readFileSync(join(target, "README.md"), "utf8");
		expect(readme).toContain("acme-admin");
		expect(readme).not.toContain("{{APP_NAME}}");
		await Bun.$`bun ${cli} check ${join(target, "src/app.point")}`.cwd(target).quiet();
	});

	test("scaffold uses bundled runtime template directory", async () => {
		const result = await scaffoldAppFromTemplate("bundled-app", { cwd: projectDir });
		expect(result.templateDir.replaceAll("\\", "/")).toContain("/packages/point/templates/runtime-app");
		expect(result.templateId).toBe(RUNTIME_APP_TEMPLATE_ID);
		const manifest = JSON.parse(readFileSync(join(projectDir, "bundled-app", "point.json"), "utf8")) as { runtime?: string };
		expect(manifest.runtime).toBe("owned");
		expect(existsSync(join(projectDir, "bundled-app", "package.json"))).toBe(true);
	});

	test("npm-style package layout scaffolds without repo examples path", async () => {
		const miniPackage = join(projectDir, "mini-point");
		await cp(join(repoRoot, "packages/point/src"), join(miniPackage, "src"), { recursive: true });
		await cp(join(repoRoot, "packages/point/runtime"), join(miniPackage, "runtime"), { recursive: true });
		await cp(join(repoRoot, "packages/point/templates"), join(miniPackage, "templates"), { recursive: true });
		const miniCli = join(miniPackage, "src/cli.ts");
		await Bun.$`bun ${miniCli} create npm-style-app`.cwd(projectDir).quiet();
		const appDir = join(projectDir, "npm-style-app");
		expect(existsSync(join(appDir, "src/app.point"))).toBe(true);
		await Bun.$`bun ${cli} check src/app.point`.cwd(appDir).quiet();
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

	test("point create full-stack template still emits TypeScript", async () => {
		const name = "demo-saas";
		await Bun.$`bun ${cli} create ${name} --template ${FULL_STACK_APP_TEMPLATE_ID}`.cwd(projectDir).quiet();
		const appDir = join(projectDir, name);
		await Bun.$`bun ${cli} build-ts src/app.point generated/app.ts`.cwd(appDir).quiet();
		expect(existsSync(join(appDir, "generated/app.ts"))).toBe(true);
	});

	test("point app new remains available as alias", async () => {
		const name = "legacy-new";
		await Bun.$`bun ${cli} app new ${name}`.cwd(projectDir).quiet();
		expect(existsSync(join(projectDir, name, "src/app.point"))).toBe(true);
	});

	test("point create rejects non-empty target directory", async () => {
		const target = join(projectDir, "blocked");
		await mkdir(target);
		await Bun.write(join(target, "keep.txt"), "x");
		expect(
			Bun.$`bun ${cli} create blocked-app ${target}`.cwd(projectDir).quiet().then(() => ({ ok: true })).catch(() => ({ ok: false })),
		).resolves.toEqual({ ok: false });
	});

	test("saas-app template is bundled with auth and sql", async () => {
		const bundled = bundledTemplateDir("saas-app");
		expect(existsSync(bundled)).toBe(true);
		expect(existsSync(join(bundled, "src/app.point"))).toBe(true);
		const appPoint = join(bundled, "src/app.point");
		const source = readFileSync(appPoint, "utf8");
		expect(source).toContain("capabilities auth");
		expect(source).toContain("middleware require auth");
		await Bun.$`bun ${cli} check ${appPoint}`.quiet();
		const result = await scaffoldAppFromTemplate("saas-demo", {
			cwd: projectDir,
			templateId: "saas-app",
		});
		expect(result.templateId).toBe("saas-app");
		const appDir = join(projectDir, "saas-demo");
		await Bun.$`bun ${cli} launch src/app.point admin demo`.cwd(appDir).quiet();
	});

	test("vercel-app template is bundled and scaffolds", async () => {
		const bundled = bundledTemplateDir("vercel-app");
		expect(existsSync(bundled)).toBe(true);
		expect(existsSync(join(bundled, "vercel.json"))).toBe(true);
		expect(existsSync(join(bundled, "api/[[...path]].ts"))).toBe(true);
		const appPoint = join(bundled, "src/app.point");
		await Bun.$`bun ${cli} check ${appPoint}`.quiet();
		const result = await scaffoldAppFromTemplate("vercel-demo", {
			cwd: projectDir,
			templateId: "vercel-app",
		});
		expect(result.templateDir.replaceAll("\\", "/")).toContain("/packages/point/templates/vercel-app");
		const target = join(projectDir, "vercel-demo");
		const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as { scripts: Record<string, string> };
		expect(pkg.scripts.build).toContain("build-app");
		expect(readFileSync(join(target, "src/app.point"), "utf8")).toContain("theme app theme");
		await Bun.$`bun ${cli} check src/app.point`.cwd(target).quiet();
	});
});
