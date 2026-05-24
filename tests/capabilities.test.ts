import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import {
	BUILTIN_CAPABILITIES,
	isBuiltinCapabilityName,
	listPointCapabilities,
	normalizeUseModuleName,
	POINT_CAPABILITIES_SCHEMA,
} from "../packages/point/src/core/capabilities.ts";
import { parseSemanticSource } from "../packages/point/src/semantic/parse.ts";
import { formatSemanticProgram } from "../packages/point/src/semantic/format.ts";

const CLI = resolve(import.meta.dir, "../packages/point/src/cli.ts");

describe("built-in capabilities", () => {
	test("normalizeUseModuleName maps shorthand to std modules", () => {
		expect(normalizeUseModuleName("http")).toBe("std.http");
		expect(normalizeUseModuleName("json")).toBe("std.json");
		expect(normalizeUseModuleName("std.http")).toBe("std.http");
		expect(normalizeUseModuleName("Billing", "./billing.point")).toBe("Billing");
		expect(normalizeUseModuleName("Billing")).toBe("Billing");
	});

	test("registry covers all std capability names", () => {
		expect(BUILTIN_CAPABILITIES.length).toBe(15);
		for (const entry of BUILTIN_CAPABILITIES) {
			expect(isBuiltinCapabilityName(entry.name)).toBe(true);
			expect(entry.module).toBe(`std.${entry.name}`);
		}
	});

	test("parseSemanticSource normalizes use http to std.http", () => {
		const program = parseSemanticSource(
			`module Demo\n\ncalculation noop\n  output value: Text\n  return "ok"\n\nuse http\n\nuse Billing from "./billing.point"\n`,
		);
		expect(program.uses.map((use) => use.moduleName)).toEqual(["std.http", "Billing"]);
	});

	test("capabilities-demo.point checks clean", async () => {
		const output = execFileSync("bun", [CLI, "check", "examples/capabilities-demo.point"], {
			cwd: resolve(import.meta.dir, ".."),
			encoding: "utf8",
		});
		expect(output).toContain("Point core check passed");
	});

	test("format groups builtin uses into capabilities line", () => {
		const source = `module Demo\n\nuse http\n\nuse json\n\ncalculation noop\n  output value: Text\n  return "ok"\n`;
		const program = parseSemanticSource(source);
		expect(formatSemanticProgram(program)).toContain("capabilities http json");
		expect(formatSemanticProgram(program)).not.toContain("use std.http");
	});

	test("parseSemanticSource expands capabilities line", () => {
		const program = parseSemanticSource(
			`module Demo\n\ncapabilities http json\n\ncalculation noop\n  output value: Text\n  return "ok"\n`,
		);
		expect(program.uses.map((use) => use.moduleName)).toEqual(["std.http", "std.json"]);
	});

	test("point capabilities --json lists catalog", () => {
		const output = execFileSync("bun", [CLI, "capabilities", "--json"], {
			cwd: resolve(import.meta.dir, ".."),
			encoding: "utf8",
		});
		const catalog = JSON.parse(output) as ReturnType<typeof listPointCapabilities>;
		expect(catalog.schemaVersion).toBe(POINT_CAPABILITIES_SCHEMA);
		expect(catalog.capabilities.length).toBe(BUILTIN_CAPABILITIES.length);
		expect(catalog.shorthand).toBe("use http");
	});
});
