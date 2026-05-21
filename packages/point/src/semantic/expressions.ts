import type { PointSourceSpan } from "../core/ast.ts";
import { lexPointCore } from "../core/lexer.ts";
import type {
	PointSemanticBinaryOperator,
	PointSemanticExpression,
	PointSemanticRecordLiteralField,
	PointSemanticTypeExpression,
} from "./ast.ts";

export interface PointSemanticExpressionContext {
	bindings: string[];
	atoms: string[];
	callables: string[];
	recordFields: Map<string, string[]>;
	variantCases: Map<string, Map<string, string>>;
}

export function parseSemanticTypeExpression(source: string): PointSemanticTypeExpression {
	const trimmed = source.trim();
	const orParts = splitTopLevel(trimmed, " or ");
	if (orParts.length > 1) {
		return {
			kind: "typeRef",
			name: "Or",
			args: orParts.map(parseSemanticTypeExpression),
		};
	}
	const listMatch = trimmed.match(/^List<(.+)>$/);
	if (listMatch) {
		return { kind: "typeRef", name: "List", args: [parseSemanticTypeExpression(listMatch[1] ?? "")] };
	}
	const maybeMatch = trimmed.match(/^Maybe<(.+)>$/);
	if (maybeMatch) {
		return { kind: "typeRef", name: "Maybe", args: [parseSemanticTypeExpression(maybeMatch[1] ?? "")] };
	}
	const handlerMatch = trimmed.match(/^Handler\s+(.+)$/);
	if (handlerMatch) {
		return { kind: "typeRef", name: "Handler", args: [parseSemanticTypeExpression(handlerMatch[1] ?? "")] };
	}
	const handlerGenericMatch = trimmed.match(/^Handler<(.+)>$/);
	if (handlerGenericMatch) {
		return { kind: "typeRef", name: "Handler", args: [parseSemanticTypeExpression(handlerGenericMatch[1] ?? "")] };
	}
	return { kind: "typeRef", name: trimmed, args: [] };
}

export function parseSemanticExpression(
	source: string,
	context: PointSemanticExpressionContext,
	span?: PointSourceSpan,
): PointSemanticExpression {
	const errorMatch = source.trim().match(/^Error\s+("(?:\\.|[^"\\])*")$/);
	if (errorMatch) {
		const expression: PointSemanticExpression = { kind: "error", message: JSON.parse(errorMatch[1] ?? '""') as string };
		return span ? withExpressionSpan(expression, span) : expression;
	}
	const expression = parseBinaryExpression(source.trim(), 0, context).expression;
	return span ? withExpressionSpan(expression, span) : expression;
}

export function withExpressionSpan(expression: PointSemanticExpression, span: PointSourceSpan): PointSemanticExpression {
	switch (expression.kind) {
		case "literal":
		case "name":
		case "error":
			return { ...expression, span: expression.span ?? span };
		case "property":
			return {
				...expression,
				span: expression.span ?? span,
				target: withExpressionSpan(expression.target, span),
			};
		case "binary":
			return {
				...expression,
				span: expression.span ?? span,
				left: withExpressionSpan(expression.left, span),
				right: withExpressionSpan(expression.right, span),
			};
		case "call":
			return {
				...expression,
				span: expression.span ?? span,
				args: expression.args.map((arg) => withExpressionSpan(arg, span)),
			};
		case "await":
			return {
				...expression,
				span: expression.span ?? span,
				value: withExpressionSpan(expression.value, span),
			};
		case "list":
			return {
				...expression,
				span: expression.span ?? span,
				items: expression.items.map((item) => withExpressionSpan(item, span)),
			};
		case "record":
			return {
				...expression,
				span: expression.span ?? span,
				fields: expression.fields.map((field) => ({
					...field,
					value: withExpressionSpan(field.value, span),
				})),
			};
		case "variant":
			return {
				...expression,
				span: expression.span ?? span,
				fields: expression.fields.map((field) => ({
					...field,
					value: withExpressionSpan(field.value, span),
				})),
			};
	}
}

