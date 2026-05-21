import type { PointSemanticDeclarationMetadata } from "../core/ast.ts";
import type { PointSemanticDeclaration } from "./ast.ts";

export function semanticDeclarationMetadata(declaration: PointSemanticDeclaration): PointSemanticDeclarationMetadata {
	if (declaration.kind === "record") {
		return { kind: "record", name: declaration.name, outputName: undefined, effects: undefined };
	}
	if (declaration.kind === "variant") {
		return { kind: "variant", name: declaration.name, outputName: undefined, effects: undefined };
	}
	if (declaration.kind === "external") {
		return { kind: "external", name: declaration.name, outputName: undefined, effects: undefined };
	}
	if (declaration.kind === "calculation" || declaration.kind === "rule" || declaration.kind === "action" || declaration.kind === "workflow" || declaration.kind === "pipeline" || declaration.kind === "command") {
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
	if (declaration.kind === "guard") {
		return { kind: "guard", name: declaration.name, outputName: "guard", effects: [] };
	}
	if (declaration.kind === "view") {
		return {
			kind: "view",
			name: declaration.name,
			outputName: declaration.output.name === "page" ? "view" : declaration.output.name,
			effects: [],
		};
	}
	if (declaration.kind === "page") {
		return { kind: "page", name: declaration.name, outputName: "page", effects: [] };
	}
	if (declaration.kind === "layout") {
		return { kind: "layout", name: declaration.name, outputName: "layout", effects: [] };
	}
	if (declaration.kind === "navigation") {
		return { kind: "navigation", name: declaration.name, outputName: "navigation", effects: [] };
	}
	if (declaration.kind === "route") {
		return { kind: "route", name: declaration.name, outputName: declaration.output.name, effects: [] };
	}
	if (declaration.kind === "streamRoute") {
		return { kind: "streamRoute", name: declaration.name, outputName: "stream", effects: ["network"] };
	}
	if (declaration.kind === "middleware") {
		return { kind: "middleware", name: declaration.name, outputName: declaration.output.name, effects: [] };
	}
	if (declaration.kind === "prompt") {
		return { kind: "prompt", name: declaration.name, outputName: undefined, effects: [] };
	}
	if (declaration.kind === "session") {
		return { kind: "session", name: declaration.name, outputName: undefined, effects: [] };
	}
	throw new Error(`Unsupported semantic metadata for ${declaration.kind}`);
}
