import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cryptoJwtSign } from "@hatchingpoint/point/std/crypto";
import {
	pathBasename,
	pathDirname,
	pathExtname,
	pathIsAbsolute,
	pathJoin as joinPaths,
	pathResolve as resolvePath,
} from "@hatchingpoint/point/std/path";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const demoJwtSecret = "demo-jwt-secret";
const demoJwtPayload = '{"sub":"demo-user"}';
const demoJwtToken = cryptoJwtSign(demoJwtPayload, demoJwtSecret);

const PARITY_FIXTURES = [
	"examples/math.point",
	"examples/tools/path-demo.point",
	"examples/api/middleware-demo.point",
] as const;

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

async function runPythonModule(
	pythonPath: string,
	modulePath: string,
	script: string,
	cwd?: string,
): Promise<Record<string, unknown>> {
	const proc = Bun.spawnSync([pythonPath, "-c", script, modulePath], {
		cwd: cwd ?? repoRoot,
		stdout: "pipe",
		stderr: "pipe",
	});
	if (proc.exitCode !== 0) {
		throw new Error(proc.stderr.toString() || proc.stdout.toString() || `Python failed with exit code ${proc.exitCode}`);
	}
	return JSON.parse(proc.stdout.toString()) as Record<string, unknown>;
}

async function findFreePort(): Promise<number> {
	const probe = Bun.serve({ port: 0, fetch: () => new Response("ok") });
	const port = probe.port!;
	probe.stop(true);
	return port;
}

function baseName(fixture: string): string {
	return fixture.split("/").pop()?.replace(/\.point$/, "") ?? "program";
}

const PATH_DEMO_FIXTURE = "examples/tools/path-demo.point";

async function ensureParityArtifacts(fixture: string): Promise<{ jsPath: string; pyPath: string }> {
	const name = baseName(fixture);
	const jsPath = join(repoRoot, "generated", `${name}.js`);
	const pyPath = join(repoRoot, "generated", `${name}.py`);

	if (fixture === PATH_DEMO_FIXTURE) {
		if (!(await Bun.file(jsPath).exists()) || !(await Bun.file(pyPath).exists())) {
			const jsBuild = await Bun.$`bun ${pointCli} build-all`.cwd(repoRoot).quiet();
			const pyBuild = await Bun.$`bun ${pointCli} build-py-all`.cwd(repoRoot).quiet();
			expect(jsBuild.exitCode).toBe(0);
			expect(pyBuild.exitCode).toBe(0);
		}
		return { jsPath, pyPath };
	}

	const jsBuild = await Bun.$`bun ${pointCli} build ${fixture} ${jsPath}`.cwd(repoRoot).quiet();
	const pyBuild = await Bun.$`bun ${pointCli} build-py ${fixture} ${pyPath}`.cwd(repoRoot).quiet();
	expect(jsBuild.exitCode).toBe(0);
	expect(pyBuild.exitCode).toBe(0);
	return { jsPath, pyPath };
}

describe("python parity suite fixtures", () => {
	for (const fixture of PARITY_FIXTURES) {
		test(`${fixture} emits paired JS and Python artifacts`, async () => {
			const { jsPath, pyPath } = await ensureParityArtifacts(fixture);
			expect(await Bun.file(jsPath).exists()).toBe(true);
			expect(await Bun.file(pyPath).exists()).toBe(true);
		});
	}
});

describe("math.point JS/Python parity", () => {
	test("pure logic outputs match", async () => {
		const source = readFileSync(join(repoRoot, "examples/math.point"), "utf8");
		const program = parsePointSource(source);
		const jsPath = join(repoRoot, "generated", "math-parity-suite.js");
		const pyPath = join(repoRoot, "generated", "math-parity-suite.py");
		await Bun.write(jsPath, emitPointCoreJavaScript(program));
		await Bun.write(pyPath, emitPointCorePython(program));

		const jsModule = await import(`file://${jsPath.replaceAll("\\", "/")}`);
		const jsResults = {
			annualPrice: jsModule.annualPrice(10),
			launchReadinessScore: jsModule.launchReadinessScore({
				hasBundleId: true,
				submittedForReview: true,
				hasPassingTests: false,
			}),
			userStatusLabelActive: jsModule.userStatusLabel({ name: "Ada", active: true }),
			userStatusLabelInactive: jsModule.userStatusLabel({ name: "Ada", active: false }),
			scoreStatusLabelExcellent: jsModule.scoreStatusLabel(95),
			scoreStatusLabelKeepGoing: jsModule.scoreStatusLabel(50),
		};

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping math runtime parity");
			expect(jsResults.annualPrice).toBe(120);
			return;
		}

		const pyResults = await runPythonModule(
			pythonPath,
			pyPath,
			`
import importlib.util
import json
import sys

spec = importlib.util.spec_from_file_location("math_module", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

print(json.dumps({
    "annualPrice": module.annualPrice(10),
    "launchReadinessScore": module.launchReadinessScore({
        "hasBundleId": True,
        "submittedForReview": True,
        "hasPassingTests": False,
    }),
    "userStatusLabelActive": module.userStatusLabel({"name": "Ada", "active": True}),
    "userStatusLabelInactive": module.userStatusLabel({"name": "Ada", "active": False}),
    "scoreStatusLabelExcellent": module.scoreStatusLabel(95),
    "scoreStatusLabelKeepGoing": module.scoreStatusLabel(50),
}))
`,
		);
		expect(pyResults).toEqual(jsResults);
	});
});

