import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { editorConfigPaths } from "../packages/point/src/core/editor-config.ts";
import { runPointInit } from "../packages/point/src/core/init-project.ts";

describe("point init", () => {
	test("writes editor configs and adds devDependency", async () => {
		const root = mkdtempSync(join(tmpdir(), "point-init-"));
		writeFileSync(
			join(root, "package.json"),
			`${JSON.stringify({ name: "surgetn-marketing", private: true, scripts: {} }, null, 2)}\n`,
		);
		mkdirSync(join(root, "src"), { recursive: true });
		writeFileSync(join(root, "src", "app.point"), 'module App\n\ncommand main\n  output result: Text\n  return "ok"\n');

		const result = await runPointInit(["--skip-install", "--force"], root);
		expect(result.pointEntry).toBe("src/app.point");
		for (const relativePath of editorConfigPaths()) {
			expect(existsSync(join(root, relativePath))).toBe(true);
		}
		const pkg = JSON.parse(await Bun.file(join(root, "package.json")).text()) as {
			devDependencies?: Record<string, string>;
			scripts?: Record<string, string>;
		};
		expect(pkg.devDependencies?.["@hatchingpoint/point"]).toBeDefined();
		expect(pkg.scripts?.check).toContain("src/app.point");
	});

	test("creates point.json when missing and .point files exist", async () => {
		const root = mkdtempSync(join(tmpdir(), "point-init-manifest-"));
		writeFileSync(join(root, "logic.point"), 'module Logic\n\ncommand main\n  output result: Text\n  return "ok"\n');
		await runPointInit(["--skip-install", "--force"], root);
		expect(existsSync(join(root, "point.json"))).toBe(true);
		expect(existsSync(join(root, "point.lock"))).toBe(true);
	});
});
