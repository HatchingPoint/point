import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { parseCapabilityNamesFromLine } from "../packages/point/src/core/capabilities.ts";
import { findRunEntryName } from "../packages/point/src/core/commands.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { formatSemanticProgram } from "../packages/point/src/semantic/format.ts";
import { parseSemanticSource } from "../packages/point/src/semantic/parse.ts";

const CLI = resolve(import.meta.dir, "../packages/point/src/cli.ts");
const repoRoot = resolve(import.meta.dir, "..");

describe("Phase 39 launch syntax", () => {
	test("capabilities line expands to use declarations", () => {
		expect(parseCapabilityNamesFromLine("capabilities http json")).toEqual(["http", "json"]);
		const program = parseSemanticSource(
			`module Demo\n\ncapabilities http json\n\ncalculation noop\n  output value: Text\n  return "ok"\n`,
		);
		expect(program.uses.map((use) => use.moduleName)).toEqual(["std.http", "std.json"]);
		expect(formatSemanticProgram(program)).toContain("capabilities http json");
	});

	test("point commands lists instant demo command", () => {
		const output = execFileSync("bun", [CLI, "commands", "examples/command.point"], {
			cwd: repoRoot,
			encoding: "utf8",
		});
		expect(output).toContain("hello cli");
		expect(output).toContain("point run examples/command.point hello cli");
	});

	test("point launch runs named command", async () => {
		const result = await Bun.$`bun ${CLI} launch examples/command.point hello cli`.cwd(repoRoot).quiet();
		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toContain("Hello");
	});

	test("findRunEntryName resolves command by semantic name", () => {
		const program = parsePointSource(`module Demo\n\ncommand instant demo\n  output result: Text\n  return "ok"\n`);
		expect(findRunEntryName(program, "instant demo")).toBeTruthy();
	});
});
