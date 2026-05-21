import type { PointCoreProgram, PointSourceSpan } from "../core/ast.ts";
import type { PointCoreDiagnostic } from "../core/check.ts";
import { mapDiagnosticsToSemanticRefs } from "../core/context.ts";
import type {
	PointSemanticBinding,
	PointSemanticDeclaration,
	PointSemanticExpression,
	PointSemanticOutputBinding,
	PointSemanticProgram,
	PointSemanticTypeExpression,
} from "./ast.ts";

function formatSemanticType(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatSemanticType).join(", ")}>`;
}

export type PointSemanticSymbolKind =
	| "module"
	| "use"
	| "record"
	| "field"
	| "calculation"
	| "rule"
	| "label"
	| "external"
	| "action"
	| "policy"
	| "view"
	| "route"
	| "workflow"
	| "command"
	| "param";

export interface PointSemanticSymbol {
	ref: string;
	path: string;
	kind: PointSemanticSymbolKind;
	name: string;
	module: string;
	type?: string;
	from?: string;
	effects?: string[];
	span: PointSourceSpan | null;
}

export interface PointSemanticIndex {
	schemaVersion: "point.semantic.index.v1";
	module: string;
	refs: PointSemanticSymbol[];
}

export interface PointSemanticExplanation {
	schemaVersion: "point.semantic.explain.v1";
	ref: string;
	found: boolean;
	symbol?: PointSemanticSymbol;
	relatedRefs: string[];
	summary: string;
}

export function createSemanticIndex(program: PointSemanticProgram): PointSemanticIndex {
	const moduleName = program.module ?? "anonymous";
	const refs: PointSemanticSymbol[] = [
		{
			ref: semanticRefFor(moduleName, "module"),
			path: "module",
			kind: "module",
			name: moduleName,
			module: moduleName,
			span: program.span ?? null,
		},
		...program.uses.map((use) => ({
			ref: semanticRefFor(moduleName, `use.${use.moduleName}`),
			path: `use.${use.moduleName}`,
			kind: "use" as const,
			name: use.moduleName,
			module: moduleName,
			from: use.from,
			span: use.span ?? null,
		})),
	];
	for (const declaration of program.declarations) {
		refs.push(...symbolsForDeclaration(moduleName, declaration));
	}
	return { schemaVersion: "point.semantic.index.v1", module: moduleName, refs };
}

export function explainSemanticRef(program: PointSemanticProgram, ref: string): PointSemanticExplanation {
	const index = createSemanticIndex(program);
	const symbol = index.refs.find((candidate) => candidate.ref === ref);
	if (!symbol) {
		return {
			schemaVersion: "point.semantic.explain.v1",
			ref,
			found: false,
			relatedRefs: [],
			summary: `No Point symbol found for ${ref}.`,
		};
	}
	const relatedRefs = relatedRefsFor(symbol, index);
	return {
		schemaVersion: "point.semantic.explain.v1",
		ref,
		found: true,
		symbol,
		relatedRefs,
		summary: summaryFor(symbol),
	};
}

export function mapPublicDiagnostics(program: PointCoreProgram, diagnostics: PointCoreDiagnostic[]): PointCoreDiagnostic[] {
	const mapped = mapDiagnosticsToSemanticRefs(program, diagnostics);
	if (!program.semanticSource) return mapped;
	return mapped.map((diagnostic) => ({
		...diagnostic,
		span: diagnostic.span ?? semanticSpanForDiagnosticPath(program.semanticSource!, program, diagnostic.path),
	}));
}

function symbolsForDeclaration(moduleName: string, declaration: PointSemanticDeclaration): PointSemanticSymbol[] {
	if (declaration.kind === "record") {
		const recordPath = `record.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, recordPath),
				path: recordPath,
				kind: "record",
				name: declaration.name,
				module: moduleName,
				span: declaration.span ?? null,
			},
			...declaration.fields.map((field) => ({
				ref: semanticRefFor(moduleName, `${recordPath}.field.${field.label}`),
				path: `${recordPath}.field.${field.label}`,
				kind: "field" as const,
				name: field.label,
				module: moduleName,
				type: formatSemanticType(field.type),
				span: field.span ?? null,
			})),
		];
	}
	if (declaration.kind === "external") {
		return declaration.functions.flatMap((fn) => {
			const path = `external.${fn.label}`;
			return [
				{
					ref: semanticRefFor(moduleName, path),
					path,
					kind: "external" as const,
					name: fn.label,
					module: moduleName,
					type: formatSemanticType(fn.returnType),
					from: fn.from,
					span: fn.span ?? null,
				},
				...bindingSymbols(moduleName, path, fn.params),
			];
		});
	}
	const callable = callableDeclaration(declaration);
	if (!callable) return [];
	const path = `${callable.kind}.${callable.name}`;
	return [
		{
			ref: semanticRefFor(moduleName, path),
			path,
			kind: callable.kind,
			name: callable.name,
			module: moduleName,
			type: formatSemanticType(callable.output.type),
			effects: callable.effects,
			span: callable.declaration.span ?? null,
		},
		...bindingSymbols(moduleName, path, callable.inputs),
		{
			ref: semanticRefFor(moduleName, `${path}.output.${callable.output.name}`),
			path: `${path}.output.${callable.output.name}`,
			kind: "param",
			name: callable.output.name,
			module: moduleName,
			type: formatSemanticType(callable.output.type),
			span: callable.output.span ?? null,
		},
	];
}

