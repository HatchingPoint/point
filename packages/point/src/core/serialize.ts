import type { PointCoreProgram } from "./ast.ts";

export function serializeCoreProgram(program: PointCoreProgram): string {
	return `${JSON.stringify(stripSpans(program), null, 2)}\n`;
}

export function stripSpans(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripSpans);
	if (value && typeof value === "object") {
		const output: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(value)) {
			if (key === "span" || key === "semanticSource") continue;
			output[key] = stripSpans(child);
		}
		return output;
	}
	return value;
}
