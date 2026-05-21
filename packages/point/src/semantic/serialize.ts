import type { PointSemanticProgram } from "./ast.ts";

export function serializeSemanticProgram(program: PointSemanticProgram): string {
	return `${JSON.stringify(stripSpans(program), null, 2)}\n`;
}

function stripSpans(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripSpans);
	if (value && typeof value === "object") {
		const output: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(value)) {
			if (key === "span") continue;
			output[key] = stripSpans(child);
		}
		return output;
	}
	return value;
}
