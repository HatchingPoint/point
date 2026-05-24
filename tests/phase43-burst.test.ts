import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const CLI = resolve(import.meta.dir, "../packages/point/src/cli.ts");
const repoRoot = resolve(import.meta.dir, "..");

describe("Phase 43 demo and repair", () => {
	test("point demo prints golden path for auth demo", () => {
		const output = execFileSync("bun", [CLI, "demo", "examples/tools/auth-demo.point"], {
			cwd: repoRoot,
			encoding: "utf8",
		});
		expect(output).toContain("Point golden demo");
		expect(output).toContain("point dev examples/tools/auth-demo.point");
		expect(output).toContain("point repair");
	});

	test("point repair aliases repair-plan", () => {
		const plan = execFileSync("bun", [CLI, "repair", "examples/math.point"], {
			cwd: repoRoot,
			encoding: "utf8",
		});
		const alias = execFileSync("bun", [CLI, "repair-plan", "examples/math.point"], {
			cwd: repoRoot,
			encoding: "utf8",
		});
		expect(plan).toBe(alias);
	});
});
