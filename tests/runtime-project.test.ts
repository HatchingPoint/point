import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { findRuntimeOwnedProjectRoot, isRuntimeNativeInput } from "../packages/point/src/core/runtime-project.ts";

describe("runtime-owned project detection", () => {
	test("detects experiments/point-only via runtime owned manifest", () => {
		expect(findRuntimeOwnedProjectRoot("experiments/point-only/src/app.point")).toBeTruthy();
		expect(isRuntimeNativeInput("experiments/point-only/src/app.point")).toBe(true);
	});

	test("detects point.json runtime owned in scaffolded apps", () => {
		const dir = mkdtempSync(join(tmpdir(), "point-runtime-app-"));
		try {
			writeFileSync(
				join(dir, "point.json"),
				JSON.stringify({ name: "demo", version: "0.1.0", entry: "src/app.point", runtime: "owned" }),
			);
			mkdirSync(join(dir, "src"), { recursive: true });
			writeFileSync(join(dir, "src", "app.point"), "module Demo\ncommand smoke\n  return \"ok\"\n");
			expect(findRuntimeOwnedProjectRoot(join(dir, "src/app.point"))).toBe(dir);
			expect(isRuntimeNativeInput(join(dir, "src/app.point"))).toBe(true);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	test("ignores apps without runtime owned manifest", () => {
		const dir = mkdtempSync(join(tmpdir(), "point-legacy-app-"));
		try {
			writeFileSync(join(dir, "point.json"), JSON.stringify({ name: "demo", version: "0.1.0" }));
			expect(findRuntimeOwnedProjectRoot(join(dir, "src/app.point"))).toBeNull();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
