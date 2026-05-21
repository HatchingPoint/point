import type { PointCoreProgram } from "./ast.ts";
import { desugarSemanticProgram } from "../semantic/desugar.ts";
import { parseSemanticSource } from "../semantic/parse.ts";
import { assertSemanticPointSource } from "./semantic-source.ts";

export { isSemanticPointSyntax } from "./semantic-source.ts";

export function parsePointSource(source: string): PointCoreProgram {
	assertSemanticPointSource(source);
	return desugarSemanticProgram(parseSemanticSource(source));
}
