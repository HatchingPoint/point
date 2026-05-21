import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findRunEntryName } from "../packages/point/src/core/cli.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
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
