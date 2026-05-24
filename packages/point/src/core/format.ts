import { formatSemanticProgram } from "../semantic/format.ts";
import { parseSemanticSourceWithUses } from "./parser.ts";

export function formatPointSource(source: string, cwd = process.cwd(), input?: string): string {
	return formatSemanticProgram(parseSemanticSourceWithUses(source, cwd, input));
}
