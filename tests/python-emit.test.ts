import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");

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
