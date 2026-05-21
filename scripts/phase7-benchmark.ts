#!/usr/bin/env bun
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { parsePointSourceLegacy } from "../packages/point/src/core/test-only/index.ts";

const repoRoot = join(import.meta.dir, "..");
const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];
const iterations = Number(process.env.BENCHMARK_ITERATIONS ?? 50);

async function discoverFixtures(): Promise<string[]> {
	const fixtures = new Set<string>();
	for (const pattern of FIXTURE_PATTERNS) {
		const glob = new Glob(pattern);
		for await (const path of glob.scan({ cwd: repoRoot, onlyFiles: true })) {
			if (!path.includes("/generated/")) fixtures.add(path.replaceAll("\\", "/"));
		}
	}
	return [...fixtures].sort((a, b) => a.localeCompare(b));
}

function bench(label: string, run: () => void) {
	const start = performance.now();
	for (let index = 0; index < iterations; index += 1) run();
	const elapsed = performance.now() - start;
	const perOp = elapsed / iterations;
	console.log(`${label}: ${elapsed.toFixed(2)}ms total, ${perOp.toFixed(3)}ms per iteration`);
	return { elapsed, perOp };
}

const fixtures = await discoverFixtures();
const sources = fixtures.map((fixture) => readFileSync(join(repoRoot, fixture), "utf8"));
const combinedBytes = sources.reduce((total, source) => total + source.length, 0);

console.log(`Fixtures: ${fixtures.length}`);
console.log(`Combined source size: ${combinedBytes} bytes`);
console.log(`Iterations per benchmark: ${iterations}`);
console.log("");

const legacyPrograms = sources.map((source) => parsePointSourceLegacy(source));
const astPrograms = sources.map((source) => parsePointSource(source));

console.log("Parse + check (all fixtures per iteration):");
bench("legacy string-lowering pipeline", () => {
	for (let index = 0; index < sources.length; index += 1) {
		checkPointCore(parsePointSourceLegacy(sources[index]!));
	}
});
bench("semantic AST desugar pipeline", () => {
	for (let index = 0; index < sources.length; index += 1) {
		checkPointCore(parsePointSource(sources[index]!));
	}
});

console.log("");
console.log("Emit (examples/math.point program, cached AST):");
const mathAst = parsePointSource(readFileSync(join(repoRoot, "examples/math.point"), "utf8"));
bench("TypeScript emit (AST path)", () => emitPointCoreTypeScript(mathAst));
bench("JavaScript emit (AST path)", () => emitPointCoreJavaScript(mathAst));

console.log("");
console.log("Emit parity spot-check (legacy vs AST on first fixture):");
const firstLegacy = legacyPrograms[0]!;
const firstAst = astPrograms[0]!;
console.log(`TypeScript identical: ${emitPointCoreTypeScript(firstAst) === emitPointCoreTypeScript(firstLegacy)}`);
console.log(`JavaScript identical: ${emitPointCoreJavaScript(firstAst) === emitPointCoreJavaScript(firstLegacy)}`);
