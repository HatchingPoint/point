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

export type PointCoreSymbolKind = "module" | "import" | "value" | "function" | "param" | "type" | "field";

export interface PointCoreSymbol {
	ref: string;
	path: string;
	kind: PointCoreSymbolKind;
	name: string;
	module: string;
	type?: string;
	mutable?: boolean;
	from?: string;
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
	for (const declaration of program.declarations) refs.push(...symbolsForDeclaration(moduleName, declaration));
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

export function createPointCoreRepairPlan(diagnostics: PointCoreDiagnostic[]): PointCoreRepairPlan {
	return {
		schemaVersion: "point.core.repair-plan.v1",
		ok: diagnostics.length === 0,
		steps: diagnostics.map((diagnostic) => ({
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

function refFor(moduleName: string, path: string): string {
	return `point://core/${moduleName}/${path}`;
}

function relatedRefsFor(symbol: PointCoreSymbol, index: PointCoreIndex): string[] {
	if (symbol.kind === "field") {
		const ownerPath = symbol.path.split(".").slice(0, 2).join(".");
		return index.refs.filter((candidate) => candidate.path.startsWith(`${ownerPath}.`) && candidate.ref !== symbol.ref).map((candidate) => candidate.ref);
	}
	if (symbol.kind === "function") {
		return index.refs.filter((candidate) => candidate.path.startsWith(`${symbol.path}.param.`)).map((candidate) => candidate.ref);
	}
	return [];
}

function summaryFor(symbol: PointCoreSymbol): string {
	if (symbol.kind === "module") return `Module ${symbol.name}.`;
	if (symbol.kind === "import") return `Import ${symbol.name} from ${symbol.from}.`;
	if (symbol.kind === "value") return `${symbol.mutable ? "Mutable" : "Immutable"} value ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "function") return `Function ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "param") return `Parameter ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "type") return `Named type ${symbol.name}.`;
	return `Field ${symbol.name}: ${symbol.type}.`;
}

function formatType(type: PointCoreTypeExpression): string {
	if (type.args.length === 0) return String(type.name);
	return `${type.name}<${type.args.map(formatType).join(", ")}>`;
}
