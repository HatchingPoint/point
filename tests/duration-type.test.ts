import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createModuleGraphForFile, loadCoreFile, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";
import { parseSemanticTypeExpression } from "../packages/point/src/semantic/expressions.ts";

const repoRoot = join(import.meta.dir, "..");

async function checkPointFile(relativePath: string) {
	const lock = await readPointLock(repoRoot);
	const coreFile = await loadCoreFile(relativePath, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	return checkPointCore(programWithDependencyDeclarations(coreFile, graph));
}

describe("Duration type", () => {
	test("checks std/time and duration demo example", async () => {
		for (const file of ["std/time.point", "examples/tools/duration-demo.point"]) {
			expect(await checkPointFile(file)).toEqual([]);
		}
	});

	test("parses semantic type references", () => {
		expect(parseSemanticTypeExpression("Duration")).toEqual({ kind: "typeRef", name: "Duration", args: [] });
		expect(parseSemanticTypeExpression("Duration<Int>")).toEqual({
			kind: "typeRef",
			name: "Duration",
			args: [{ kind: "typeRef", name: "Int", args: [] }],
		});
	});

	test("checks identity calculation and rejects Duration with type arguments", () => {
		const ok = `module DurationOk

calculation pass duration
  input d: Duration
  output out: Duration
  return d
`;
		expect(checkPointCore(parsePointSource(ok))).toEqual([]);
		const bad = `module Bad

calculation demo
  output value: Duration<Int>
  return 0
`;
		const diagnostics = checkPointCore(parsePointSource(bad));
		expect(diagnostics.some((d) => d.code === "invalid-type-arity")).toBe(true);
	});

	test("emits Duration as number in TS and int in Python", () => {
		const source = `module Snap

calculation pass duration
  input d: Duration
  output out: Duration
  return d
`;
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const ts = emitPointCoreTypeScript(program);
		const py = emitPointCorePython(program);
		expect(`${ts}\n---\n${py}`).toMatchSnapshot();
		expect(ts).toContain(": number");
		expect(py).toContain(": int");
	});
});