function callableDeclaration(declaration: PointSemanticDeclaration):
	| {
			kind: Exclude<PointSemanticSymbolKind, "module" | "use" | "record" | "field" | "external" | "param">;
			name: string;
			inputs: PointSemanticBinding[];
			output: PointSemanticOutputBinding;
			effects?: string[];
			declaration: PointSemanticDeclaration;
	  }
	| null {
	if (declaration.kind === "calculation" || declaration.kind === "rule" || declaration.kind === "label") {
		return { kind: declaration.kind, name: declaration.name, inputs: declaration.inputs, output: declaration.output, declaration };
	}
	if (declaration.kind === "action") {
		return {
			kind: "action",
			name: declaration.name,
			inputs: declaration.inputs,
			output: declaration.output,
			effects: declaration.touches,
			declaration,
		};
	}
	if (declaration.kind === "policy") {
		return { kind: "policy", name: declaration.name, inputs: declaration.inputs, output: { name: "allowed", type: boolType() }, declaration };
	}
	if (declaration.kind === "view" || declaration.kind === "route" || declaration.kind === "workflow" || declaration.kind === "command") {
		return { kind: declaration.kind, name: declaration.name, inputs: declaration.inputs, output: declaration.output, declaration };
	}
	return null;
}

function bindingSymbols(moduleName: string, ownerPath: string, bindings: PointSemanticBinding[]): PointSemanticSymbol[] {
	return bindings.map((binding) => ({
		ref: semanticRefFor(moduleName, `${ownerPath}.input.${binding.label}`),
		path: `${ownerPath}.input.${binding.label}`,
		kind: "param" as const,
		name: binding.label,
		module: moduleName,
		type: formatSemanticType(binding.type),
		span: binding.span ?? null,
	}));
}

function semanticSpanForDiagnosticPath(
	semantic: PointSemanticProgram,
	program: PointCoreProgram,
	path: string,
): PointSourceSpan | null {
	const fnMatch = path.match(/^fn\.([^.]+)(?:\.(.+))?$/);
	if (fnMatch) {
		const fnName = fnMatch[1] ?? "";
		const suffix = fnMatch[2] ?? "";
		const coreFn = program.declarations.find((declaration) => declaration.kind === "function" && declaration.name === fnName);
		if (!coreFn || coreFn.kind !== "function" || !coreFn.semantic) return coreFn?.span ?? null;
		const semanticDecl = semantic.declarations.find(
			(declaration) => declaration.kind === coreFn.semantic!.kind && "name" in declaration && declaration.name === coreFn.semantic!.name,
		);
		if (!semanticDecl) return coreFn.span ?? null;
		if (suffix.startsWith("if.condition") || suffix.endsWith(".condition")) {
			return findConditionSpan(semanticDecl) ?? coreFn.span ?? null;
		}
		if (suffix === "return" || suffix.endsWith(".return")) {
			return findReturnSpan(semanticDecl) ?? coreFn.span ?? null;
		}
		return ("span" in semanticDecl ? semanticDecl.span : null) ?? coreFn.span ?? null;
	}
	const typeMatch = path.match(/^type\.([^.]+)(?:\.(.+))?$/);
	if (typeMatch) {
		const typeName = typeMatch[1] ?? "";
		const fieldName = typeMatch[2];
		const coreType = program.declarations.find((declaration) => declaration.kind === "type" && declaration.name === typeName);
		if (fieldName && coreType?.kind === "type") {
			const field = coreType.fields.find((candidate) => candidate.name === fieldName);
			return field?.span ?? coreType.span ?? null;
		}
		return coreType?.kind === "type" ? coreType.span ?? null : null;
	}
	return null;
}