describe("path-demo.point JS/Python parity", () => {
	test("path calculations and action outputs match", async () => {
		const { pyPath } = await ensureParityArtifacts(PATH_DEMO_FIXTURE);
		// JS: std/path shim (path-demo imports ./path which Bun resolves to path.ts without re-exports).
		const jsResults = {
			configFilePath: joinPaths("src", "app.ts"),
			logFileName: pathBasename("/var/log/app.log"),
			logDirectoryDir: pathDirname("/var/log/app.log"),
			backupExtensionExt: pathExtname("archive.tar.gz"),
			absoluteConfigPathResolved: resolvePath("config/settings.json"),
			usesAbsolutePathPosix: pathIsAbsolute("/tmp/demo"),
			usesAbsolutePathRelative: pathIsAbsolute("relative/demo"),
			pathDemoConfigPath: joinPaths("src", "config.json"),
		};

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping path-demo runtime parity");
			expect(jsResults.configFilePath).toBe("src/app.ts");
			return;
		}

		const pyResults = await runPythonModule(
			pythonPath,
			join(repoRoot, "generated/path-demo.py"),
			`
import asyncio
import importlib.util
import json
import os
import sys

_generated = os.path.dirname(os.path.abspath(sys.argv[1]))
sys.path.insert(0, _generated)
spec = importlib.util.spec_from_file_location("path_demo", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

async def collect():
    return {
        "configFilePath": module.configFilePath("src", "app.ts"),
        "logFileName": module.logFileName("/var/log/app.log"),
        "logDirectoryDir": module.logDirectoryDir("/var/log/app.log"),
        "backupExtensionExt": module.backupExtensionExt("archive.tar.gz"),
        "absoluteConfigPathResolved": module.absoluteConfigPathResolved("config/settings.json"),
        "usesAbsolutePathPosix": module.usesAbsolutePathAbsolute("/tmp/demo"),
        "usesAbsolutePathRelative": module.usesAbsolutePathAbsolute("relative/demo"),
        "pathDemoConfigPath": await module.pathDemoConfigPath("src", "config.json"),
    }

print(json.dumps(asyncio.run(collect())))
`,
			repoRoot,
		);

		expect(pyResults.configFilePath).toBe(jsResults.configFilePath);
		expect(pyResults.logFileName).toBe(jsResults.logFileName);
		expect(pyResults.logDirectoryDir).toBe(jsResults.logDirectoryDir);
		expect(pyResults.backupExtensionExt).toBe(jsResults.backupExtensionExt);
		expect(String(pyResults.absoluteConfigPathResolved)).toMatch(/config[/\\]settings\.json$/);
		expect(String(jsResults.absoluteConfigPathResolved)).toMatch(/config[/\\]settings\.json$/);
		expect(pyResults.usesAbsolutePathPosix).toBe(jsResults.usesAbsolutePathPosix);
		expect(pyResults.usesAbsolutePathRelative).toBe(jsResults.usesAbsolutePathRelative);
		expect(pyResults.pathDemoConfigPath).toBe(jsResults.pathDemoConfigPath);
	});
});

