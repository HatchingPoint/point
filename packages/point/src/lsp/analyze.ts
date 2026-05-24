import type { PointCoreProgram, PointSourceSpan } from "../core/ast.ts";
import { buildCoreFileFromSource, createModuleGraphForFile, programWithDependencyDeclarations } from "../core/cli.ts";
import { checkPointCore } from "../core/check.ts";
import type { PointCoreDiagnostic } from "../core/check.ts";
import { sortDiagnosticsForRepairPlan } from "../core/context.ts";
import { formatPointSource } from "../core/format.ts";
import { parsePointSource, type ParsePointSourceOptions } from "../core/parser.ts";
import { readPointLock } from "../core/packages.ts";
import { findPointProjectRoot } from "../core/resolve-cli.ts";
import type { PointSemanticSymbol, PointSemanticSymbolKind } from "../semantic/context.ts";
import { createSemanticIndex, explainSemanticRef, mapPublicDiagnostics } from "../semantic/context.ts";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface LspRange {
	start: { line: number; character: number };
	end: { line: number; character: number };
}

export interface LspDiagnostic {
	range: LspRange;
	severity: 1;
	code: string;
	source: string;
	message: string;
	ref?: string;
	repair?: string;
	relatedInformation?: Array<{ location: LspRange; message: string }>;
}

export interface LspDocumentSymbol {
	name: string;
	detail?: string;
	kind: number;
	range: LspRange;
	selectionRange: LspRange;
}

export interface LspHover {
	contents: string;
}

export interface LspCompletionItem {
	label: string;
	kind: number;
	detail?: string;
}

const BLOCK_KEYWORDS = [
	"module",
	"use",
	"record",
	"calculation",
	"rule",
	"label",
	"external",
	"action",
	"policy",
	"view",
	"route",
	"workflow",
	"command",
];

const STATEMENT_KEYWORDS = [
	"input",
	"output",
	"return",
	"when",
	"otherwise",
	"add",
	"subtract",
	"set",
	"for",
	"each",
	"in",
	"starts",
	"at",
	"as",
	"to",
	"from",
	"is",
	"render",
	"method",
	"path",
	"step",
	"await",
	"touches",
	"and",
	"or",
	"none",
	"true",
	"false",
];

const TYPE_KEYWORDS = ["Text", "Int", "Float", "Bool", "Void", "List", "Maybe"];

export interface PointDocumentAnalysis {
	diagnostics: LspDiagnostic[];
	symbols: PointSemanticSymbol[];
}

export interface AnalyzePointSourceOptions {
	documentUri?: string;
	input?: string;
	cwd?: string;
}

const OUTLINE_KINDS = new Set<PointSemanticSymbolKind>([
	"record",
	"calculation",
	"rule",
	"label",
	"action",
	"policy",
	"external",
	"view",
	"route",
	"workflow",
	"command",
]);

export function pointSpanToLspRange(span: PointSourceSpan): LspRange {
	return {
		start: { line: Math.max(0, span.start.line - 1), character: Math.max(0, span.start.column - 1) },
		end: { line: Math.max(0, span.end.line - 1), character: Math.max(0, span.end.column - 1) },
	};
}

export function lspPositionToPoint(line: number, character: number): { line: number; column: number } {
	return { line: line + 1, column: character + 1 };
}

export function resolveAnalyzeParseContext(options?: AnalyzePointSourceOptions): Required<ParsePointSourceOptions> {
	if (options?.input && options.cwd) {
		return { cwd: options.cwd, input: options.input.replaceAll("\\", "/") };
	}
	const absolutePath = options?.documentUri
		? options.documentUri.startsWith("file:")
			? fileURLToPath(options.documentUri)
			: resolve(options.documentUri)
		: options?.input
			? resolve(options.cwd ?? process.cwd(), options.input)
			: null;
	if (!absolutePath) {
		return { cwd: options?.cwd ?? process.cwd(), input: "" };
	}
	const projectRoot = options?.cwd ?? findPointProjectRoot(dirname(absolutePath)) ?? process.cwd();
	return {
		cwd: projectRoot,
		input: relative(projectRoot, absolutePath).replaceAll("\\", "/"),
	};
}

