import type { PointCoreDeclaration } from "./ast.ts";
import type { PointSemanticDeclaration } from "../semantic/ast.ts";
import { desugarSemanticProgram } from "../semantic/desugar.ts";
import { parseSemanticSource } from "../semantic/parse.ts";
import { semanticFunctionName, toIdentifier } from "../semantic/naming.ts";

export function semanticDeclarationName(declaration: PointSemanticDeclaration): string | undefined {
	if (declaration.kind === "external") return declaration.name;
	if ("name" in declaration && typeof declaration.name === "string") return declaration.name;
	return undefined;
}

export function isNameMentionedInSource(source: string, name: string): boolean {
	if (!name) return false;
	let index = source.indexOf(name);
	while (index >= 0) {
		const before = index > 0 ? source[index - 1]! : " ";
		const after = index + name.length < source.length ? source[index + name.length]! : " ";
		if (!/[A-Za-z0-9]/.test(before) && !/[A-Za-z0-9]/.test(after)) return true;
		index = source.indexOf(name, index + 1);
	}
	return false;
}

function extractTypeNamesFromDeclaration(declaration: PointSemanticDeclaration): string[] {
	const names: string[] = [];
	const visitType = (type: { kind?: string; name?: string; args?: unknown[] }) => {
		if (type.kind === "named" && type.name) names.push(type.name);
		if (Array.isArray(type.args)) {
			for (const arg of type.args) {
				if (arg && typeof arg === "object") visitType(arg as { kind?: string; name?: string; args?: unknown[] });
			}
		}
	};
	const visitBinding = (binding: { type?: { kind?: string; name?: string; args?: unknown[] } }) => {
		if (binding.type) visitType(binding.type);
	};
	if (declaration.kind === "record" || declaration.kind === "variant") return [];
	if ("inputs" in declaration && Array.isArray(declaration.inputs)) {
		for (const input of declaration.inputs) visitBinding(input);
	}
	if ("output" in declaration && declaration.output && typeof declaration.output === "object" && "type" in declaration.output) {
		visitBinding(declaration.output as { type?: { kind?: string; name?: string; args?: unknown[] } });
	}
	if (declaration.kind === "external") {
		for (const fn of declaration.functions) {
			for (const param of fn.params) visitBinding(param);
			if (fn.returnType) visitType(fn.returnType);
		}
	}
	return names;
}

function referenceNamesForDeclaration(declaration: PointSemanticDeclaration): string[] {
	const names = new Set<string>();
	const semanticName = semanticDeclarationName(declaration);
	if (semanticName) names.add(semanticName);
	const outputName = "output" in declaration && declaration.output && typeof declaration.output === "object" && "name" in declaration.output
		? String(declaration.output.name)
		: "";
	if (declaration.kind === "calculation") names.add(semanticFunctionName(declaration.name, outputName, "calculation"));
	if (declaration.kind === "rule") names.add(semanticFunctionName(declaration.name, outputName, "rule"));
	if (declaration.kind === "label") names.add(semanticFunctionName(declaration.name, outputName, "label"));
	if (declaration.kind === "action") names.add(semanticFunctionName(declaration.name, outputName, "action"));
	if (declaration.kind === "policy") names.add(semanticFunctionName(declaration.name, outputName, "policy"));
	if (declaration.kind === "command") names.add(semanticFunctionName(declaration.name, outputName, "command"));
	return [...names];
}

function declarationSearchText(declaration: PointSemanticDeclaration): string {
	if (declaration.kind === "external") {
		return declaration.functions.map((fn) => fn.label).join(" ");
	}
	return [...referenceNamesForDeclaration(declaration), JSON.stringify(declaration)].join(" ");
}

export function filterDeclarationsReferencedIn(
	importerSource: string,
	declarations: PointSemanticDeclaration[],
): PointSemanticDeclaration[] {
	const byName = new Map<string, PointSemanticDeclaration>();
	for (const declaration of declarations) {
		const name = semanticDeclarationName(declaration);
		if (name) byName.set(name, declaration);
	}

	const selected = new Set<string>();
	for (const declaration of declarations) {
		if (referenceNamesForDeclaration(declaration).some((name) => isNameMentionedInSource(importerSource, name))) {
			const semanticName = semanticDeclarationName(declaration);
			if (semanticName) selected.add(semanticName);
		}
	}

	let changed = true;
	while (changed) {
		changed = false;
		for (const name of [...selected]) {
			const declaration = byName.get(name);
			if (!declaration) continue;
			for (const typeName of extractTypeNamesFromDeclaration(declaration)) {
				if (byName.has(typeName) && !selected.has(typeName)) {
					selected.add(typeName);
					changed = true;
				}
			}
		}
	}

	const selectedBodies = [...selected]
		.map((name) => byName.get(name))
		.filter((declaration): declaration is PointSemanticDeclaration => Boolean(declaration))
		.map(declarationSearchText)
		.join("\n");
	const referenceSources = [importerSource, selectedBodies];

	return declarations.filter((declaration) => {
		if (declaration.kind === "external") {
			return declaration.functions.some((fn) => {
				const names = [fn.label, toIdentifier(fn.label), fn.importAs].filter(Boolean) as string[];
				return names.some((name) => referenceSources.some((source) => isNameMentionedInSource(source, name)));
			});
		}
		const name = semanticDeclarationName(declaration);
		return Boolean(name && selected.has(name));
	});
}

export function filteredPublicCoreDeclarations(
	importerSource: string,
	dependencySource: string,
	dependencyInput?: string,
	cwd = process.cwd(),
): Array<Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }>> {
	const semantic = parseSemanticSource(dependencySource, { inputPath: dependencyInput, cwd });
	const filtered = filterDeclarationsReferencedIn(importerSource, semantic.declarations);
	const lowered = desugarSemanticProgram({ ...semantic, declarations: filtered });
	return lowered.declarations.filter(
		(declaration): declaration is Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }> =>
			declaration.kind === "type" || declaration.kind === "function" || declaration.kind === "value" || declaration.kind === "external",
	);
}

export function dedupeSemanticDeclarations(declarations: PointSemanticDeclaration[]): PointSemanticDeclaration[] {
	const seen = new Set<string>();
	const deduped: PointSemanticDeclaration[] = [];
	for (const declaration of declarations) {
		const name = semanticDeclarationName(declaration);
		const key = name ? `${declaration.kind}:${name}` : JSON.stringify(declaration);
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(declaration);
	}
	return deduped;
}

export function filteredImportNamesForDependency(
	importerSource: string,
	dependencySource: string,
	dependencyInput?: string,
	cwd = process.cwd(),
): string[] {
	return filteredPublicCoreDeclarations(importerSource, dependencySource, dependencyInput, cwd)
		.map((declaration) => declaration.name)
		.filter(Boolean);
}

export function dedupeCoreDeclarationsByName(
	declarations: Array<Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }>>,
): Array<Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }>> {
	const seen = new Set<string>();
	const deduped: Array<Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }>> = [];
	for (const declaration of declarations) {
		const key = `${declaration.kind}:${declaration.name}`;
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(declaration);
	}
	return deduped;
}
