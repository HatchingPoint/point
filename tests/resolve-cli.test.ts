import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { findPointProjectRoot, LOCAL_POINT_CLI_REL, resolveLocalPointCli, resolvePointCli } from "../packages/point/src/core/resolve-cli.ts";

function makeProject(): string {
	const root = mkdtempSync(join(tmpdir(), "point-cli-"));
	writeFileSync(join(root, "package.json"), '{"name":"demo"}\n');
	mkdirSync(join(root, LOCAL_POINT_CLI_REL.replace(/\/cli\.ts$/, "")), { recursive: true });
	writeFileSync(join(root, LOCAL_POINT_CLI_REL), "export {}\n");
	return root;
}

describe("resolvePointCli", () => {
	test("finds local package cli before global path", () => {
		const root = makeProject();
		const resolved = resolvePointCli({ cwd: join(root, "src"), findOnPath: () => "/usr/bin/point" });
		expect(resolved?.source).toBe("local-package");
		expect(resolved?.command).toBe("bun");
		expect(resolved?.argsPrefix[0]?.replaceAll("\\", "/")).toContain("@hatchingpoint/point/src/cli.ts");
	});

	test("resolveLocalPointCli walks up from nested directories", () => {
		const root = makeProject();
		const nested = join(root, "src", "pages");
		mkdirSync(nested, { recursive: true });
		const resolved = resolveLocalPointCli(nested);
		expect(resolved?.root).toBe(root);
	});

	test("findPointProjectRoot prefers package.json ancestor", () => {
		const root = makeProject();
		writeFileSync(join(root, "point.json"), '{"name":"demo"}\n');
		const nested = join(root, "src");
		mkdirSync(nested, { recursive: true });
		expect(findPointProjectRoot(nested)).toBe(root);
	});
});