async function programForAnalyze(source: string, options?: AnalyzePointSourceOptions): Promise<PointCoreProgram> {
	const parseContext = resolveAnalyzeParseContext(options);
	if (!parseContext.input) {
		return parsePointSource(source, parseContext);
	}
	const lock = await readPointLock(parseContext.cwd);
	const coreFile = buildCoreFileFromSource(parseContext.input, source, lock, parseContext.cwd);
	if (coreFile.uses.length === 0) {
		return coreFile.program;
	}
	const graph = await createModuleGraphForFile(coreFile, lock, parseContext.cwd);
	return programWithDependencyDeclarations(coreFile, graph);
}

export async function analyzePointSource(
	source: string,
	options?: AnalyzePointSourceOptions,
): Promise<PointDocumentAnalysis> {
	try {
		const parseContext = resolveAnalyzeParseContext(options);
		const program = await programForAnalyze(source, options);
		const sorted = sortDiagnosticsForRepairPlan(mapPublicDiagnostics(program, checkPointCore(program)));
		const diagnostics = sorted.map((diagnostic, index) => toLspDiagnostic(diagnostic, index + 1, sorted.length));
		const indexProgram = parsePointSource(source, parseContext);
		const symbols = indexProgram.semanticSource ? createSemanticIndex(indexProgram.semanticSource).refs : [];
		return { diagnostics, symbols };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			diagnostics: [parseErrorDiagnostic(message)],
			symbols: [],
		};
	}
}

export function outlineSymbols(symbols: PointSemanticSymbol[]): LspDocumentSymbol[] {
	return symbols
		.filter((symbol) => OUTLINE_KINDS.has(symbol.kind) && symbol.span)
		.map((symbol) => {
			const range = pointSpanToLspRange(symbol.span!);
			return {
				name: symbol.name,
				detail: symbol.ref,
				kind: symbolKindToLsp(symbol.kind),
				range,
				selectionRange: range,
			};
		});
}

export function symbolAtPoint(symbols: PointSemanticSymbol[], line: number, column: number): PointSemanticSymbol | undefined {
	const matches = symbols.filter((symbol) => symbolContainsPoint(symbol, line, column));
	return matches.sort((left, right) => spanSize(left.span) - spanSize(right.span))[0];
}

export async function hoverForPosition(
	source: string,
	line: number,
	column: number,
	options?: AnalyzePointSourceOptions,
): Promise<LspHover | null> {
	const analysis = await analyzePointSource(source, options);
	const symbol = symbolAtPoint(analysis.symbols, line, column);
	if (!symbol?.span) return null;
	try {
		const program = parsePointSource(source, resolveAnalyzeParseContext(options));
		if (!program.semanticSource) return { contents: symbol.ref };
		const explanation = explainSemanticRef(program.semanticSource, symbol.ref);
		return { contents: explanation.summary };
	} catch {
		return { contents: symbol.ref };
	}
}

export function definitionForPosition(
	symbols: PointSemanticSymbol[],
	line: number,
	column: number,
): LspRange | null {
	const symbol = symbolAtPoint(symbols, line, column);
	if (!symbol?.span) return null;
	return pointSpanToLspRange(symbol.span);
}

export function formatPointDocument(source: string): string {
	try {
		return formatPointSource(source);
	} catch {
		return source;
	}
}

export async function completionsForPosition(
	source: string,
	line: number,
	column: number,
	options?: AnalyzePointSourceOptions,
): Promise<LspCompletionItem[]> {
	const analysis = await analyzePointSource(source, options);
	const lines = source.split(/\r?\n/);
	const lineText = lines[line - 1] ?? "";
	const before = lineText.slice(0, Math.max(0, column - 1));
	const items: LspCompletionItem[] = [];
	const seen = new Set<string>();
	const add = (label: string, kind: number, detail?: string) => {
		if (seen.has(label)) return;
		seen.add(label);
		items.push({ label, kind, detail });
	};

	if (/^\s*$/.test(before)) {
		for (const keyword of BLOCK_KEYWORDS) add(keyword, 14);
	}

	for (const keyword of [...STATEMENT_KEYWORDS, ...TYPE_KEYWORDS]) add(keyword, 14);
	for (const symbol of analysis.symbols) {
		const kind =
			symbol.kind === "field" ? 5 : symbol.kind === "record" ? 7 : symbol.kind === "param" ? 6 : 3;
		add(symbol.name, kind, symbol.kind);
	}

	return items;
}

