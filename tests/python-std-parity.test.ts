import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { jsonParse, jsonStringify } from "@hatchingpoint/point/std/json";
import {
	pathBasename,
	pathDirname,
	pathExtname,
	pathIsAbsolute,
	pathJoin,
	pathResolve as resolvePath,
} from "@hatchingpoint/point/std/path";

const repoRoot = join(import.meta.dir, "..");
const pythonStdRoot = join(repoRoot, "packages/point/python_std");

async function resolvePythonCommand(): Promise<string | null> {
	for (const candidate of ["python3", "python", "py"]) {
		try {
			const probe = Bun.spawnSync([candidate, "--version"], { stdout: "pipe", stderr: "pipe" });
			if (probe.exitCode === 0) return candidate;
		} catch {
			continue;
		}
	}
	return null;
}

async function runPythonStdParity(
	pythonPath: string,
	script: string,
): Promise<Record<string, unknown>> {
	const proc = Bun.spawnSync([pythonPath, "-c", script], {
		cwd: repoRoot,
		env: { ...process.env, PYTHONPATH: pythonStdRoot },
		stdout: "pipe",
		stderr: "pipe",
	});
	if (proc.exitCode !== 0) {
		throw new Error(proc.stderr.toString() || proc.stdout.toString() || `Python parity failed with exit code ${proc.exitCode}`);
	}
	return JSON.parse(proc.stdout.toString()) as Record<string, unknown>;
}

describe("python std mirror", () => {
	test("emit maps @hatchingpoint/point/std imports to point_std modules", () => {
		for (const fixture of ["std/path.point", "std/json.point", "std/crypto.point"]) {
			const program = parsePointSource(readFileSync(join(repoRoot, fixture), "utf8"));
			const emitted = emitPointCorePython(program);
			expect(emitted).toContain("_point_std_root");
			expect(emitted).toContain("from point_std.");
			expect(emitted).not.toContain("@hatchingpoint/point/std");
		}
	});

	test("path shim parity between JS and Python", async () => {
		const jsResults = {
			join: pathJoin("src", "app.ts"),
			basename: pathBasename("/var/log/app.log"),
			dirname: pathDirname("/var/log/app.log"),
			extname: pathExtname("archive.tar.gz"),
			resolve: resolvePath("config/settings.json"),
			absolutePosix: pathIsAbsolute("/tmp/demo"),
			absoluteRelative: pathIsAbsolute("relative/demo"),
		};

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping path runtime parity test");
			expect(jsResults.join).toBe("src/app.ts");
			return;
		}

		const pyResults = await runPythonStdParity(
			pythonPath,
			`
import json
from point_std.path import pathBasename, pathDirname, pathExtname, pathIsAbsolute, pathJoin, pathResolve

print(json.dumps({
    "join": pathJoin("src", "app.ts"),
    "basename": pathBasename("/var/log/app.log"),
    "dirname": pathDirname("/var/log/app.log"),
    "extname": pathExtname("archive.tar.gz"),
    "resolve": pathResolve("config/settings.json"),
    "absolutePosix": pathIsAbsolute("/tmp/demo"),
    "absoluteRelative": pathIsAbsolute("relative/demo"),
}))
`,
		);

		expect(pyResults.join).toBe(jsResults.join);
		expect(pyResults.basename).toBe(jsResults.basename);
		expect(pyResults.dirname).toBe(jsResults.dirname);
		expect(pyResults.extname).toBe(jsResults.extname);
		expect(String(pyResults.resolve)).toMatch(/config[/\\]settings\.json$/);
		expect(String(jsResults.resolve)).toMatch(/config[/\\]settings\.json$/);
		expect(pyResults.absolutePosix).toBe(jsResults.absolutePosix);
		expect(pyResults.absoluteRelative).toBe(jsResults.absoluteRelative);
	});

	test("json shim parity between JS and Python", async () => {
		const input = '{"name":"Point","count":2}';
		const invalid = "{";

		const jsResults = {
			parseOk: jsonParse(input),
			stringifyOk: jsonStringify(input),
			parseError: jsonParse(invalid),
		};

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping json runtime parity test");
			expect(jsResults.parseOk).toBe(input);
			return;
		}

		const pyResults = await runPythonStdParity(
			pythonPath,
			`
import json
from point_std.json import jsonParse, jsonStringify

input_value = '{"name":"Point","count":2}'
print(json.dumps({
    "parseOk": jsonParse(input_value),
    "stringifyOk": jsonStringify(input_value),
    "parseError": jsonParse("{"),
}))
`,
		);

		expect(pyResults.parseOk).toBe(jsResults.parseOk);
		expect(pyResults.stringifyOk).toBe(jsResults.stringifyOk);
		expect(pyResults.parseError).toEqual({ message: expect.any(String) });
		expect(jsResults.parseError).toEqual({ message: expect.any(String) });
	});
});
