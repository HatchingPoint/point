import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { interpretCoreProgramEntry, lowerCheckedCoreProgramToBytecode } from "../../packages/point/runtime/index.ts";
import { jsonParse, jsonStringify } from "../../packages/point/runtime/builtins/json.ts";
import { textContains, textFromInt, textLength, textPadStart, textSplit, textTrim } from "../../packages/point/runtime/builtins/text.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../../packages/point/src/core/cli.ts";
import { readPointLock } from "../../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..", "..");

const source = `module RuntimeStdTextJson

capabilities text json

calculation trim sample
  output value: Text
  value is text trim("  Ready  ")

calculation contains sample
  output value: Bool
  value is text contains("deploy-ready", "ready")

calculation split sample
  output value: List<Text>
  value is text split("red,green,blue", ",")

calculation text from int sample
  output value: Text
  value is text from int(42)

calculation pad sample
  output value: Text
  value is text pad start("7", 3, "0")

calculation stringify sample
  output value: Text
  value is json stringify("{\\"ok\\":true}")

action parse sample
  output value: Text or Error
  touches none
  return json parse("{\\"count\\":2}")
`;

async function checkedProgram() {
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource("tests/runtime/std-text-json.inline.point", source, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime std text/json dispatch", () => {
	test("interprets std.text and std.json calls without emitted imports", async () => {
		const program = await checkedProgram();
		const ir = lowerCheckedCoreProgramToBytecode(program);
		expect(ir.externals.map((external) => external.name).sort()).toEqual([
			"jsonParse",
			"jsonStringify",
			"textContains",
			"textFromIntRaw",
			"textLength",
			"textPadStartRaw",
			"textSplit",
			"textTrim",
		]);

		expect(interpretCoreProgramEntry(program, "trimSampleValue")).toBe(textTrim("  Ready  "));
		expect(interpretCoreProgramEntry(program, "containsSampleValue")).toBe(textContains("deploy-ready", "ready"));
		expect(interpretCoreProgramEntry(program, "splitSampleValue")).toEqual(textSplit("red,green,blue", ","));
		expect(interpretCoreProgramEntry(program, "textFromIntSampleValue")).toBe(textFromInt(42));
		expect(interpretCoreProgramEntry(program, "padSampleValue")).toBe(textPadStart("7", 3, "0"));
		expect(interpretCoreProgramEntry(program, "stringifySampleValue")).toBe(jsonStringify('{"ok":true}'));
		expect(interpretCoreProgramEntry(program, "parseSampleValue")).toEqual(jsonParse('{"count":2}'));
	});

	test("runtime-owned apps run std.text and std.json through the runtime CLI without generated emit", async () => {
		const appRoot = mkdtempSync(join(tmpdir(), "point-runtime-std-"));
		try {
			mkdirSync(join(appRoot, "src"), { recursive: true });
			writeFileSync(
				join(appRoot, "point.json"),
				`${JSON.stringify({ name: "runtime-std", version: "0.1.0", entry: "src/app.point", runtime: "owned" }, null, 2)}\n`,
			);
			writeFileSync(
				join(appRoot, "src/app.point"),
				`module RuntimeStdApp

capabilities text json

command smoke
  output value: Text
  return text trim(json stringify("{\\"ok\\":true}"))
`,
			);

			const run = await Bun.$`bun packages/point/src/cli.ts run ${join(appRoot, "src/app.point")}`.quiet();
			expect(run.stdout.toString().trim()).toBe('{"ok":true}');
			expect(existsSync(join(appRoot, "generated"))).toBe(false);
			expect(existsSync(join(appRoot, ".point-cache"))).toBe(false);
		} finally {
			rmSync(appRoot, { recursive: true, force: true });
		}
	});
});
