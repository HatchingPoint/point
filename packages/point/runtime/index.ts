import type { PointCoreDeclaration, PointCoreProgram } from "../src/core/ast.ts";
import { interpretCoreProgramEntry } from "./interpreter/index.ts";
export { lowerCheckedCoreProgramToBytecode } from "./ir/index.ts";
export { POINT_IR_SCHEMA_VERSION, PointIrLoweringError } from "./ir/index.ts";
export type { PointIrFunction, PointIrInstruction, PointIrProgram } from "./ir/index.ts";
export { interpretPointIrFunction } from "./interpreter/index.ts";
export type { PointRuntimeJsonResponse, PointRuntimeValue } from "./interpreter/index.ts";
export { interpretCoreProgramEntry, interpretIrProgramEntry, interpretPointIrEntry, PointInterpreterError } from "./interpreter/index.ts";
export { createPointRuntimeFetchHandler, registerRuntimeRoutes, startPointRuntimeServer } from "./server.ts";
export type { PointRuntimeRoute, PointRuntimeRouteRegistry, PointRuntimeServer, PointRuntimeServerOptions } from "./server.ts";
export { createPointRuntimeDevFetchHandler, runPointRuntimeDev, runPointRuntimeServe } from "./server.ts";
export type { PointRuntimeDevOptions, PointRuntimeDevServer, PointRuntimeServeOptions } from "./server.ts";
export { pointSsrRenderables, renderPointPageToHtml, renderPointSsrEntryToHtml, renderPointViewToHtml } from "./ssr/index.ts";
export type { PointSsrRenderable } from "./ssr/index.ts";
export { renderPointRuntimePage } from "./ssr/index.ts";

export type PointRuntime = {
	readonly filePath: string;
	readonly entryName: string;
	readonly value: unknown;
};

export type PointRuntimeTestResult = {
	file: string;
	ok: boolean;
	tests: Array<{ name: string; ok: boolean; error?: string }>;
};

export async function runModule(filePath: string, program: PointCoreProgram, entryName: string): Promise<PointRuntime> {
	const value = interpretCoreProgramEntry(program, entryName);
	return { filePath, entryName, value };
}

export async function runPointRuntimeTests(filePath: string, program: PointCoreProgram): Promise<PointRuntimeTestResult> {
	const tests = pointRuntimeTests(program);
	if (tests.length === 0) return { file: filePath, ok: true, tests: [] };
	const results = [];
	for (const test of tests) {
		try {
			const value = interpretCoreProgramEntry(program, test.name);
			results.push({ name: test.semantic?.name ?? test.name, ok: value === true, error: value === true ? undefined : "Expected true." });
		} catch (error) {
			results.push({ name: test.semantic?.name ?? test.name, ok: false, error: error instanceof Error ? error.message : String(error) });
		}
	}
	return { file: filePath, ok: results.every((result) => result.ok), tests: results };
}

function pointRuntimeTests(program: PointCoreProgram): Array<Extract<PointCoreDeclaration, { kind: "function" }>> {
	return program.declarations.filter(
		(declaration): declaration is Extract<PointCoreDeclaration, { kind: "function" }> =>
			declaration.kind === "function" &&
			declaration.params.length === 0 &&
			declaration.returnType.name === "Bool" &&
			(declaration.semantic?.name.startsWith("test") || declaration.name.startsWith("test")),
	);
}