function parseBinaryExpression(
	source: string,
	minPrecedence: number,
	context: PointSemanticExpressionContext,
): { expression: PointSemanticExpression; consumed: string } {
	let left = parsePrimaryExpression(source, context);
	let rest = left.consumed.trimStart();
	while (rest) {
		const operator = peekBinaryOperator(rest);
		if (!operator) break;
		const precedence = precedenceFor(operator.op);
		if (precedence < minPrecedence) break;
		const right = parseBinaryExpression(operator.rest.trimStart(), precedence + 1, context);
		left = {
			expression: {
				kind: "binary",
				operator: operator.op,
				left: left.expression,
				right: right.expression,
			},
			consumed: right.consumed,
		};
		rest = left.consumed.trimStart();
	}
	return left;
}

function parsePrimaryExpression(source: string, context: PointSemanticExpressionContext): { expression: PointSemanticExpression; consumed: string } {
	const trimmed = source.trim();
	if (trimmed.startsWith("await ")) {
		const inner = parsePrimaryExpression(trimmed.slice("await ".length), context);
		return { expression: { kind: "await", value: inner.expression }, consumed: inner.consumed };
	}
	if (trimmed.startsWith("[")) {
		return parseListExpression(trimmed, context);
	}
	if (trimmed.startsWith("{")) {
		return parseRecordExpression(trimmed, context);
	}
	if (trimmed.startsWith('"')) {
		const literal = parseJsonStringLiteral(trimmed);
		return { expression: { kind: "literal", value: literal.value }, consumed: literal.consumed };
	}
	if (/^(true|false|null|none)\b/.test(trimmed)) {
		const match = trimmed.match(/^(true|false|null|none)\b/);
		const token = match?.[1];
		const value = token === "true" ? true : token === "false" ? false : null;
		return { expression: { kind: "literal", value }, consumed: trimmed.slice(match?.[0].length ?? 0) };
	}
	if (/^\d/.test(trimmed)) {
		const match = trimmed.match(/^(\d+(?:\.\d+)?)/);
		const value = Number(match?.[1] ?? 0);
		return { expression: { kind: "literal", value }, consumed: trimmed.slice(match?.[0].length ?? 0) };
	}
	const callMatch = matchCall(trimmed, context);
	if (callMatch) return callMatch;
	const variantMatch = matchVariantLiteral(trimmed, context);
	if (variantMatch) return variantMatch;
	const atom = matchAtom(trimmed, context);
	if (atom) {
		if (atom.includes(".")) {
			const dot = atom.indexOf(".");
			return {
				expression: {
					kind: "property",
					target: { kind: "name", label: atom.slice(0, dot) },
					label: atom.slice(dot + 1),
				},
				consumed: trimmed.slice(atom.length),
			};
		}
		let expression: PointSemanticExpression = { kind: "name", label: atom };
		let consumed = trimmed.slice(atom.length);
		while (consumed.trimStart().startsWith(".")) {
			let rest = consumed.trimStart().slice(1);
			const fieldMatch = rest.match(/^([A-Za-z][A-Za-z0-9 ]*[A-Za-z0-9]|[A-Za-z])/);
			if (!fieldMatch) break;
			const label = fieldMatch[0] ?? "";
			expression = { kind: "property", target: expression, label };
			consumed = rest.slice(label.length);
		}
		return { expression, consumed };
	}
	throw new Error(`Unable to parse semantic expression: ${source}`);
}

function parseJsonStringLiteral(source: string): { value: string; consumed: string } {
	if (!source.startsWith('"')) throw new Error(`Expected string literal: ${source}`);
	let index = 1;
	while (index < source.length) {
		const char = source[index];
		if (char === "\\") {
			index += 2;
			continue;
		}
		if (char === '"') {
			const value = JSON.parse(source.slice(0, index + 1)) as string;
			return { value, consumed: source.slice(index + 1) };
		}
		index += 1;
	}
	throw new Error(`Unterminated string literal: ${source}`);
}

