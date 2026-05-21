import type { PointSemanticDeclarationMetadata } from "../core/ast.ts";
import type { PointSemanticDeclaration } from "./ast.ts";

export function semanticDeclarationMetadata(declaration: PointSemanticDeclaration): PointSemanticDeclarationMetadata {
	if (declaration.kind === "record") {
		return { kind: "record", name: declaration.name, outputName: undefined, effects: undefined };
	}
	if (declaration.kind === "external") {
		return { kind: "external", name: declaration.name, outputName: undefined, effects: undefined };
	}
	if (declaration.kind === "calculation" || declaration.kind === "rule" || declaration.kind === "action" || declaration.kind === "workflow" || declaration.kind === "command") {
		return {
			kind: declaration.kind,
			name: declaration.name,
			outputName: declaration.output.name,
			effects: declaration.kind === "action" ? declaration.touches : [],
		};
	}
	if (declaration.kind === "label") {
		return { kind: "label", name: declaration.name, outputName: declaration.output.name, effects: [] };
	}
	if (declaration.kind === "policy") {
		return { kind: "policy", name: declaration.name, outputName: "policy", effects: [] };
	}
	if (declaration.kind === "view") {
		return {
			kind: "view",
			name: declaration.name,
			outputName: declaration.output.name === "page" ? "view" : declaration.output.name,
			effects: [],
		};
	}
	if (declaration.kind === "route") {
		return { kind: "route", name: declaration.name, outputName: declaration.output.name, effects: [] };
	}
	throw new Error(`Unsupported semantic metadata for ${declaration.kind}`);
}
