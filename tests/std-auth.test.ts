import { describe, expect, test } from "bun:test";
import { authBearerToken, authJwtOk, authSignJwt, authUnauthorizedJson } from "../packages/point/src/std/auth.ts";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const CLI = resolve(import.meta.dir, "../packages/point/src/cli.ts");
const repoRoot = resolve(import.meta.dir, "..");

describe("std auth", () => {
	test("bearer token strips Bearer prefix", () => {
		expect(authBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
		expect(authBearerToken("abc.def.ghi")).toBe("abc.def.ghi");
	});

	test("jwt auth ok validates signed token", () => {
		const secret = "demo-secret";
		const token = authSignJwt('{"sub":"user"}', secret);
		expect(authJwtOk(`Bearer ${token}`, secret)).toBe(true);
		expect(authJwtOk("Bearer bad", secret)).toBe(false);
	});

	test("unauthorized json body is stable", () => {
		expect(authUnauthorizedJson()).toBe('{"error":"unauthorized"}');
	});

	test("auth-demo.point checks clean", () => {
		const output = execFileSync("bun", [CLI, "check", "examples/tools/auth-demo.point"], {
			cwd: repoRoot,
			encoding: "utf8",
		});
		expect(output).toContain("Point core check passed");
	});

	test("point capabilities lists auth", () => {
		const output = execFileSync("bun", [CLI, "capabilities"], { cwd: repoRoot, encoding: "utf8" });
		expect(output).toContain("use auth");
	});
});