export async function renameSymbolInDocument(
	source: string,
	line: number,
	column: number,
	newName: string,
	options?: AnalyzePointSourceOptions,
): Promise<{ range: LspRange; newText: string } | null> {
	const analysis = await analyzePointSource(source, options);
	const symbol = symbolAtPoint(analysis.symbols, line, column);
	if (!symbol?.span || !newName.trim()) return null;
	const oldName = symbol.name;
	if (oldName === newName) {
		return { range: pointSpanToLspRange(symbol.span), newText: oldName };
	}
	const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const updated = source.replace(new RegExp(escaped, "g"), newName);
	if (updated === source) return null;
	return {
		range: fullDocumentRange(source),
		newText: updated,
	};
}

export async function prepareRenameAtPosition(
	source: string,
	line: number,
	column: number,
	options?: AnalyzePointSourceOptions,
): Promise<{ range: LspRange; placeholder: string } | null> {
	const analysis = await analyzePointSource(source, options);
	const symbol = symbolAtPoint(analysis.symbols, line, column);
	if (!symbol?.span) return null;
	return {
		range: pointSpanToLspRange(symbol.span),
		placeholder: symbol.name,
	};
}

function fullDocumentRange(text: string): LspRange {
	const lines = text.split(/\r?\n/);
	const lastLine = Math.max(0, lines.length - 1);
	const lastCharacter = lines[lastLine]?.length ?? 0;
	return {
		start: { line: 0, character: 0 },
		end: { line: lastLine, character: lastCharacter },
	};
}

function toLspDiagnostic(diagnostic: PointCoreDiagnostic, step = 1, total = 1): LspDiagnostic {
	const range = diagnostic.span
		? pointSpanToLspRange(diagnostic.span)
		: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };
	const repair = diagnostic.repair?.trim();
	const stepLabel = total > 1 ? `[repair ${step}/${total}] ` : "";
	const related = (diagnostic.relatedRefs ?? [])
		.filter((ref) => ref !== diagnostic.ref)
		.map((ref) => ({ location: range, message: ref }));
	const relatedSuffix = related.length > 0 ? ` Related: ${related.map((entry) => entry.message).join(", ")}` : "";
	const message = repair
		? `${stepLabel}${diagnostic.message} — ${repair}${relatedSuffix}`
		: `${stepLabel}${diagnostic.message}${relatedSuffix}`;
	return {
		range,
		severity: 1,
		code: diagnostic.code,
		source: "point",
		message,
		ref: diagnostic.ref,
		repair,
		relatedInformation: related.length > 0 ? related : undefined,
	};
}

function parseErrorDiagnostic(message: string): LspDiagnostic {
	const match = message.match(/\bat (\d+)\b/);
	const line = match ? Math.max(0, Number(match[1]) - 1) : 0;
	return {
		range: { start: { line, character: 0 }, end: { line, character: 1 } },
		severity: 1,
		code: "parse-error",
		source: "point",
		message,
	};
}

function symbolContainsPoint(symbol: PointSemanticSymbol, line: number, column: number): boolean {
	if (!symbol.span) return false;
	const { start, end } = symbol.span;
	if (line < start.line || line > end.line) return false;
	if (line === start.line && column < start.column) return false;
	if (line === end.line && column > end.column) return false;
	return true;
}

function spanSize(span: PointSourceSpan | null | undefined): number {
	if (!span) return Number.MAX_SAFE_INTEGER;
	const lines = span.end.line - span.start.line;
	const columns = span.end.column - span.start.column;
	return lines * 10_000 + columns;
}

function symbolKindToLsp(kind: PointSemanticSymbolKind): number {
	switch (kind) {
		case "record":
			return 23;
		case "field":
			return 8;
		case "calculation":
		case "rule":
		case "label":
		case "action":
		case "policy":
		case "external":
		case "view":
		case "route":
		case "workflow":
		case "command":
			return 12;
		case "module":
			return 2;
		case "use":
			return 3;
		case "param":
			return 6;
		default:
			return 13;
	}
}
