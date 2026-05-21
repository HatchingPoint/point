import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import {
	FULL_STACK_TEMPLATE_REL,
	fullStackTemplateDir,
	locatePointToolkitRoot,
	scaffoldAppFromTemplate,
	validateAppName,
} from "../packages/point/src/core/app-cli.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const templateApp = join(repoRoot, FULL_STACK_TEMPLATE_REL, "src/app.point");

describe("full-stack template and point app new", () => {
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

	test("locatePointToolkitRoot finds examples/full-stack-template", () => {
		const root = locatePointToolkitRoot();
		expect(existsSync(fullStackTemplateDir(root))).toBe(true);
		expect(existsSync(join(fullStackTemplateDir(root), "src/app.point"))).toBe(true);
	});

	test("full-stack template checks and builds TypeScript", async () => {
		await Bun.$`bun ${cli} check ${templateApp}`.quiet();
		const out = join(repoRoot, "generated/full-stack-template-app.ts");
		await Bun.$`bun ${cli} build-ts ${templateApp} ${out}`.quiet();
		const emitted = await Bun.file(out).text();
		expect(emitted).toContain("export function adminShellLayout");
		expect(emitted).toContain("createBrowserRouter");
		expect(emitted).toContain("fetchMembers");
		const run = await Bun.$`bun ${cli} run ${templateApp}`.quiet();
		expect(run.stdout.toString().trim()).toBe("Admin app navigation ready");
	});

	test("scaffoldAppFromTemplate copies tree and substitutes app name", async () => {
		const target = join(projectDir, "acme-admin");
		const result = await scaffoldAppFromTemplate("acme-admin", {
			cwd: projectDir,
			targetDir: target,
			toolkitRoot: repoRoot,
		});
		expect(result.files.length).toBeGreaterThan(0);
		expect(existsSync(join(target, "point.json"))).toBe(true);
		expect(existsSync(join(target, "src/app.point"))).toBe(true);
		const manifest = JSON.parse(readFileSync(join(target, "point.json"), "utf8")) as { name: string };
		expect(manifest.name).toBe("acme-admin");
		const readme = readFileSync(join(target, "README.md"), "utf8");
		expect(readme).toContain("acme-admin/");
		expect(readme).not.toContain("{{APP_NAME}}");
		await Bun.$`bun ${cli} check ${join(target, "src/app.point")}`.cwd(target).quiet();
	});

	test("point app new CLI creates scaffold in cwd", async () => {
		const name = "demo-saas";
		await Bun.$`bun ${cli} app new ${name}`.cwd(projectDir).quiet();
		const appDir = join(projectDir, name);
		expect(existsSync(join(appDir, "src/app.point"))).toBe(true);
		const manifest = JSON.parse(readFileSync(join(appDir, "point.json"), "utf8")) as { name: string };
		expect(manifest.name).toBe(name);
		await Bun.$`bun ${cli} build-ts src/app.point generated/app.ts`.cwd(appDir).quiet();
		expect(existsSync(join(appDir, "generated/app.ts"))).toBe(true);
	});

	test("point app new rejects non-empty target directory", async () => {
		const target = join(projectDir, "blocked");
		await mkdir(target);
		await Bun.write(join(target, "keep.txt"), "x");
		expect(
			Bun.$`bun ${cli} app new blocked-app ${target}`.cwd(projectDir).quiet().then(() => ({ ok: true })).catch(() => ({ ok: false })),
		).resolves.toEqual({ ok: false });
	});
});
