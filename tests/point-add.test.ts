import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
	addPointDependency,
	ensureNpmPackage,
	locatePointPackageRoot,
	modulePathFromLock,
	parseDependencySpec,
	parseNpmLocator,
	readPointLock,
	readPointManifest,
	resolveDependencySpec,
	resolveEmitTargetForInput,
	resolveLockFromManifest,
	resolveNpmPackagePath,
} from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const pointLogicDir = join(repoRoot, "packages/point-logic");

describe("point add and lockfile resolution", () => {
	let projectDir = "";

	beforeEach(async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-add-"));
		await writeFile(
			join(projectDir, "point.json"),
			`${JSON.stringify({ name: "demo", version: "0.0.1" }, null, 2)}\n`,
		);
	});

	function stdSpecFor(project: string): string {
		return `workspace:${relative(project, join(repoRoot, "std"))}`;
	}

	afterEach(async () => {
		if (projectDir && existsSync(projectDir)) await rm(projectDir, { recursive: true, force: true });
	});

	test("parseDependencySpec accepts workspace, file, and npm", () => {
		expect(parseDependencySpec("workspace:std")).toEqual({ kind: "workspace", locator: "std" });
		expect(parseDependencySpec("file:./packages/point-logic")).toEqual({ kind: "file", locator: "./packages/point-logic" });
		expect(parseDependencySpec("npm:@hatchingpoint/point-logic")).toEqual({ kind: "npm", locator: "@hatchingpoint/point-logic" });
		expect(parseDependencySpec("npm:@hatchingpoint/point-logic@0.0.2")).toEqual({ kind: "npm", locator: "@hatchingpoint/point-logic@0.0.2" });
		expect(() => parseDependencySpec("invalid")).toThrow(/Invalid dependency spec/);
	});

	test("parseNpmLocator splits scoped package versions", () => {
		expect(parseNpmLocator("@hatchingpoint/point-logic")).toEqual({ name: "@hatchingpoint/point-logic" });
		expect(parseNpmLocator("@hatchingpoint/point-logic@0.0.2")).toEqual({ name: "@hatchingpoint/point-logic", version: "0.0.2" });
		expect(parseNpmLocator("lodash@4.17.21")).toEqual({ name: "lodash", version: "4.17.21" });
	});

	test("resolveDependencySpec pins workspace and file paths", async () => {
		const std = await resolveDependencySpec("workspace:std", repoRoot);
		expect(std).toEqual({ version: "workspace", path: "std" });
		const logic = await resolveDependencySpec(`file:packages/point-logic`, repoRoot);
		expect(logic).toEqual({ version: "file", path: "packages/point-logic" });
	});

	test("locatePointPackageRoot accepts point.json or src/*.point", () => {
		expect(locatePointPackageRoot(pointLogicDir)).toBe(pointLogicDir);
		expect(locatePointPackageRoot(join(repoRoot, "std"))).toBe(join(repoRoot, "std"));
	});

	test("resolveDependencySpec installs npm package and pins node_modules path", async () => {
		await writeFile(join(projectDir, "package.json"), `${JSON.stringify({ name: "demo-app", version: "0.0.1", private: true }, null, 2)}\n`);
		const logicFileSpec = `file:${pointLogicDir.replaceAll("\\", "/")}`;
		await Bun.$`npm install ${logicFileSpec} --prefix ${projectDir} --no-save --no-package-lock`.quiet();
		const resolved = await resolveDependencySpec("npm:@hatchingpoint/point-logic", projectDir);
		expect(resolved.path).toMatch(/node_modules\/@hatchingpoint\/point-logic$/);
		expect(resolved.version).toBe("0.0.3");
		expect(resolveNpmPackagePath(projectDir, "@hatchingpoint/point-logic")).toBeTruthy();
	}, 30_000);

	test("addPointDependency updates manifest and lock", async () => {
		const spec = stdSpecFor(projectDir);
		const { manifest, lock } = await addPointDependency("std", spec, projectDir);
		expect(manifest.dependencies?.std).toBe(spec);
		expect(lock.schemaVersion).toBe("point.lock.v1");
		expect(lock.packages.demo.dependencies?.std).toBe(spec);
		expect(lock.packages.std.version).toBe("workspace");
		expect(lock.packages.std.path).toBe(relative(projectDir, join(repoRoot, "std")).split("\\").join("/"));
		const onDisk = await readPointManifest(projectDir);
		expect(onDisk.dependencies?.std).toBe(spec);
		const lockOnDisk = await readPointLock(projectDir);
		expect(lockOnDisk?.packages.std.path).toBe(relative(projectDir, join(repoRoot, "std")).split("\\").join("/"));
	});

	test("modulePathFromLock resolves package modules from lock", async () => {
		const lock = await resolveLockFromManifest(
			{ name: "point", version: "0.0.5", dependencies: { std: "workspace:std" } },
			repoRoot,
		);
		expect(modulePathFromLock(lock, "std.text", repoRoot)).toBe("std/text.point");
		expect(() => modulePathFromLock(lock, "missing.text", repoRoot)).toThrow(/Unknown package "missing"/);
	});

	test("modulePathFromLock resolves npm package modules under src/", async () => {
		await writeFile(join(projectDir, "package.json"), `${JSON.stringify({ name: "demo-app", version: "0.0.1", private: true }, null, 2)}\n`);
		const logicFileSpec = `file:${pointLogicDir.replaceAll("\\", "/")}`;
		await Bun.$`npm install ${logicFileSpec} --prefix ${projectDir} --no-save --no-package-lock`.quiet();
		const { lock } = await addPointDependency("logic", "npm:@hatchingpoint/point-logic", projectDir);
		expect(lock.packages.logic.path).toMatch(/node_modules\/@hatchingpoint\/point-logic$/);
		expect(modulePathFromLock(lock, "logic.store-readiness", projectDir)).toBe(
			"node_modules/@hatchingpoint/point-logic/src/store-readiness.point",
		);
	}, 30_000);

	test("point add CLI writes files and resolves npm", async () => {
		const spec = stdSpecFor(projectDir);
		const add = await Bun.$`bun ${cli} add std ${spec}`.cwd(projectDir).quiet();
		expect(add.exitCode).toBe(0);
		expect(add.stdout.toString()).toContain("point.json");
		const manifest = await readPointManifest(projectDir);
		expect(manifest.dependencies?.std).toBe(spec);

		await writeFile(join(projectDir, "package.json"), `${JSON.stringify({ name: "demo-app", version: "0.0.1", private: true }, null, 2)}\n`);
		const logicFileSpec = `file:${pointLogicDir.replaceAll("\\", "/")}`;
		await Bun.$`npm install ${logicFileSpec} --prefix ${projectDir} --no-save --no-package-lock`.quiet();
		const npmAdd = await Bun.$`bun ${cli} add logic npm:@hatchingpoint/point-logic`.cwd(projectDir).quiet();
		expect(npmAdd.exitCode).toBe(0);
		const lock = await readPointLock(projectDir);
		expect(lock?.packages.logic.path).toMatch(/node_modules\/@hatchingpoint\/point-logic$/);
		const updated = await readPointManifest(projectDir);
		expect(updated.dependencies?.logic).toBe("npm:@hatchingpoint/point-logic");
	}, 30_000);

	test("file: dependency pins package path in lock", async () => {
		const spec = `file:${relative(projectDir, join(repoRoot, "packages/point-logic"))}`;
		await addPointDependency("logic", spec, projectDir);
		const lock = await readPointLock(projectDir);
		expect(lock?.packages.logic.version).toBe("file");
		expect(lock?.packages.logic.path).toBe(relative(projectDir, join(repoRoot, "packages/point-logic")).split("\\").join("/"));
	});

	test("ensureNpmPackage reuses existing node_modules install", async () => {
		await writeFile(join(projectDir, "package.json"), `${JSON.stringify({ name: "demo-app", version: "0.0.1", private: true }, null, 2)}\n`);
		const logicFileSpec = `file:${pointLogicDir.replaceAll("\\", "/")}`;
		await Bun.$`npm install ${logicFileSpec} --prefix ${projectDir} --no-save --no-package-lock`.quiet();
		const first = await ensureNpmPackage(projectDir, "@hatchingpoint/point-logic");
		const second = await ensureNpmPackage(projectDir, "@hatchingpoint/point-logic");
		expect(second).toBe(first);
	});

	test("resolveEmitTargetForInput prefers module override over project default", async () => {
		const manifest = {
			name: "demo",
			version: "0.0.1",
			emit: "python",
			modules: {
				"src/js-only.point": { emit: "javascript" },
			},
		};
		expect(resolveEmitTargetForInput("src/app.point", manifest, projectDir)).toBe("python");
		expect(resolveEmitTargetForInput("src/js-only.point", manifest, projectDir)).toBe("javascript");
		expect(resolveEmitTargetForInput("src/app.point", { name: "demo", version: "0.0.1" }, projectDir)).toBe("javascript");
	});
});
