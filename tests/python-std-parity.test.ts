import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { envGet } from "@hatchingpoint/point/std/env";
import {
	cryptoHmacSha256,
	cryptoJwtIsValid,
	cryptoJwtSign,
	cryptoJwtVerify,
	cryptoSha256,
} from "@hatchingpoint/point/std/crypto";
import { httpGet, httpPost } from "@hatchingpoint/point/std/http";
import { jsonParse, jsonStringify } from "@hatchingpoint/point/std/json";
import { processSpawn } from "@hatchingpoint/point/std/process";
import { yamlParse, yamlStringify } from "@hatchingpoint/point/std/yaml";
import {
	pathBasename,
	pathDirname,
	pathExtname,
	pathIsAbsolute,
	pathJoin,
	pathResolve as resolvePath,
} from "@hatchingpoint/point/std/path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
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

async function runPythonStdParityAsync(
	pythonPath: string,
	script: string,
): Promise<Record<string, unknown>> {
	const proc = Bun.spawn([pythonPath, "-c", script], {
		cwd: repoRoot,
		env: { ...process.env, PYTHONPATH: pythonStdRoot },
		stdout: "pipe",
		stderr: "pipe",
	});
	const exitCode = await proc.exited;
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	if (exitCode !== 0) {
		throw new Error(stderr || stdout || `Python parity failed with exit code ${exitCode}`);
	}
	return JSON.parse(stdout) as Record<string, unknown>;
}

function pythonHasPyYaml(pythonPath: string): boolean {
	const proc = Bun.spawnSync([pythonPath, "-c", "import yaml"], { stdout: "pipe", stderr: "pipe" });
	return proc.exitCode === 0;
}