describe("middleware-demo.point JS/Python parity", () => {
	test("demo jwt secret calculation matches", async () => {
		const jsModule = await import(join(repoRoot, "generated/middleware-demo.js"));
		const pythonPath = await resolvePythonCommand();
		expect(jsModule.demoJwtSecret()).toBe(demoJwtSecret);
		if (!pythonPath) {
			console.warn("Python not found — skipping middleware calculation parity");
			return;
		}
		const pyResults = await runPythonModule(
			pythonPath,
			join(repoRoot, "generated/middleware-demo.py"),
			`
import importlib.util
import json
import sys

spec = importlib.util.spec_from_file_location("middleware_demo", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
print(json.dumps({"demoJwtSecret": module.demoJwtSecret()}))
`,
		);
		expect(pyResults.demoJwtSecret).toBe(jsModule.demoJwtSecret());
	});

	describe("HTTP responses", () => {
		let jsBaseUrl = "";
		let pyBaseUrl = "";
		let jsServer: ReturnType<typeof Bun.serve> | null = null;
		let pyServerProcess: ReturnType<typeof Bun.spawn> | null = null;

		beforeAll(async () => {
			const pythonPath = await resolvePythonCommand();
			if (!pythonPath) return;

			const jsGenerated = join(repoRoot, "generated/middleware-demo.js");
			const pyGenerated = join(repoRoot, "generated/middleware-demo.py");
			await Bun.$`bun ${pointCli} build examples/api/middleware-demo.point ${jsGenerated}`.cwd(repoRoot).quiet();
			await Bun.$`bun ${pointCli} build-py examples/api/middleware-demo.point ${pyGenerated}`.cwd(repoRoot).quiet();

			const jsModule = await import(jsGenerated);
			const jsPort = await findFreePort();
			jsServer = Bun.serve({
				port: jsPort,
				fetch: jsModule.createPointRouteFetchHandler(),
			});
			jsBaseUrl = `http://localhost:${jsPort}`;

			const pyPort = await findFreePort();
			pyServerProcess = Bun.spawn(
				[
					pythonPath,
					"-c",
					`import importlib.util, sys
spec = importlib.util.spec_from_file_location("middleware_demo", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.start_routes_server()`,
					pyGenerated,
				],
				{ stdout: "ignore", stderr: "pipe", env: { ...process.env, PORT: String(pyPort) } },
			);
			pyBaseUrl = `http://localhost:${pyPort}`;
			for (let attempt = 0; attempt < 30; attempt += 1) {
				if (pyServerProcess.exitCode !== null) {
					const stderr = await new Response(pyServerProcess.stderr).text();
					throw new Error(`Python route server exited early${stderr ? `: ${stderr}` : ""}`);
				}
				const probe = await fetch(`${pyBaseUrl}/items?limit=probe`, { signal: AbortSignal.timeout(500) }).catch(() => null);
				if (probe) return;
				await Bun.sleep(100);
			}
			throw new Error("Python route server did not accept connections");
		}, 20000);

		afterAll(() => {
			jsServer?.stop(true);
			pyServerProcess?.kill();
		});

		async function compareEndpoints(
			path: string,
			init?: RequestInit,
		): Promise<{ jsStatus: number; pyStatus: number; jsBody: unknown; pyBody: unknown }> {
			const jsResponse = await fetch(`${jsBaseUrl}${path}`, init);
			const pyResponse = await fetch(`${pyBaseUrl}${path}`, init);
			return {
				jsStatus: jsResponse.status,
				pyStatus: pyResponse.status,
				jsBody: await jsResponse.json(),
				pyBody: await pyResponse.json(),
			};
		}

		test("GET /items auth and success responses match JS and Python", async () => {
			const pythonPath = await resolvePythonCommand();
			if (!pythonPath || !jsBaseUrl || !pyBaseUrl) {
				console.warn("Python not found or servers not started — skipping HTTP parity");
				return;
			}

			const missingAuth = await compareEndpoints("/items?limit=book");
			expect(missingAuth.jsStatus).toBe(missingAuth.pyStatus);
			expect(missingAuth.jsBody).toEqual(missingAuth.pyBody);

			const invalidJwt = await compareEndpoints("/items?limit=book", {
				headers: { authorization: "Bearer invalid-token" },
			});
			expect(invalidJwt.jsStatus).toBe(invalidJwt.pyStatus);
			expect(invalidJwt.jsBody).toEqual(invalidJwt.pyBody);

			const validJwt = await compareEndpoints("/items?limit=book", {
				headers: { authorization: `Bearer ${demoJwtToken}` },
			});
			expect(validJwt.jsStatus).toBe(validJwt.pyStatus);
			expect(validJwt.jsBody).toEqual(validJwt.pyBody);
			expect(validJwt.jsBody).toEqual({ item: "book", authenticated: true });
		});

		test("POST /items typed body responses match JS and Python", async () => {
			const pythonPath = await resolvePythonCommand();
			if (!pythonPath || !jsBaseUrl || !pyBaseUrl) {
				console.warn("Python not found or servers not started — skipping HTTP parity");
				return;
			}

			const init: RequestInit = {
				method: "POST",
				headers: {
					authorization: `Bearer ${demoJwtToken}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({ name: "notebook" }),
			};
			const compared = await compareEndpoints("/items", init);
			expect(compared.jsStatus).toBe(compared.pyStatus);
			expect(compared.jsBody).toEqual(compared.pyBody);
			expect(compared.jsBody).toEqual({ item: "notebook", authenticated: true });
		});
	});
});