function parseListExpression(source: string, context: PointSemanticExpressionContext): { expression: PointSemanticExpression; consumed: string } {
	let rest = source.trim().slice(1).trimStart();
	const items: PointSemanticExpression[] = [];
	while (rest && !rest.startsWith("]")) {
		const parsed = parseBinaryExpression(rest, 0, context);
		items.push(parsed.expression);
		rest = parsed.consumed.trimStart();
		if (rest.startsWith(",")) rest = rest.slice(1).trimStart();
	}
	if (!rest.startsWith("]")) throw new Error(`Unterminated list literal: ${source}`);
	return { expression: { kind: "list", items }, consumed: rest.slice(1) };
}

function parseRecordExpression(source: string, context: PointSemanticExpressionContext): { expression: PointSemanticExpression; consumed: string } {
	let rest = source.trim().slice(1).trimStart();
	const fields: PointSemanticRecordLiteralField[] = [];
	while (rest && !rest.startsWith("}")) {
		const colon = rest.indexOf(":");
		if (colon === -1) throw new Error(`Expected record field label: ${source}`);
		const label = rest.slice(0, colon).trim();
		rest = rest.slice(colon + 1).trimStart();
		const parsed = parseBinaryExpression(rest, 0, context);
		fields.push({ label, value: parsed.expression });
		rest = parsed.consumed.trimStart();
		if (rest.startsWith(",")) rest = rest.slice(1).trimStart();
	}
	if (!rest.startsWith("}")) throw new Error(`Unterminated record literal: ${source}`);
	return { expression: { kind: "record", fields }, consumed: rest.slice(1) };
}

