import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createUseSourceResolver, parseSemanticSourceWithUses } from "../packages/point/src/core/parser.ts";
import {
	isPointSemanticAstEnabled,
	parsePointSourceV2,
	parseSemanticSource,
	serializeSemanticProgram,
} from "../packages/point/src/semantic/index.ts";

const repoRoot = join(import.meta.dir, "..");

function discoverPointFiles(directory: string): string[] {
	const entries = readdirSync(directory);
	const files: string[] = [];
	for (const entry of entries) {
		const path = join(directory, entry);
		if (statSync(path).isDirectory()) {
			files.push(...discoverPointFiles(path));
			continue;
		}
		if (path.endsWith(".point")) files.push(path);
	}
	return files.sort();
}

describe("semantic AST", () => {
	test("parseSemanticSource does not use core text lowering", () => {
		const source = readFileSync(join(repoRoot, "examples/math.point"), "utf8");
		const program = parseSemanticSource(source);
		expect(program.kind).toBe("semanticProgram");
		expect(program.module).toBe("Math");
		expect(program.declarations.length).toBeGreaterThan(0);
		for (const declaration of program.declarations) {
			expect(declaration.span?.start.line).toBeGreaterThan(0);
		}
	});

	test("math.point semantic AST shape", () => {
		const source = readFileSync(join(repoRoot, "examples/math.point"), "utf8");
		expect(serializeSemanticProgram(parseSemanticSource(source))).toMatchSnapshot();
	});

	test("cart-total.point semantic AST shape", () => {
		const source = readFileSync(join(repoRoot, "examples/cart-total.point"), "utf8");
		expect(serializeSemanticProgram(parseSemanticSource(source))).toMatchSnapshot();
	});

	test("parsePointSourceV2 matches parseSemanticSource", () => {
		const source = readFileSync(join(repoRoot, "examples/std-usage.point"), "utf8");
		const resolveUseSource = createUseSourceResolver(repoRoot);
		expect(serializeSemanticProgram(parsePointSourceV2(source, { resolveUseSource }))).toBe(
			serializeSemanticProgram(parseSemanticSource(source, { resolveUseSource })),
		);
	});

	test("isPointSemanticAstEnabled is true unless legacy lowering is forced", () => {
		const previous = process.env.POINT_LEGACY_LOWER;
		delete process.env.POINT_LEGACY_LOWER;
		expect(isPointSemanticAstEnabled()).toBe(true);
		process.env.POINT_LEGACY_LOWER = "1";
		expect(isPointSemanticAstEnabled()).toBe(false);
		if (previous !== undefined) process.env.POINT_LEGACY_LOWER = previous;
		else delete process.env.POINT_LEGACY_LOWER;
	});
});

describe("semantic parse coverage", () => {
	for (const file of discoverPointFiles(join(repoRoot, "examples"))) {
		test(`parses ${file.replace(`${repoRoot}\\`, "").replace(`${repoRoot}/`, "")}`, () => {
			const source = readFileSync(file, "utf8");
			const input = file.replace(`${repoRoot}/`, "").replace(`${repoRoot}\\`, "");
			const program = parseSemanticSourceWithUses(source, repoRoot, input);
			expect(program.kind).toBe("semanticProgram");
			expect(program.declarations.length + program.uses.length).toBeGreaterThan(0);
		});
	}
});
