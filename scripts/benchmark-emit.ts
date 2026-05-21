#!/usr/bin/env bun
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";

const source = await Bun.file("examples/math.point").text();
const program = parsePointSource(source);
const iterations = Number(process.env.BENCHMARK_ITERATIONS ?? 500);

function bench(label: string, run: () => void) {
	const start = performance.now();
	for (let index = 0; index < iterations; index += 1) run();
	const elapsed = performance.now() - start;
	console.log(`${label}: ${elapsed.toFixed(2)}ms total, ${(elapsed / iterations).toFixed(3)}ms per emit`);
}

bench("TypeScript emit", () => emitPointCoreTypeScript(program));
bench("JavaScript emit", () => emitPointCoreJavaScript(program));

console.log(`Iterations: ${iterations}`);
console.log("Direct JavaScript emit skips type syntax and interface emission; benchmark on your machine before choosing build-js in production pipelines.");