function matchCall(source: string, context: PointSemanticExpressionContext): { expression: PointSemanticExpression; consumed: string } | null {
	const candidates = [...context.callables, ...context.atoms, ...context.bindings].sort((a, b) => b.length - a.length);
	for (const callee of candidates) {
		const parsed = parseCallExpression(source, callee, context);
		if (parsed) return parsed;
	}
	const generic = source.match(/^([A-Za-z_][A-Za-z0-9_]*)\(/);
	if (generic) return parseCallExpression(source, generic[1] ?? "", context);
	return null;
}

function parseCallExpression(
	source: string,
	callee: string,
	context: PointSemanticExpressionContext,
): { expression: PointSemanticExpression; consumed: string } | null {
	if (!source.startsWith(callee)) return null;
	const after = source.slice(callee.length);
	if (!after.startsWith("(")) return null;
	let depth = 0;
	let index = 0;
	for (; index < after.length; index += 1) {
		const char = after[index];
		if (char === "(") depth += 1;
		if (char === ")") {
			depth -= 1;
			if (depth === 0) break;
		}
	}
	const argSource = after.slice(1, index);
	const args = argSource.trim() ? splitTopLevel(argSource, ",").map((part) => parseSemanticExpression(part, context)) : [];
	return {
		expression: { kind: "call", callee, args },
		consumed: source.slice(callee.length + index + 1),
	};
}

function matchAtom(source: string, context: PointSemanticExpressionContext): string | null {
	for (const atom of [...context.atoms, ...context.bindings].sort((a, b) => b.length - a.length)) {
		if (!source.startsWith(atom)) continue;
		const next = source[atom.length];
		if (next && /[A-Za-z0-9_]/.test(next)) continue;
		return atom;
	}
	return null;
}

function peekBinaryOperator(source: string): { op: PointSemanticBinaryOperator; rest: string } | null {
	for (const op of ["==", "!=", "<=", ">=", "and", "or", "+", "-", "*", "/", "<", ">"] as const) {
		if (source.startsWith(op)) {
			const next = source[op.length];
			if (op === "-" && /^\d/.test(source)) return null;
			if (next && /[A-Za-z0-9_]/.test(next) && !["and", "or"].includes(op)) continue;
			return { op, rest: source.slice(op.length) };
		}
	}
	return null;
}

function precedenceFor(operator: PointSemanticBinaryOperator): number {
	if (operator === "or") return 1;
	if (operator === "and") return 2;
	if (operator === "==" || operator === "!=") return 3;
	if (operator === "<" || operator === "<=" || operator === ">" || operator === ">=") return 4;
	if (operator === "+" || operator === "-") return 5;
	return 6;
}

function splitTopLevel(source: string, separator: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let quote: '"' | null = null;
	let current = "";
	for (let index = 0; index < source.length; index += 1) {
		const char = source[index];
		if (quote) {
			current += char;
			if (char === quote && source[index - 1] !== "\\") quote = null;
			continue;
		}
		if (char === '"') {
			quote = '"';
			current += char;
			continue;
		}
		if (char === "<" || char === "(" || char === "[") depth += 1;
		if (char === ">" || char === ")" || char === "]") depth -= 1;
		if (depth === 0 && source.slice(index, index + separator.length) === separator) {
			parts.push(current.trim());
			current = "";
			index += separator.length - 1;
			continue;
		}
		current += char;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}

function matchVariantLiteral(
	source: string,
	context: PointSemanticExpressionContext,
): { expression: PointSemanticExpression; consumed: string } | null {
	const candidates = [...context.variantCases.keys()].sort((a, b) => b.length - a.length);
	for (const caseLabel of candidates) {
		if (!source.startsWith(caseLabel)) continue;
		const next = source[caseLabel.length];
		if (next && /[A-Za-z0-9_]/.test(next)) continue;
		let rest = source.slice(caseLabel.length).trimStart();
		const fields: PointSemanticRecordLiteralField[] = [];
		if (rest.startsWith("with ")) {
			rest = rest.slice("with ".length).trimStart();
			for (const part of splitTopLevel(rest, " and ")) {
				const colon = part.indexOf(":");
				if (colon === -1) throw new Error(`Expected variant field value in ${caseLabel}: ${part}`);
				const label = part.slice(0, colon).trim();
				const parsed = parseBinaryExpression(part.slice(colon + 1).trimStart(), 0, context);
				fields.push({ label, value: parsed.expression });
				rest = parsed.consumed;
			}
		}
		return { expression: { kind: "variant", caseLabel, fields }, consumed: rest };
	}
	return null;
}

export function buildExpressionContext(options: {
	bindings?: string[];
	paramTypes?: Map<string, string>;
	recordFields?: Map<string, Map<string, string>>;
	variantCases?: Map<string, Map<string, string>>;
	callables?: string[];
}): PointSemanticExpressionContext {
	const bindings = options.bindings ?? [];
	const callables = options.callables ?? [];
	const atoms: string[] = [...bindings, ...(options.variantCases ? [...options.variantCases.keys()] : [])];
	const recordFields = new Map<string, string[]>();
	for (const [param, type] of options.paramTypes ?? []) {
		const fields = options.recordFields?.get(type);
		if (fields) {
			recordFields.set(type, [...fields.keys()]);
			for (const label of fields.keys()) atoms.push(`${param}.${label}`);
		}
	}
	return {
		bindings,
		atoms,
		callables,
		recordFields,
		variantCases: options.variantCases ?? new Map(),
	};
}

export function lineSpan(source: string, lineNumber: number): PointSourceSpan {
	const lines = source.split(/\r?\n/);
	let offset = 0;
	for (let index = 0; index < lineNumber - 1; index += 1) offset += (lines[index]?.length ?? 0) + 1;
	const line = lines[lineNumber - 1] ?? "";
	return {
		start: { line: lineNumber, column: 1, offset },
		end: { line: lineNumber, column: line.length + 1, offset: offset + line.length },
	};
}

export function validateExpressionWithLexer(source: string): void {
	lexPointCore(source.replace(/\band\b/g, "&&").replace(/\bor\b/g, "||"));
}