function findConditionSpan(declaration: PointSemanticDeclaration): PointSourceSpan | null {
	if (declaration.kind === "label") {
		for (const statement of declaration.body) {
			if (statement.kind === "whenReturn") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "view") {
		for (const statement of declaration.body) {
			if (statement.kind === "whenRender") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "rule") {
		for (const statement of declaration.body) {
			if (statement.kind === "addWhen") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "policy") {
		for (const statement of declaration.body) {
			if (statement.kind === "allow" || statement.kind === "deny" || statement.kind === "require") {
				return expressionSpan(statement.condition) ?? statement.span ?? null;
			}
		}
	}
	return null;
}

function findReturnSpan(declaration: PointSemanticDeclaration): PointSourceSpan | null {
	if ("body" in declaration && Array.isArray(declaration.body)) {
		for (const statement of declaration.body) {
			if (statement.kind === "return") return expressionSpan(statement.value) ?? statement.span ?? null;
			if (statement.kind === "otherwiseReturn") return expressionSpan(statement.value) ?? statement.span ?? null;
			if (statement.kind === "render") return expressionSpan(statement.value) ?? statement.span ?? null;
		}
	}
	return null;
}

function expressionSpan(expression: PointSemanticExpression): PointSourceSpan | null {
	return expression.span ?? null;
}

function relatedRefsFor(symbol: PointSemanticSymbol, index: PointSemanticIndex): string[] {
	if (symbol.kind === "field") {
		const ownerPath = symbol.path.split(".").slice(0, 2).join(".");
		return index.refs.filter((candidate) => candidate.path.startsWith(`${ownerPath}.`) && candidate.ref !== symbol.ref).map((candidate) => candidate.ref);
	}
	if (symbol.kind === "record" || symbol.kind === "calculation" || symbol.kind === "rule" || symbol.kind === "label" || symbol.kind === "action" || symbol.kind === "policy" || symbol.kind === "view" || symbol.kind === "route" || symbol.kind === "workflow" || symbol.kind === "command" || symbol.kind === "external") {
		return index.refs.filter((candidate) => candidate.path.startsWith(`${symbol.path}.`)).map((candidate) => candidate.ref);
	}
	return [];
}

function summaryFor(symbol: PointSemanticSymbol): string {
	if (symbol.kind === "module") return `Module ${symbol.name}.`;
	if (symbol.kind === "use") return `Use ${symbol.name}${symbol.from ? ` from ${symbol.from}` : ""}.`;
	if (symbol.kind === "record") return `Semantic record ${symbol.name}.`;
	if (symbol.kind === "field") return `Field ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "param") return `Parameter ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "external") return `External function ${symbol.name} from ${symbol.from} returns ${symbol.type}.`;
	if (symbol.kind === "calculation") return `Semantic calculation ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "rule") return `Semantic rule ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "label") return `Semantic label ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "action") return `Semantic action ${symbol.name} returns ${symbol.type}; effects: ${(symbol.effects ?? []).join(", ") || "none"}.`;
	if (symbol.kind === "policy") return `Semantic policy ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "view") return `Semantic view ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "route") return `Semantic route ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "workflow") return `Semantic workflow ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "command") return `Semantic command ${symbol.name} returns ${symbol.type}.`;
	return `Point symbol ${symbol.name}.`;
}

function semanticRefFor(moduleName: string, path: string): string {
	return `point://semantic/${moduleName}/${path}`;
}

function boolType(): PointSemanticTypeExpression {
	return { kind: "typeRef", name: "Bool", args: [] };
}
