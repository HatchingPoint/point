import type { PointCoreProgram, PointSourceSpan } from "./ast.ts";

export const POINT_SOURCE_TAG = "// @point";

export function tagEmittedLine(code: string, span?: PointSourceSpan): string {
	const line = span?.start?.line;
	if (!line) return code;
	return `${code} ${POINT_SOURCE_TAG} ${line}`;
}

export function buildPointLineMap(source: string): Map<number, number> {
	const map = new Map<number, number>();
	for (const [index, line] of source.split(/\r?\n/).entries()) {
		const match = line.match(new RegExp(`${escapeRegExp(POINT_SOURCE_TAG)}\\s+(\\d+)\\s*$`));
		if (match) map.set(index + 1, Number(match[1]));
	}
	return map;
}

export function pointLineForJsLine(map: Map<number, number>, jsLine: number): number | null {
	if (map.has(jsLine)) return map.get(jsLine)!;
	for (let line = jsLine - 1; line >= 1; line -= 1) {
		if (map.has(line)) return map.get(line)!;
	}
	return null;
}

export function buildEvalPointLineMap(body: string, prefixLineCount = 1): Map<number, number> {
	const bodyMap = buildPointLineMap(body);
	const evalMap = new Map<number, number>();
	for (const [bodyLine, pointLine] of bodyMap) {
		evalMap.set(bodyLine + prefixLineCount, pointLine);
	}
	return evalMap;
}

export function runtimeStackJsLine(
	error: unknown,
	options: { runtimeScriptPath?: string; entryName?: string | null } = {},
): number | null {
	if (!(error instanceof Error) || !error.stack) return null;
	const normalizedPath = options.runtimeScriptPath ? normalizePath(options.runtimeScriptPath) : null;
	const entryName = options.entryName ?? null;
	for (const line of error.stack.split("\n").slice(1)) {
		const match = line.match(/^\s*at (?:async )?(?:([^(]+?) )?(?:\()?(.+?):(\d+):(\d+)\)?$/);
		if (!match) continue;
		const callee = match[1]?.trim();
		const file = match[2] ?? "";
		const jsLine = Number(match[3]);
		if (normalizedPath && normalizePath(file).endsWith(normalizedPath)) return jsLine;
		if (entryName && callee === entryName) return jsLine;
		if (file === "<anonymous>" || file.includes("<anonymous>")) return jsLine;
	}
	return null;
}

export function resolveRuntimePointLine(
	error: unknown,
	mappingSource: string,
	options: { runtimeScriptPath?: string; entryName?: string | null; evalBody?: string } = {},
): number | null {
	const jsLine = runtimeStackJsLine(error, options);
	if (!jsLine) return null;
	const maps = [buildPointLineMap(mappingSource)];
	if (options.evalBody) maps.push(buildEvalPointLineMap(options.evalBody));
	for (const map of maps) {
		const pointLine = pointLineForJsLine(map, jsLine);
		if (pointLine) return pointLine;
	}
	return null;
}

export function runtimeSourceLocation(
	program: PointCoreProgram,
	input: string,
	entryName: string | null,
	error?: unknown,
	mappingSource?: string,
	runtimeOptions: { runtimeScriptPath?: string; evalBody?: string } = {},
): string {
	if (error && mappingSource) {
		const pointLine = resolveRuntimePointLine(error, mappingSource, {
			runtimeScriptPath: runtimeOptions.runtimeScriptPath,
			entryName,
			evalBody: runtimeOptions.evalBody,
		});
		if (pointLine) return `${input}:${pointLine}`;
	}
	const declaration = program.declarations.find((candidate) => candidate.kind === "function" && candidate.name === entryName);
	const line = declaration?.span?.start.line;
	return line ? `${input}:${line}` : input;
}

function normalizePath(path: string): string {
	return path.replaceAll("\\", "/");
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
