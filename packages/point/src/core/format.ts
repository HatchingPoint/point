import { formatSemanticProgram } from "../semantic/format.ts";
import { parseSemanticSource } from "../semantic/parse.ts";

export function formatPointSource(source: string): string {
	return formatSemanticProgram(parseSemanticSource(source));
}
