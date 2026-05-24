import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython, isPureLogicProgram } from "../packages/point/src/core/emit-python.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];

async function discoverFixtures(): Promise<string[]> {
	const fixtures = new Set<string>();
	for (const pattern of FIXTURE_PATTERNS) {
		const glob = new Bun.Glob(pattern);
		for await (const path of glob.scan({ cwd: repoRoot, onlyFiles: true })) {
			if (!path.includes("/generated/")) fixtures.add(path.replaceAll("\\", "/"));
		}
	}
	return [...fixtures].sort((a, b) => a.localeCompare(b));
}

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

async function runPythonSmokeTest(pythonPath: string, modulePath: string): Promise<Record<string, unknown>> {
	const script = `
import importlib.util
import json
import sys

spec = importlib.util.spec_from_file_location("math_module", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

results = {
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
}
print(json.dumps(results))
`;
	const proc = Bun.spawnSync([pythonPath, "-c", script, modulePath], { stdout: "pipe", stderr: "pipe" });
	if (proc.exitCode !== 0) {
		throw new Error(proc.stderr.toString() || proc.stdout.toString() || `Python smoke test failed with exit code ${proc.exitCode}`);
	}
	return JSON.parse(proc.stdout.toString()) as Record<string, unknown>;
}

async function runActionPythonSmokeTest(pythonPath: string, modulePath: string, fixturePath: string): Promise<string> {
	const script = `
import asyncio
import importlib.util
import sys

spec = importlib.util.spec_from_file_location("action_module", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

async def main():
    return await module.loadConfigContents(sys.argv[2])

print(asyncio.run(main()))
`;
	const proc = Bun.spawnSync([pythonPath, "-c", script, modulePath, fixturePath], { stdout: "pipe", stderr: "pipe" });
	if (proc.exitCode !== 0) {
		throw new Error(proc.stderr.toString() || proc.stdout.toString() || `Python action smoke test failed with exit code ${proc.exitCode}`);
	}
	return proc.stdout.toString().trim();
}

