import type {
	PointCoreDeclaration,
	PointCoreFunctionDeclaration,
	PointCoreProgram,
	PointCoreTypeDeclaration,
	PointCoreTypeExpression,
	PointCoreValueDeclaration,
	PointSourceSpan,
} from "./ast.ts";
import type {
	PointCoreDiagnostic,
} from "./check.ts";

export type PointCoreSymbolKind =
	| "module"
	| "import"
	| "value"
	| "function"
	| "param"
	| "type"
	| "field"
	| "record"
	| "calculation"
	| "rule"
	| "label"
	| "external"
	| "action"
	| "policy"
	| "view"
	| "layout"
	| "slot"
	| "page"
	| "route"
	| "workflow"
	| "pipeline"
	| "command";

export interface PointCoreSymbol {
	ref: string;
	path: string;
	kind: PointCoreSymbolKind;
	name: string;
	module: string;
	type?: string;
	mutable?: boolean;
	from?: string;
	effects?: string[];
	span: PointSourceSpan | null;
}

export interface PointCoreIndex {
	schemaVersion: "point.core.index.v1";
	module: string;
	refs: PointCoreSymbol[];
}

export interface PointCoreExplanation {
	schemaVersion: "point.core.explain.v1";
	ref: string;
	found: boolean;
	symbol?: PointCoreSymbol;
	relatedRefs: string[];
	summary: string;
}

export interface PointCoreRepairPlan {
	schemaVersion: "point.core.repair-plan.v1";
	ok: boolean;
	steps: PointCoreRepairStep[];
}

export interface PointCoreRepairStep {
	ref: string;
	code: string;
	message: string;
	repair: string;
	expected?: string | string[];
	actual?: string;
	relatedRefs: string[];
}

export function createPointCoreIndex(program: PointCoreProgram): PointCoreIndex {
	const moduleName = program.module ?? "anonymous";
	const refs: PointCoreSymbol[] = [
		{
			ref: refFor(moduleName, "module"),
			path: "module",
			kind: "module",
			name: moduleName,
			module: moduleName,
			span: program.span ?? null,
		},
	];
	for (const declaration of program.declarations) {
		refs.push(...symbolsForDeclaration(moduleName, declaration));
		refs.push(...semanticSymbolsForDeclaration(moduleName, declaration));
	}
	return { schemaVersion: "point.core.index.v1", module: moduleName, refs };
}

export function explainPointCoreRef(program: PointCoreProgram, ref: string): PointCoreExplanation {
	const index = createPointCoreIndex(program);
	const symbol = index.refs.find((candidate) => candidate.ref === ref);
	if (!symbol) {
		return {
			schemaVersion: "point.core.explain.v1",
			ref,
			found: false,
			relatedRefs: [],
			summary: `No Point symbol found for ${ref}.`,
		};
	}
	const relatedRefs = relatedRefsFor(symbol, index);
	return {
		schemaVersion: "point.core.explain.v1",
		ref,
		found: true,
		symbol,
		relatedRefs,
		summary: summaryFor(symbol),
	};
}

/** Stable repair order: source position first, then code tie-break for deterministic plans. */
export function sortDiagnosticsForRepairPlan(diagnostics: PointCoreDiagnostic[]): PointCoreDiagnostic[] {
	return [...diagnostics].sort((left, right) => {
		const leftLine = left.span?.start.line ?? Number.MAX_SAFE_INTEGER;
		const rightLine = right.span?.start.line ?? Number.MAX_SAFE_INTEGER;
		if (leftLine !== rightLine) return leftLine - rightLine;
		const leftColumn = left.span?.start.column ?? Number.MAX_SAFE_INTEGER;
		const rightColumn = right.span?.start.column ?? Number.MAX_SAFE_INTEGER;
		if (leftColumn !== rightColumn) return leftColumn - rightColumn;
		return left.code.localeCompare(right.code);
	});
}

export function createPointCoreRepairPlan(diagnostics: PointCoreDiagnostic[]): PointCoreRepairPlan {
	const ordered = sortDiagnosticsForRepairPlan(diagnostics);
	return {
		schemaVersion: "point.core.repair-plan.v1",
		ok: ordered.length === 0,
		steps: ordered.map((diagnostic) => ({
			ref: diagnostic.ref,
			code: diagnostic.code,
			message: diagnostic.message,
			repair: diagnostic.repair ?? "Inspect this ref and update the Point source.",
			expected: diagnostic.expected,
			actual: diagnostic.actual,
			relatedRefs: diagnostic.relatedRefs ?? [],
		})),
	};
}

export function mapDiagnosticsToSemanticRefs(program: PointCoreProgram, diagnostics: PointCoreDiagnostic[]): PointCoreDiagnostic[] {
	return diagnostics.map((diagnostic) => ({
		...diagnostic,
		ref: semanticRefForDiagnosticPath(program, diagnostic.path) ?? diagnostic.ref,
		relatedRefs: diagnostic.relatedRefs?.map((ref) => semanticRefForCoreRef(program, ref) ?? ref),
	}));
}

