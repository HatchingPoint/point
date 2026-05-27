import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

import {
	envGet,
	interpretCoreProgramEntry,
	interpretCoreProgramEntryAsync,
	lowerCheckedCoreProgramToBytecode,
	pathBasename,
	pathDirname,
	pathExtname,
	pathIsAbsolute,
	pathJoin,
	pathResolve,
	runtimeReadFile,
	runtimeWriteFile,
} from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../../packages/point/src/core/cli.ts";
import { readPointLock } from "../../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..", "..");

function normalizeSlashes(value: string): string {
	return value.replaceAll("\\", "/");
}

const source = `module RuntimeStdFsEnvPath

capabilities fs env path

calculation joined path sample
  input left: Text
  input right: Text
  output value: Text
  return join paths(left, right)

calculation basename sample
  input path: Text
  output value: Text
  return path basename(path)

calculation dirname sample
  input path: Text
  output value: Text
  return path dirname(path)

calculation extname sample
  input path: Text
  output value: Text
  return path extname(path)

calculation resolve sample
  input path: Text
  output value: Text
  return resolve path(path)

action write sample
  input path: Text
  input contents: Text
  output result: Void or Error
  touches file
  return await write file(path, contents)

action read sample
  input path: Text
  output contents: Text or Error
  touches file
  return await read file(path)

action env sample
  input name: Text
  output value: Maybe<Text>
  touches env
  return await get env var(name)

calculation env default sample
  input value: Maybe<Text>
  output result: Text
  return env with default(value, "fallback")
`;

async function checkedProgram() {
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource("tests/runtime/builtins-fs-env-path.inline.point", source, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime fs/env/path builtins", () => {
	test("mirror std.fs, std.path, and std.env raw exports", () => {
		const tempRoot = mkdtempSync(join(tmpdir(), "point-runtime-builtins-"));
		try {
			const filePath = join(tempRoot, "nested", "sample.point");
			expect(runtimeWriteFile(filePath, "missing directory")).toEqual(expect.objectContaining({ message: expect.any(String) }));

			const existingPath = join(tempRoot, "sample.point");
			expect(runtimeWriteFile(existingPath, "ready")).toBeNull();
			expect(runtimeReadFile(existingPath)).toBe("ready");
			expect(readFileSync(existingPath, "utf8")).toBe("ready");

			expect(normalizeSlashes(pathJoin(tempRoot, "sample.point"))).toBe(normalizeSlashes(join(tempRoot, "sample.point")));
			expect(pathBasename(existingPath)).toBe(basename(existingPath));
			expect(normalizeSlashes(pathDirname(existingPath))).toBe(normalizeSlashes(dirname(existingPath)));
			expect(pathExtname(existingPath)).toBe(extname(existingPath));
			expect(normalizeSlashes(pathResolve("packages/point/std/path.point"))).toBe(normalizeSlashes(resolve("packages/point/std/path.point")));
			expect(pathIsAbsolute(existingPath)).toBe(isAbsolute(existingPath));

			process.env.POINT_RUNTIME_STD_TEST = "from-env";
			expect(envGet("POINT_RUNTIME_STD_TEST")).toBe("from-env");
			delete process.env.POINT_RUNTIME_STD_TEST;
			expect(envGet("POINT_RUNTIME_STD_TEST")).toBeNull();
		} finally {
			rmSync(tempRoot, { recursive: true, force: true });
			delete process.env.POINT_RUNTIME_STD_TEST;
		}
	});

	test("interprets std.fs, std.path, and std.env wrappers through runtime std dispatch", async () => {
		const program = await checkedProgram();
		const ir = lowerCheckedCoreProgramToBytecode(program);
		expect(ir.externals.map((external) => `${external.from}:${external.importName ?? external.name}`).sort()).toEqual([
			"@hatchingpoint/point/std/env:envGet",
			"@hatchingpoint/point/std/fs:readFile",
			"@hatchingpoint/point/std/fs:writeFile",
			"@hatchingpoint/point/std/path:pathBasename",
			"@hatchingpoint/point/std/path:pathDirname",
			"@hatchingpoint/point/std/path:pathExtname",
			"@hatchingpoint/point/std/path:pathIsAbsolute",
			"@hatchingpoint/point/std/path:pathJoin",
			"@hatchingpoint/point/std/path:pathResolve",
		]);

		const tempRoot = mkdtempSync(join(tmpdir(), "point-runtime-std-"));
		try {
			const filePath = join(tempRoot, "sample.point");

			expect(normalizeSlashes(interpretCoreProgramEntry(program, "joinedPathSampleValue", [tempRoot, "sample.point"]) as string)).toBe(normalizeSlashes(join(tempRoot, "sample.point")));
			expect(interpretCoreProgramEntry(program, "basenameSampleValue", [filePath])).toBe(basename(filePath));
			expect(normalizeSlashes(interpretCoreProgramEntry(program, "dirnameSampleValue", [filePath]) as string)).toBe(normalizeSlashes(dirname(filePath)));
			expect(interpretCoreProgramEntry(program, "extnameSampleValue", [filePath])).toBe(extname(filePath));
			expect(normalizeSlashes(interpretCoreProgramEntry(program, "resolveSampleValue", ["packages/point/std/fs.point"]) as string)).toBe(normalizeSlashes(resolve("packages/point/std/fs.point")));

			expect(await interpretCoreProgramEntryAsync(program, "writeSampleResult", [filePath, "runtime fs"])).toBeNull();
			expect(existsSync(filePath)).toBe(true);
			expect(await interpretCoreProgramEntryAsync(program, "readSampleContents", [filePath])).toBe("runtime fs");

			process.env.POINT_RUNTIME_STD_TEST = "from-runtime-env";
			expect(await interpretCoreProgramEntryAsync(program, "envSampleValue", ["POINT_RUNTIME_STD_TEST"])).toBe("from-runtime-env");
			expect(interpretCoreProgramEntry(program, "envDefaultSampleResult", [null])).toBe("fallback");
		} finally {
			rmSync(tempRoot, { recursive: true, force: true });
			delete process.env.POINT_RUNTIME_STD_TEST;
		}
	});
});