describe("python emit", () => {
	test("emit backend consumes core AST only", () => {
		const program = parsePointSource(`module Math

calculation double
  input value: Int
  output doubled: Int
  doubled is value * 2
`);
		expect(program.kind).toBe("coreProgram");
		expect(emitPointCorePython(program)).toContain("def doubleDoubled(value: int) -> int:");
		expect(emitPointCorePython(program)).not.toContain("export function");
	});

	test("math.point emits typed Python for pure logic", () => {
		const source = readFileSync(join(repoRoot, "examples/math.point"), "utf8");
		const program = parsePointSource(source);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("class User(TypedDict):");
		expect(emitted).toContain("name: str");
		expect(emitted).toContain("active: bool");
		expect(emitted).toContain("def annualPrice(monthlyPrice: int) -> int:");
		expect(emitted).toContain("return (monthlyPrice * 12)");
		expect(emitted).toContain('signals["hasBundleId"]');
		expect(emitted).toContain('return "excellent"');
	});

	test("build-py CLI writes generated math.py", async () => {
		const build = await Bun.$`bun packages/point/src/cli.ts build-py examples/math.point generated/math.py`.quiet();
		expect(build.exitCode).toBe(0);
		const generated = await Bun.file(join(repoRoot, "generated/math.py")).text();
		expect(generated).toContain("def launchReadinessScore");
	});

	test("action.point emits async Python with pathlib external shim", () => {
		const source = readFileSync(join(repoRoot, "examples/action.point"), "utf8");
		const program = parsePointSource(source);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("def readFile(path: str) -> str:");
		expect(emitted).toContain("from pathlib import Path");
		expect(emitted).toContain("async def loadConfigContents(path: str) -> str:");
		expect(emitted).toContain("return readFile(path)");
		expect(emitted).not.toContain("not supported in Python emit yet");
	});

	test("build-py CLI writes generated action.py", async () => {
		const build = await Bun.$`bun packages/point/src/cli.ts build-py examples/action.point generated/action.py`.quiet();
		expect(build.exitCode).toBe(0);
		const generated = await Bun.file(join(repoRoot, "generated/action.py")).text();
		expect(generated).toContain("async def loadConfigContents");
	});

	test("action.point Python output reads files at runtime", async () => {
		const source = readFileSync(join(repoRoot, "examples/action.point"), "utf8");
		const program = parsePointSource(source);
		const pyPath = join(repoRoot, "generated", "action-smoke.py");
		await Bun.write(pyPath, emitPointCorePython(program));

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping action runtime smoke test");
			return;
		}

		const fixturePath = join(repoRoot, "examples/action.point");
		const contents = await runActionPythonSmokeTest(pythonPath, pyPath, fixturePath);
		expect(contents).toContain("module Actions");
	});

	test("isPureLogicProgram skips view fixtures but allows actions", () => {
		expect(isPureLogicProgram(parsePointSource(readFileSync(join(repoRoot, "examples/math.point"), "utf8")))).toBe(true);
		expect(isPureLogicProgram(parsePointSource(readFileSync(join(repoRoot, "examples/view.point"), "utf8")))).toBe(false);
		expect(isPureLogicProgram(parsePointSource(readFileSync(join(repoRoot, "examples/action.point"), "utf8")))).toBe(true);
	});

	test("build-py-all emits pure-logic and action fixtures and skips UI files", async () => {
		const fixtures = await discoverFixtures();
		const pureLogicFixtures = fixtures.filter((fixture) =>
			isPureLogicProgram(parsePointSource(readFileSync(join(repoRoot, fixture), "utf8"))),
		);
		expect(pureLogicFixtures.length).toBeGreaterThan(5);
		expect(pureLogicFixtures).toContain("examples/math.point");
		expect(pureLogicFixtures).toContain("examples/cart-total.point");
		expect(pureLogicFixtures).toContain("examples/action.point");
		expect(pureLogicFixtures).not.toContain("examples/view.point");

		const build = await Bun.$`bun packages/point/src/cli.ts build-py-all`.quiet();
		expect(build.exitCode).toBe(0);
		expect(build.stdout.toString()).toContain(`Point core Python build wrote ${pureLogicFixtures.length} files`);

		for (const fixture of pureLogicFixtures) {
			const base = fixture.split("/").pop()?.replace(/\.point$/, "") ?? "program";
			const pyPath = join(repoRoot, "generated", `${base}.py`);
			const generated = await Bun.file(pyPath).text();
			expect(generated).toContain("# Generated by Point. Do not edit directly.");
		}

		for (const fixture of ["examples/view.point", "examples/app/todo.point"]) {
			const base = fixture.split("/").pop()?.replace(/\.point$/, "") ?? "program";
			const pyPath = join(repoRoot, "generated", `${base}.py`);
			expect(await Bun.file(pyPath).exists()).toBe(false);
		}

		const actionPy = await Bun.file(join(repoRoot, "generated/action.py")).text();
		expect(actionPy).toContain("async def loadConfigContents");
	});

	test("math.point Python output matches JavaScript semantics", async () => {
		const source = readFileSync(join(repoRoot, "examples/math.point"), "utf8");
		const program = parsePointSource(source);
		const jsPath = join(repoRoot, "generated", "math-parity.js");
		const pyPath = join(repoRoot, "generated", "math-parity.py");
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
			console.warn("Python not found — skipping runtime parity smoke test");
			expect(jsResults.annualPrice).toBe(120);
			expect(jsResults.launchReadinessScore).toBe(70);
			return;
		}

		const pyResults = await runPythonSmokeTest(pythonPath, pyPath);
		expect(pyResults).toEqual(jsResults);
	});
});

describe("point build emit target from point.json", () => {
	test("point build emits Python when manifest emit is python", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "point-py-build-"));
		const sourcePath = join(tempDir, "src/math.point");
		const outputPath = join(tempDir, "generated/math.py");
		try {
			mkdirSync(join(tempDir, "src"), { recursive: true });
			mkdirSync(join(tempDir, "generated"), { recursive: true });
			writeFileSync(
				join(tempDir, "point.json"),
				`${JSON.stringify({ name: "py-demo", version: "0.1.0", emit: "python" }, null, 2)}\n`,
			);
			writeFileSync(sourcePath, readFileSync(join(repoRoot, "examples/math.point"), "utf8"));
			const build = await Bun.$`bun ${join(repoRoot, "packages/point/src/cli.ts")} build ${sourcePath} ${outputPath}`.cwd(tempDir).quiet();
			expect(build.exitCode).toBe(0);
			const emitted = readFileSync(outputPath, "utf8");
			expect(emitted).toContain("def annualPrice");
			expect(emitted).not.toContain("export function annualPrice");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