function symbolsForDeclaration(moduleName: string, declaration: PointCoreDeclaration): PointCoreSymbol[] {
	if (declaration.kind === "import") {
		return declaration.names.map((name) => ({
			ref: refFor(moduleName, `import.${name}`),
			path: `import.${name}`,
			kind: "import",
			name,
			module: moduleName,
			from: declaration.from,
			span: declaration.span ?? null,
		}));
	}
	if (declaration.kind === "external") {
		return [
			{
				ref: refFor(moduleName, `external.${declaration.name}`),
				path: `external.${declaration.name}`,
				kind: "external",
				name: declaration.name,
				module: moduleName,
				type: formatType(declaration.returnType),
				from: declaration.from,
				span: declaration.span ?? null,
			},
		];
	}
	if (declaration.kind === "value") return [valueSymbol(moduleName, declaration, `value.${declaration.name}`)];
	if (declaration.kind === "type") return typeSymbols(moduleName, declaration);
	return functionSymbols(moduleName, declaration);
}

function valueSymbol(moduleName: string, declaration: PointCoreValueDeclaration, path: string): PointCoreSymbol {
	return {
		ref: refFor(moduleName, path),
		path,
		kind: "value",
		name: declaration.name,
		module: moduleName,
		type: formatType(declaration.type),
		mutable: declaration.mutable,
		span: declaration.span ?? null,
	};
}

function typeSymbols(moduleName: string, declaration: PointCoreTypeDeclaration): PointCoreSymbol[] {
	return [
		{
			ref: refFor(moduleName, `type.${declaration.name}`),
			path: `type.${declaration.name}`,
			kind: "type",
			name: declaration.name,
			module: moduleName,
			span: declaration.span ?? null,
		},
		...declaration.fields.map((field) => ({
			ref: refFor(moduleName, `type.${declaration.name}.${field.name}`),
			path: `type.${declaration.name}.${field.name}`,
			kind: "field" as const,
			name: field.name,
			module: moduleName,
			type: formatType(field.type),
			span: field.span ?? null,
		})),
	];
}

function functionSymbols(moduleName: string, declaration: PointCoreFunctionDeclaration): PointCoreSymbol[] {
	return [
		{
			ref: refFor(moduleName, `fn.${declaration.name}`),
			path: `fn.${declaration.name}`,
			kind: "function",
			name: declaration.name,
			module: moduleName,
			type: formatType(declaration.returnType),
			effects: declaration.semantic?.effects,
			span: declaration.span ?? null,
		},
		...declaration.params.map((param) => ({
			ref: refFor(moduleName, `fn.${declaration.name}.param.${param.name}`),
			path: `fn.${declaration.name}.param.${param.name}`,
			kind: "param" as const,
			name: param.name,
			module: moduleName,
			type: formatType(param.type),
			span: param.span ?? null,
		})),
	];
}

function semanticSymbolsForDeclaration(moduleName: string, declaration: PointCoreDeclaration): PointCoreSymbol[] {
	if (declaration.kind === "type" && declaration.semantic?.kind === "record") {
		const recordPath = `record.${declaration.semantic.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, recordPath),
				path: recordPath,
				kind: "record",
				name: declaration.semantic.name,
				module: moduleName,
				span: declaration.span ?? null,
			},
			...declaration.fields.map((field) => {
				const fieldName = field.semanticName ?? field.name;
				const path = `${recordPath}.field.${fieldName}`;
				return {
					ref: semanticRefFor(moduleName, path),
					path,
					kind: "field" as const,
					name: fieldName,
					module: moduleName,
					type: formatType(field.type),
					span: field.span ?? null,
				};
			}),
		];
	}
	if (declaration.kind === "function" && declaration.semantic) {
		const semanticPath = `${declaration.semantic.kind}.${declaration.semantic.name}`;
		const symbols: PointCoreSymbol[] = [
			{
				ref: semanticRefFor(moduleName, semanticPath),
				path: semanticPath,
				kind: declaration.semantic.kind,
				name: declaration.semantic.name,
				module: moduleName,
				type: formatType(declaration.returnType),
				effects: declaration.semantic.effects,
				span: declaration.span ?? null,
			},
			...declaration.params.map((param) => {
				const paramName = param.semanticName ?? param.name;
				const path = `${semanticPath}.input.${paramName}`;
				return {
					ref: semanticRefFor(moduleName, path),
					path,
					kind: "param" as const,
					name: paramName,
					module: moduleName,
					type: formatType(param.type),
					span: param.span ?? null,
				};
			}),
		];
		if (declaration.semantic.kind === "layout" && declaration.semantic.layoutSpec) {
			for (const slot of declaration.semantic.layoutSpec.slots) {
				symbols.push({
					ref: semanticRefFor(moduleName, `${semanticPath}.slot.${slot.name}`),
					path: `${semanticPath}.slot.${slot.name}`,
					kind: "slot",
					name: slot.name,
					module: moduleName,
					span: declaration.span ?? null,
				});
			}
		}
		return symbols;
	}
	if (declaration.kind === "external" && declaration.semantic) {
		const semanticPath = `external.${declaration.semantic.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, semanticPath),
				path: semanticPath,
				kind: "external",
				name: declaration.semantic.name,
				module: moduleName,
				type: formatType(declaration.returnType),
				from: declaration.from,
				span: declaration.span ?? null,
			},
		];
	}
	return [];
}

