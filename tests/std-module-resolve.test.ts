import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createUseSourceResolver } from "../packages/point/src/core/module-resolve.ts";
import { modulePathFromLock, readPointLockSync } from "../packages/point/src/core/packages.ts";
import { collectSemanticCallables } from "../packages/point/src/semantic/callables.ts";

const repoRoot = join(import.meta.dir, "..");

describe("std module resolution", () => {
	test("resolves std.auth from scaffold cwd with absolute path", () => {
		const cwd = join(repoRoot, "tests/tmp/launch-saas3");
		if (!existsSync(cwd)) return;
		const lock = readPointLockSync(cwd);
		const path = modulePathFromLock(lock, "std.auth", cwd);
		expect(existsSync(resolve(cwd, path))).toBe(true);
		const resolveUseSource = createUseSourceResolver(cwd, "src/app.point");
		const source = resolveUseSource({ moduleName: "std.auth" }, "src/app.point");
		expect(source).toContain("module StdAuth");
	});

	test("collects auth ok from capabilities auth line", () => {
		const cwd = join(repoRoot, "tests/tmp/launch-saas3");
		if (!existsSync(join(cwd, "src/app.point"))) return;
		const text = readFileSync(join(cwd, "src/app.point"), "utf8");
		const resolveUseSource = createUseSourceResolver(cwd, "src/app.point");
		const callables = collectSemanticCallables(text, { resolveUseSource, inputPath: "src/app.point", cwd });
		expect(callables).toContain("auth ok");
	});
});