describe("python std mirror", () => {
	test("emit maps @hatchingpoint/point/std imports to point_std modules", () => {
		for (const fixture of ["std/path.point", "std/json.point", "std/env.point", "std/crypto.point", "std/process.point", "std/yaml.point", "std/http.point"]) {
			const program = parsePointSource(readFileSync(join(repoRoot, fixture), "utf8"));
			const emitted = emitPointCorePython(program);
			expect(emitted).toContain("_point_std_root");
			expect(emitted).toContain("from point_std.");
			expect(emitted).not.toContain("@hatchingpoint/point/std");
		}
	});

	test("use std.json resolves to point_std imports via build-py", async () => {
		const source = `module JsonDemo

use std.json

calculation stringify demo
  input value: Text
  output result: Text
  result is stringifyJsonResult(value)
`;
		const tempDir = mkdtempSync(join(tmpdir(), "point-json-demo-"));
		const inputPath = join(tempDir, "json-demo.point");
		const outputPath = join(tempDir, "json-demo.py");
		writeFileSync(inputPath, source, "utf8");
		try {
			const build = await Bun.$`bun ${pointCli} build-py ${inputPath} ${outputPath}`.cwd(repoRoot).quiet();
			expect(build.exitCode).toBe(0);
			const emitted = readFileSync(outputPath, "utf8");
			expect(emitted).toContain("_point_std_candidates");
			expect(emitted).toContain("from point_std.json import jsonStringify as jsonStringify");
			expect(emitted).toContain("def stringifyDemoResult(value: str) -> str:");
			expect(emitted).not.toContain("@hatchingpoint/point/std");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("import declarations from std modules rewrite to point_std", () => {
		const program = parsePointSource(readFileSync(join(repoRoot, "examples/tools/path-demo.point"), "utf8"));
		program.declarations.unshift({
			kind: "import",
			from: "std/path",
			names: ["joinPaths", "pathBasename", "pathDirname", "pathExtname", "resolvePath", "pathIsAbsolute"],
		});
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("from point_std.path import pathJoin as joinPaths");
		expect(emitted).toContain("from point_std.path import pathResolve as resolvePath");
		expect(emitted).not.toContain("from path import");
	});

	test("relative std sibling imports stay on generated modules", () => {
		const program = parsePointSource(readFileSync(join(repoRoot, "examples/tools/process-runner.point"), "utf8"));
		program.declarations.unshift({
			kind: "import",
			from: "./process",
			names: ["ProcessResult", "spawnCommandResult", "processStdout", "processExitCode"],
		});
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("from process import ProcessResult, spawnCommandResult, processStdout, processExitCode");
		expect(emitted).not.toContain("from point_std.process import ProcessResult");
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

	test("env shim parity between JS and Python", async () => {
		const key = "POINT_PY_STD_ENV_PARITY";
		const original = process.env[key];
		process.env[key] = "ready";
		try {
			const jsResults = {
				present: envGet(key),
				missing: envGet(`${key}_MISSING`),
			};

			const pythonPath = await resolvePythonCommand();
			if (!pythonPath) {
				console.warn("Python not found — skipping env runtime parity test");
				expect(jsResults.present).toBe("ready");
				return;
			}

			const pyResults = await runPythonStdParity(
				pythonPath,
				`
import json
import os
from point_std.env import envGet

key = "POINT_PY_STD_ENV_PARITY"
os.environ[key] = "ready"
print(json.dumps({
    "present": envGet(key),
    "missing": envGet(key + "_MISSING"),
}))
`,
			);

			expect(pyResults.present).toBe(jsResults.present);
			expect(pyResults.missing).toBe(jsResults.missing);
		} finally {
			if (original === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = original;
			}
		}
	});

	test("process shim parity between JS and Python", async () => {
		const message = "point-process-parity";
		const jsResult = await processSpawn("echo", [message], []);
		expect(jsResult).toEqual(expect.objectContaining({ exitCode: 0 }));

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping process runtime parity test");
			expect((jsResult as { stdout: string }).stdout.trim()).toBe(message);
			return;
		}

		const pyResult = await runPythonStdParity(
			pythonPath,
			`
import asyncio
import json
from point_std.process import processSpawn

async def run():
    return await processSpawn("echo", [${JSON.stringify(message)}], [])

print(json.dumps(asyncio.run(run())))
`,
		);

		expect(pyResult).toEqual(jsResult);
	});

	test("use std.process build-py emits await for spawn raw", async () => {
		const source = readFileSync(join(repoRoot, "std/process.point"), "utf8");
		const program = parsePointSource(source);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("from point_std.process import processSpawn as spawnRaw");
		expect(emitted).toContain("return await spawnRaw(command, args, env)");
		expect(emitted).toContain("async for __point_line in streamLinesRaw(command, args, env):");
	});

	test("crypto shim parity between JS and Python", async () => {
		const secret = "demo-jwt-secret";
		const payload = '{"sub":"demo-user","role":"reader"}';
		const token = cryptoJwtSign(payload, secret);
		const jsResults = {
			sha256: cryptoSha256("hello"),
			hmac: cryptoHmacSha256("The quick brown fox jumps over the lazy dog", "key"),
			jwtValid: cryptoJwtIsValid(`Bearer ${token}`, secret),
			jwtPayload: cryptoJwtVerify(`Bearer ${token}`, secret),
			jwtInvalid: cryptoJwtVerify("Bearer not-a-jwt", secret),
		};

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping crypto runtime parity test");
			expect(jsResults.sha256).toHaveLength(64);
			return;
		}

		const pyResults = await runPythonStdParity(
			pythonPath,
			`
import json
from point_std.crypto import (
    cryptoHmacSha256,
    cryptoJwtIsValid,
    cryptoJwtSign,
    cryptoJwtVerify,
    cryptoSha256,
)

secret = "demo-jwt-secret"
payload = '{"sub":"demo-user","role":"reader"}'
token = cryptoJwtSign(payload, secret)
print(json.dumps({
    "sha256": cryptoSha256("hello"),
    "hmac": cryptoHmacSha256("The quick brown fox jumps over the lazy dog", "key"),
    "jwtValid": cryptoJwtIsValid("Bearer " + token, secret),
    "jwtPayload": cryptoJwtVerify("Bearer " + token, secret),
    "jwtInvalid": cryptoJwtVerify("Bearer not-a-jwt", secret),
}))
`,
		);

		expect(pyResults.sha256).toBe(jsResults.sha256);
		expect(pyResults.hmac).toBe(jsResults.hmac);
		expect(pyResults.jwtValid).toBe(jsResults.jwtValid);
		expect(pyResults.jwtPayload).toBe(jsResults.jwtPayload);
		expect(pyResults.jwtInvalid).toEqual({ message: expect.any(String) });
		expect(jsResults.jwtInvalid).toEqual({ message: expect.any(String) });
	});

	test("yaml shim parity between JS and Python", async () => {
		const input = "service:\n  name: demo-api\n  port: 8080\n";
		const invalid = "service: [\n";
		const parsed = yamlParse(input);
		expect(typeof parsed).toBe("string");
		const jsResults = {
			parseOk: parsed,
			stringifyOk: yamlStringify(parsed as string),
			parseError: yamlParse(invalid),
		};

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping yaml runtime parity test");
			return;
		}
		if (!pythonHasPyYaml(pythonPath)) {
			console.warn("PyYAML not found — skipping yaml runtime parity test");
			expect(jsResults.parseOk).toBe('{"service":{"name":"demo-api","port":8080}}');
			return;
		}

		const pyResults = await runPythonStdParity(
			pythonPath,
			`
import json
from point_std.yaml import yamlParse, yamlStringify

input_value = "service:\\n  name: demo-api\\n  port: 8080\\n"
parsed = yamlParse(input_value)
print(json.dumps({
    "parseOk": parsed,
    "stringifyOk": yamlStringify(parsed),
    "parseError": yamlParse("service: [\\n"),
}))
`,
		);

		expect(pyResults.parseOk).toBe(jsResults.parseOk);
		expect(pyResults.stringifyOk).toBe(jsResults.stringifyOk);
		expect(pyResults.parseError).toEqual({ message: expect.any(String) });
		expect(jsResults.parseError).toEqual({ message: expect.any(String) });
	});

	test("http shim parity between JS and Python", async () => {
		const server = Bun.serve({
			hostname: "127.0.0.1",
			port: 0,
			async fetch(request) {
				const url = new URL(request.url);
				if (request.method === "GET" && url.pathname === "/get") {
					return new Response("get-ok");
				}
				if (request.method === "POST" && url.pathname === "/post") {
					const body = await request.text();
					return new Response(`post:${body}`);
				}
				return new Response("missing", { status: 404, statusText: "Not Found" });
			},
		});
		const base = `http://127.0.0.1:${server.port}`;
		try {
			const jsResults = {
				get: await httpGet(`${base}/get`),
				post: await httpPost(`${base}/post`, "payload"),
				missing: await httpGet(`${base}/missing`),
			};

			const pythonPath = await resolvePythonCommand();
			if (!pythonPath) {
				console.warn("Python not found — skipping http runtime parity test");
				expect(jsResults.get).toBe("get-ok");
				return;
			}

			const pyResults = await runPythonStdParityAsync(
				pythonPath,
				`
import asyncio
import json
from point_std.http import httpGet, httpPost

base = ${JSON.stringify(base)}

async def collect():
    return {
        "get": await httpGet(base + "/get"),
        "post": await httpPost(base + "/post", "payload"),
        "missing": await httpGet(base + "/missing"),
    }

print(json.dumps(asyncio.run(collect())))
`,
			);

			expect(pyResults.get).toBe(jsResults.get);
			expect(pyResults.post).toBe(jsResults.post);
			expect(pyResults.missing).toEqual(jsResults.missing);
		} finally {
			server.stop(true);
		}
	});
});
