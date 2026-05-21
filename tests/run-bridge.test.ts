import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { findRunEntryName } from "../packages/point/src/core/cli.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import {
	buildEvalPointLineMap,
	buildPointLineMap,
	pointLineForJsLine,
	resolveRuntimePointLine,
	runtimeSourceLocation,
	tagEmittedLine,
} from "../packages/point/src/core/source-map.ts";
import {
	bundleJavaScriptForEval,
	canBundleRunInMemory,
	executeBundledEntry,
} from "../packages/point/src/core/run-bridge.ts";

const repoRoot = join(import.meta.dir, "..");

describe("run bridge", () => {
	test("canBundleRunInMemory accepts pure math-only and rejects std usage", () => {
		const mathOnly = parsePointSource(readFileSync(join(repoRoot, "examples/pure/math-only.point"), "utf8"));
		const stdUsage = parsePointSource(readFileSync(join(repoRoot, "examples/std-usage.point"), "utf8"));
		const action = parsePointSource(readFileSync(join(repoRoot, "examples/action.point"), "utf8"));
		const view = parsePointSource(readFileSync(join(repoRoot, "examples/view.point"), "utf8"));
		expect(canBundleRunInMemory(mathOnly)).toBe(true);
		expect(canBundleRunInMemory(stdUsage)).toBe(false);
		expect(canBundleRunInMemory(action)).toBe(false);
		expect(canBundleRunInMemory(view)).toBe(false);
	});

	test("bundleJavaScriptForEval strips exports and import lines", () => {
		const source = `import { x } from "./other.js";
export async function demo() { return 1; }
export function annualPrice(n) { return n * 12; }
`;
		const bundled = bundleJavaScriptForEval(source);
		expect(bundled.exports).toEqual(["demo", "annualPrice"]);
		expect(bundled.body).not.toContain("import ");
		expect(bundled.body).toContain("async function demo()");
		expect(bundled.body).toContain("function annualPrice(n)");
	});

	test("executeBundledEntry runs pure math-only demo", async () => {
		const program = parsePointSource(readFileSync(join(repoRoot, "examples/pure/math-only.point"), "utf8"));
		const entryName = findRunEntryName(program);
		expect(entryName).toBe("demoResult");
		const value = await executeBundledEntry(program, entryName!);
		expect(value).toBe(120);
	});

	test("point run --bundle executes math-only without project emit files", async () => {
		const beforeJs = await Bun.$`git ls-files --others --exclude-standard generated/*.js`.quiet().nothrow();
		const run = await Bun.$`bun packages/point/src/cli.ts run --bundle examples/pure/math-only.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("120");
		const afterJs = await Bun.$`git ls-files --others --exclude-standard generated/*.js`.quiet().nothrow();
		expect(afterJs.stdout.toString()).toBe(beforeJs.stdout.toString());
	});

	test("point run auto-bundles hello without temp path in project", async () => {
		const run = await Bun.$`bun packages/point/src/cli.ts run examples/hello.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("Hello from Point");
		const emitted = emitPointCoreJavaScript(parsePointSource(readFileSync(join(repoRoot, "examples/hello.point"), "utf8")));
		expect(canBundleRunInMemory(parsePointSource(readFileSync(join(repoRoot, "examples/hello.point"), "utf8")))).toBe(true);
		expect(emitted).toContain("export async function");
	});
});

describe("statement source maps", () => {
	test("tags emitted JavaScript lines with semantic point line numbers", () => {
		const source = `module Demo

action crash demo
  output result: Void
  touches none
  return fail()
`;
		const emitted = emitPointCoreJavaScript(parsePointSource(source));
		expect(emitted).toContain("return fail(); // @point 6");
	});

	test("maps runtime stack frames back to point source lines", async () => {
		const source = `module Crash

external node assert
  fail(): Void from "node:assert" as fail

action crash demo
  output result: Void
  touches none
  return fail()
`;
		const inputPath = resolve(tmpdir(), `point-source-map-${Date.now()}.point`);
		await Bun.write(inputPath, source);
		const program = parsePointSource(source);
		const emitted = emitPointCoreJavaScript(program);
		const runOutput = resolve(tmpdir(), `point-source-map-${Date.now()}.js`);
		await Bun.write(runOutput, emitted);
		let error: unknown;
		try {
			const mod = await import(`file://${runOutput}`);
			await mod.crashDemoResult();
		} catch (caught) {
			error = caught;
		}
		expect(error).toBeDefined();
		expect(resolveRuntimePointLine(error, emitted, { runtimeScriptPath: runOutput, entryName: "crashDemoResult" })).toBe(9);
		expect(runtimeSourceLocation(program, inputPath, "crashDemoResult", error, emitted, { runtimeScriptPath: runOutput })).toBe(`${inputPath}:9`);
	});

	test("point run reports expression line inside action body", async () => {
		const source = `module Crash

external node assert
  fail(): Void from "node:assert" as fail

action crash demo
  output result: Void
  touches none
  return fail()
`;
		const inputPath = resolve(tmpdir(), `point-run-source-map-${Date.now()}.point`);
		await Bun.write(inputPath, source);
		const run = await Bun.$`bun packages/point/src/cli.ts run --no-bundle ${inputPath}`.quiet().nothrow();
		expect(run.exitCode).toBe(1);
		expect(run.stderr.toString()).toContain(`${inputPath}:9`);
		expect(run.stderr.toString()).not.toContain(`${inputPath}:6:`);
	});

	test("buildEvalPointLineMap offsets bundled eval line numbers", () => {
		const body = `async function demo() {
  return 1; // @point 4
}`;
		const map = buildEvalPointLineMap(body);
		expect(pointLineForJsLine(map, 3)).toBe(4);
	});

	test("bundleJavaScriptForEval preserves point source tags", () => {
		const emitted = `${tagEmittedLine("return fail();", { start: { line: 9, column: 1, offset: 0 }, end: { line: 9, column: 2, offset: 1 } })}\n`;
		const bundled = bundleJavaScriptForEval(`export async function crashDemoResult() {\n  ${emitted}}`).body;
		expect(buildPointLineMap(bundled).get(2)).toBe(9);
	});
});
