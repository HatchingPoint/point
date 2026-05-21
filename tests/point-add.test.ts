import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
	addPointDependency,
	modulePathFromLock,
	parseDependencySpec,
	readPointLock,
	readPointManifest,
	resolveDependencySpec,
	resolveLockFromManifest,
} from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

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

	test("parseDependencySpec accepts workspace and file", () => {
		expect(parseDependencySpec("workspace:std")).toEqual({ kind: "workspace", locator: "std" });
		expect(parseDependencySpec("file:./packages/point-logic")).toEqual({ kind: "file", locator: "./packages/point-logic" });
		expect(parseDependencySpec("npm:@hatchingpoint/point-logic")).toEqual({ kind: "npm", locator: "@hatchingpoint/point-logic" });
		expect(() => parseDependencySpec("invalid")).toThrow(/Invalid dependency spec/);
	});

	test("resolveDependencySpec pins workspace and file paths", () => {
		const std = resolveDependencySpec("workspace:std", repoRoot);
		expect(std).toEqual({ version: "workspace", path: "std" });
		const logic = resolveDependencySpec(`file:packages/point-logic`, repoRoot);
		expect(logic).toEqual({ version: "file", path: "packages/point-logic" });
		expect(() => resolveDependencySpec("npm:lodash", repoRoot)).toThrow(/npm: registry dependencies are not supported/);
	});

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
		expect(modulePathFromLock(lock, "std.text")).toBe("std/text.point");
		expect(() => modulePathFromLock(lock, "missing.text")).toThrow(/Unknown package "missing"/);
	});

	test("point add CLI writes files and rejects npm", async () => {
		const spec = stdSpecFor(projectDir);
		const add = await Bun.$`bun ${cli} add std ${spec}`.cwd(projectDir).quiet();
		expect(add.exitCode).toBe(0);
		expect(add.stdout.toString()).toContain("point.json");
		const manifest = await readPointManifest(projectDir);
		expect(manifest.dependencies?.std).toBe(spec);

		const npm = await Bun.$`bun ${cli} add ext npm:lodash`.cwd(projectDir).nothrow().quiet();
		expect(npm.exitCode).toBe(1);
		expect(npm.stderr.toString()).toMatch(/npm: registry dependencies are not supported/);
	});

	test("file: dependency pins package path in lock", async () => {
		const spec = `file:${relative(projectDir, join(repoRoot, "packages/point-logic"))}`;
		await addPointDependency("logic", spec, projectDir);
		const lock = await readPointLock(projectDir);
		expect(lock?.packages.logic.version).toBe("file");
		expect(lock?.packages.logic.path).toBe(relative(projectDir, join(repoRoot, "packages/point-logic")).split("\\").join("/"));
	});
});