function refFor(moduleName: string, path: string): string {
	return `point://core/${moduleName}/${path}`;
}

function semanticRefFor(moduleName: string, path: string): string {
	return `point://semantic/${moduleName}/${path}`;
}

function relatedRefsFor(symbol: PointCoreSymbol, index: PointCoreIndex): string[] {
	if (symbol.kind === "field") {
		const ownerPath = symbol.path.split(".").slice(0, 2).join(".");
		return index.refs.filter((candidate) => candidate.path.startsWith(`${ownerPath}.`) && candidate.ref !== symbol.ref).map((candidate) => candidate.ref);
	}
	if (
		symbol.kind === "function" ||
		symbol.kind === "calculation" ||
		symbol.kind === "rule" ||
		symbol.kind === "label" ||
		symbol.kind === "action" ||
		symbol.kind === "policy" ||
		symbol.kind === "view" ||
		symbol.kind === "layout" ||
		symbol.kind === "page" ||
		symbol.kind === "route" ||
		symbol.kind === "workflow" ||
		symbol.kind === "pipeline" ||
		symbol.kind === "command"
	) {
		return index.refs
			.filter(
				(candidate) =>
					candidate.path.startsWith(`${symbol.path}.param.`) ||
					candidate.path.startsWith(`${symbol.path}.input.`) ||
					candidate.path.startsWith(`${symbol.path}.slot.`),
			)
			.map((candidate) => candidate.ref);
	}
	return [];
}

function summaryFor(symbol: PointCoreSymbol): string {
	if (symbol.kind === "module") return `Module ${symbol.name}.`;
	if (symbol.kind === "import") return `Import ${symbol.name} from ${symbol.from}.`;
	if (symbol.kind === "value") return `${symbol.mutable ? "Mutable" : "Immutable"} value ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "function") return `Function ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "external") return `External function ${symbol.name} from ${symbol.from} returns ${symbol.type}.`;
	if (symbol.kind === "param") return `Parameter ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "type") return `Named type ${symbol.name}.`;
	if (symbol.kind === "record") return `Semantic record ${symbol.name}.`;
	if (symbol.kind === "calculation") return `Semantic calculation ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "rule") return `Semantic rule ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "label") return `Semantic label ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "action") return `Semantic action ${symbol.name} returns ${symbol.type}; effects: ${(symbol.effects ?? []).join(", ") || "none"}.`;
	if (symbol.kind === "policy") return `Semantic policy ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "view") return `Semantic view ${symbol.name} returns React JSX.`;
	if (symbol.kind === "layout") return `Semantic layout ${symbol.name} composes page slots as React JSX.`;
	if (symbol.kind === "slot") return `Layout slot ${symbol.name}.`;
	if (symbol.kind === "page") return `Semantic page ${symbol.name} returns a Next.js page shell as React JSX.`;
	if (symbol.kind === "route") return `Semantic route ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "workflow") return `Semantic workflow ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "pipeline") return `Semantic pipeline ${symbol.name} returns ${symbol.type} with typed step events.`;
	if (symbol.kind === "command") return `Semantic command ${symbol.name} returns ${symbol.type}.`;
	return `Field ${symbol.name}: ${symbol.type}.`;
}

function semanticRefForCoreRef(program: PointCoreProgram, ref: string): string | null {
	const prefix = `point://core/${program.module ?? "anonymous"}/`;
	if (!ref.startsWith(prefix)) return null;
	return semanticRefForDiagnosticPath(program, ref.slice(prefix.length));
}

function semanticRefForDiagnosticPath(program: PointCoreProgram, path: string): string | null {
	const moduleName = program.module ?? "anonymous";
	for (const declaration of program.declarations) {
		if (declaration.kind === "type" && declaration.semantic?.kind === "record") {
			const recordPath = `type.${declaration.name}`;
			if (path === recordPath || path.startsWith(`${recordPath}.`)) {
				const parts = path.split(".");
				const field = parts.length >= 3 ? declaration.fields.find((candidate) => candidate.name === parts[2]) : undefined;
				const semanticPath = field
					? `record.${declaration.semantic.name}.field.${field.semanticName ?? field.name}`
					: `record.${declaration.semantic.name}`;
				return semanticRefFor(moduleName, semanticPath);
			}
		}
		if ((declaration.kind === "function" || declaration.kind === "external") && declaration.semantic) {
			const fnPath = `fn.${declaration.name}`;
			if (path === fnPath || path.startsWith(`${fnPath}.`)) {
				const semanticPath = `${declaration.semantic.kind}.${declaration.semantic.name}`;
				return semanticRefFor(moduleName, semanticPath);
			}
		}
	}
	return null;
}

function formatType(type: PointCoreTypeExpression): string {
	if (type.args.length === 0) return String(type.name);
	return `${type.name}<${type.args.map(formatType).join(", ")}>`;
}
