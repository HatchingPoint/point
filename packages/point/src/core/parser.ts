import type {
	PointCoreBinaryOperator,
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreFunctionDeclaration,
	PointCoreParameter,
	PointCoreProgram,
	PointCoreRecordField,
	PointCoreStatement,
	PointCoreTypeExpression,
	PointCoreValueDeclaration,
	PointSourceSpan,
} from "./ast.ts";
import { lexPointCore, type PointCoreToken, type PointCoreTokenType } from "./lexer.ts";

export class PointCoreParserError extends Error {
	constructor(message: string, public readonly token: PointCoreToken) {
		super(`${message} at ${token.span.start.line}:${token.span.start.column}`);
		this.name = "PointCoreParserError";
	}
}

export function parsePointCore(source: string): PointCoreProgram {
	const parser = new CoreParser(lexPointCore(source));
	return parser.parseProgram();
}

export function parsePointSource(source: string): PointCoreProgram {
	assertSemanticPointSource(source);
	const parser = new CoreParser(lexPointCore(lowerSemanticPointSyntax(source)));
	return parser.parseProgram();
}

export function isSemanticPointSyntax(source: string): boolean {
	return source
		.split(/\r?\n/)
		.some((line) => /^(record|calculation|rule|label)\s+/.test(line.trim()));
}

function lowerSemanticPointSyntax(source: string): string {
	if (!isSemanticPointSyntax(source)) return source;
	const lines = source.split(/\r?\n/);
	const output: string[] = [];
	const records = new Map<string, Map<string, string>>();
	let index = 0;

	while (index < lines.length) {
		const line = lines[index] ?? "";
		const trimmed = line.trim();
		if (!trimmed) {
			index += 1;
			continue;
		}
		if (trimmed.startsWith("module ")) {
			output.push(trimmed);
			index += 1;
			continue;
		}
		if (trimmed.startsWith("record ")) {
			const lowered = lowerRecord(lines, index, records);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("calculation ")) {
			const lowered = lowerCalculation(lines, index, records);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("rule ")) {
			const lowered = lowerRule(lines, index, records);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("label ")) {
			const lowered = lowerLabel(lines, index, records);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		output.push(line);
		index += 1;
	}

	return `${output.join("\n")}\n`;
}

function assertSemanticPointSource(source: string) {
	const oldStyleTopLevel = /^(import|type|let|var|fn)\s+/;
	const lines = source.split(/\r?\n/);
	let hasSemanticDeclaration = false;

	for (const [index, line] of lines.entries()) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("//")) continue;
		if (/^(record|calculation|rule|label)\s+/.test(trimmed)) hasSemanticDeclaration = true;
		if (oldStyleTopLevel.test(trimmed)) {
			throw new Error(
				`Point source uses internal core syntax at ${index + 1}:1. Use record, calculation, rule, or label instead.`,
			);
		}
	}

	if (!hasSemanticDeclaration) {
		throw new Error("Point source must contain at least one semantic declaration: record, calculation, rule, or label.");
	}
}

function lowerRecord(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
): { lines: string[]; next: number } {
	const name = (lines[start] ?? "").trim().slice("record ".length).trim();
	const typeName = toPascalCase(name);
	const fields = new Map<string, string>();
	const output = [`type ${typeName} {`];
	let index = start + 1;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed)) break;
		const colon = trimmed.indexOf(":");
		if (colon === -1) throw new Error(`Expected field type in record ${name}: ${trimmed}`);
		const label = trimmed.slice(0, colon).trim();
		const fieldName = toIdentifier(label);
		fields.set(label, fieldName);
		output.push(`  ${fieldName}: ${trimmed.slice(colon + 1).trim()}`);
	}
	output.push("}", "");
	records.set(typeName, fields);
	return { lines: output, next: index };
}

function lowerRule(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("rule ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>();
	let outputName = "result";
	let outputType = "Void";
	const statements: string[] = [];

	for (const line of body.lines) {
		if (line.startsWith("input ")) {
			const param = parseTypedBinding(line.slice("input ".length));
			const paramName = toIdentifier(param.name);
			params.push(`${paramName}: ${param.type}`);
			paramTypes.set(paramName, param.type);
			bindings.set(param.name, paramName);
			continue;
		}
		if (line.startsWith("output ")) {
			const output = parseOutputBinding(line.slice("output ".length));
			outputName = toIdentifier(output.name);
			outputType = output.type;
			bindings.set(output.name, outputName);
			continue;
		}
		const startsAt = line.match(/^(.+) starts at (.+)$/);
		if (startsAt) {
			const name = toIdentifier(startsAt[1] ?? "");
			bindings.set(startsAt[1]?.trim() ?? name, name);
			statements.push(`var ${name}: ${outputType} = ${lowerExpression(startsAt[2] ?? "", paramTypes, records, bindings)}`);
			continue;
		}
		const addWhen = line.match(/^add (.+) when (.+)$/);
		if (addWhen) {
			statements.push(`if ${lowerExpression(addWhen[2] ?? "", paramTypes, records, bindings)} {`);
			statements.push(`  ${outputName} += ${lowerExpression(addWhen[1] ?? "", paramTypes, records, bindings)}`);
			statements.push("}");
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown rule statement: ${line}`);
	}

	const functionName = `${toIdentifier(label)}${toPascalCase(outputName)}`;
	return {
		lines: [`fn ${functionName}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerCalculation(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("calculation ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>();
	let outputName = "result";
	let outputType = "Void";
	const statements: string[] = [];

	for (const line of body.lines) {
		if (line.startsWith("input ")) {
			const param = parseTypedBinding(line.slice("input ".length));
			const paramName = toIdentifier(param.name);
			params.push(`${paramName}: ${param.type}`);
			paramTypes.set(paramName, param.type);
			bindings.set(param.name, paramName);
			continue;
		}
		if (line.startsWith("output ")) {
			const output = parseOutputBinding(line.slice("output ".length));
			outputName = toIdentifier(output.name);
			outputType = output.type;
			bindings.set(output.name, outputName);
			continue;
		}
		const isExpression = line.match(/^(.+) is (.+)$/);
		if (isExpression) {
			const name = toIdentifier(isExpression[1] ?? "");
			if (name !== outputName) throw new Error(`Calculation ${label} can only assign its output ${outputName}`);
			statements.push(`return ${lowerExpression(isExpression[2] ?? "", paramTypes, records, bindings)}`);
			continue;
		}
		const startsAs = line.match(/^(.+) starts as (.+)$/);
		if (startsAs) {
			const name = toIdentifier(startsAs[1] ?? "");
			bindings.set(startsAs[1]?.trim() ?? name, name);
			statements.push(`var ${name}: ${outputType} = ${lowerExpression(startsAs[2] ?? "", paramTypes, records, bindings)}`);
			continue;
		}
		const startsAt = line.match(/^(.+) starts at (.+)$/);
		if (startsAt) {
			const name = toIdentifier(startsAt[1] ?? "");
			bindings.set(startsAt[1]?.trim() ?? name, name);
			statements.push(`var ${name}: ${outputType} = ${lowerExpression(startsAt[2] ?? "", paramTypes, records, bindings)}`);
			continue;
		}
		const addTo = line.match(/^add (.+) to (.+)$/);
		if (addTo) {
			statements.push(`${lowerExpression(addTo[2] ?? "", paramTypes, records, bindings)} += ${lowerExpression(addTo[1] ?? "", paramTypes, records, bindings)}`);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown calculation statement: ${line}`);
	}

	return {
		lines: [`fn ${toIdentifier(label)}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerLabel(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("label ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>();
	let outputType = "Text";
	const statements: string[] = [];

	for (const line of body.lines) {
		if (line.startsWith("input ")) {
			const param = parseTypedBinding(line.slice("input ".length));
			const paramName = toIdentifier(param.name);
			params.push(`${paramName}: ${param.type}`);
			paramTypes.set(paramName, param.type);
			bindings.set(param.name, paramName);
			continue;
		}
		if (line.startsWith("output ")) {
			outputType = parseOutputBinding(line.slice("output ".length)).type;
			continue;
		}
		const whenReturn = line.match(/^when (.+) return (.+)$/);
		if (whenReturn) {
			statements.push(`if ${lowerExpression(whenReturn[1] ?? "", paramTypes, records, bindings)} {`);
			statements.push(`  return ${lowerExpression(whenReturn[2] ?? "", paramTypes, records, bindings)}`);
			statements.push("}");
			continue;
		}
		if (line.startsWith("otherwise return ")) {
			statements.push(`return ${lowerExpression(line.slice("otherwise return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown label statement: ${line}`);
	}

	return {
		lines: [`fn ${toIdentifier(label)}Label(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function collectSemanticBody(lines: string[], start: number): { lines: string[]; next: number } {
	const body: string[] = [];
	let index = start;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed)) break;
		body.push(trimmed);
	}
	return { lines: body, next: index };
}

function isSemanticTopLevel(line: string): boolean {
	return /^(module|record|calculation|rule|label|type|fn|let|var|import)\s+/.test(line);
}

function parseTypedBinding(source: string): { name: string; type: string } {
	const colon = source.indexOf(":");
	if (colon === -1) throw new Error(`Expected typed binding: ${source}`);
	return { name: source.slice(0, colon).trim(), type: normalizeTypeExpressionSource(source.slice(colon + 1).trim()) };
}

function parseOutputBinding(source: string): { name: string; type: string } {
	const colon = source.indexOf(":");
	if (colon !== -1) return parseTypedBinding(source);
	return { name: "result", type: normalizeTypeExpressionSource(source.trim()) };
}

function lowerExpression(
	source: string,
	paramTypes: Map<string, string>,
	records: Map<string, Map<string, string>>,
	bindings: Map<string, string> = new Map(),
): string {
	let expression = source.trim();
	for (const [label, identifier] of [...bindings].sort((a, b) => b[0].length - a[0].length)) {
		expression = replaceSemanticName(expression, label, identifier);
	}
	for (const [param, type] of paramTypes) {
		const fields = records.get(type);
		if (!fields) continue;
		const labels = [...fields.keys()].sort((a, b) => b.length - a.length);
		for (const label of labels) {
			const field = fields.get(label);
			if (!field) continue;
			expression = expression.replaceAll(`${param}.${label}`, `${param}.${field}`);
		}
	}
	return expression;
}

function replaceSemanticName(source: string, label: string, identifier: string): string {
	if (label === identifier) return source;
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return source.replace(new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), identifier);
}

function toIdentifier(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word, index) => (index === 0 ? word.toLowerCase() : toPascalCase(word))).join("");
}

function toPascalCase(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join("");
}

function normalizeTypeExpressionSource(source: string): string {
	const trimmed = source.trim();
	const listMatch = trimmed.match(/^List<(.+)>$/);
	if (listMatch) return `List<${normalizeTypeExpressionSource(listMatch[1] ?? "")}>`;
	if (trimmed === "Text" || trimmed === "Int" || trimmed === "Float" || trimmed === "Bool" || trimmed === "Void") {
		return trimmed;
	}
	return toPascalCase(trimmed);
}

function indentRaw(lines: string[]): string[] {
	return lines.map((line) => `  ${line}`);
}

class CoreParser {
	private current = 0;

	constructor(private readonly tokens: PointCoreToken[]) {}

	parseProgram(): PointCoreProgram {
		let moduleName: string | undefined;
		const declarations: PointCoreDeclaration[] = [];
		const start = this.peek().span.start;
		while (!this.check("eof")) {
			if (this.matchKeyword("module")) {
				moduleName = this.consume("identifier", "Expected module name").value;
				continue;
			}
			declarations.push(this.parseDeclaration());
		}
		return {
			kind: "coreProgram",
			module: moduleName,
			declarations,
			span: { start, end: this.peek().span.end },
		};
	}

	private parseDeclaration(): PointCoreDeclaration {
		if (this.matchKeyword("import")) return this.parseImport();
		if (this.checkKeyword("let") || this.checkKeyword("var")) return this.parseValueDeclaration();
		if (this.matchKeyword("fn")) return this.parseFunction();
		if (this.matchKeyword("type")) return this.parseTypeDeclaration();
		throw new PointCoreParserError("Expected import, let, var, fn, or type declaration", this.peek());
	}

	private parseImport(): PointCoreDeclaration {
		const start = this.previous().span.start;
		this.consume("leftBrace", "Expected import list");
		const names: string[] = [];
		do {
			names.push(this.consume("identifier", "Expected imported name").value);
		} while (this.match("comma"));
		this.consume("rightBrace", "Expected end of import list");
		this.consumeKeyword("from");
		const from = this.consume("string", "Expected import source").value;
		return { kind: "import", names, from, span: { start, end: this.previous().span.end } };
	}

	private parseValueDeclaration(): PointCoreValueDeclaration {
		const keyword = this.advance();
		const name = this.consume("identifier", "Expected value name");
		this.consume("colon", `Expected type annotation for ${name.value}`);
		const type = this.parseTypeExpression();
		this.consume("equals", `Expected initializer for ${name.value}`);
		const value = this.parseExpression();
		return {
			kind: "value",
			mutable: keyword.value === "var",
			name: name.value,
			type,
			value,
			span: { start: keyword.span.start, end: value.span?.end ?? this.previous().span.end },
		};
	}

	private parseFunction(): PointCoreFunctionDeclaration {
		const start = this.previous().span.start;
		const name = this.consume("identifier", "Expected function name").value;
		this.consume("leftParen", "Expected function parameters");
		const params = this.parseParameters();
		this.consume("rightParen", "Expected end of function parameters");
		this.consume("colon", "Expected function return type");
		const returnType = this.parseTypeExpression();
		this.consume("leftBrace", "Expected function body");
		const body: PointCoreStatement[] = [];
		while (!this.check("rightBrace")) body.push(this.parseStatement());
		this.consume("rightBrace", "Expected end of function body");
		return { kind: "function", name, params, returnType, body, span: { start, end: this.previous().span.end } };
	}

	private parseTypeDeclaration(): PointCoreDeclaration {
		const start = this.previous().span.start;
		const name = this.consume("identifier", "Expected type name").value;
		this.consume("leftBrace", "Expected type body");
		const fields: PointCoreParameter[] = [];
		while (!this.check("rightBrace")) {
			fields.push(this.parseParameter());
		}
		this.consume("rightBrace", "Expected end of type body");
		return { kind: "type", name, fields, span: { start, end: this.previous().span.end } };
	}

	private parseStatement(): PointCoreStatement {
		if (this.matchKeyword("return")) {
			const start = this.previous().span.start;
			if (this.check("rightBrace")) return { kind: "return", span: { start, end: this.previous().span.end } };
			const value = this.parseExpression();
			return { kind: "return", value, span: { start, end: value.span?.end ?? this.previous().span.end } };
		}
		if (this.matchKeyword("if")) return this.parseIfStatement();
		if (this.checkKeyword("let") || this.checkKeyword("var")) return this.parseValueDeclaration();
		if (this.check("identifier") && (this.checkNext("equals") || this.checkNext("plusEquals"))) return this.parseAssignment();
		const value = this.parseExpression();
		return { kind: "expression", value, span: value.span };
	}

	private parseAssignment(): PointCoreStatement {
		const name = this.consume("identifier", "Expected assignment target");
		const operator = this.match("plusEquals") ? "+=" : "=";
		if (operator === "=") this.consume("equals", "Expected assignment operator");
		const value = this.parseExpression();
		return {
			kind: "assignment",
			name: name.value,
			operator,
			value,
			span: { start: name.span.start, end: value.span?.end ?? this.previous().span.end },
		};
	}

	private parseIfStatement(): PointCoreStatement {
		const start = this.previous().span.start;
		const condition = this.parseExpression();
		const thenBody = this.parseBlockStatements("Expected if body");
		let elseBody: PointCoreStatement[] = [];
		if (this.matchKeyword("else")) {
			elseBody = this.parseBlockStatements("Expected else body");
		}
		return {
			kind: "if",
			condition,
			thenBody,
			elseBody,
			span: { start, end: this.previous().span.end },
		};
	}

	private parseBlockStatements(message: string): PointCoreStatement[] {
		this.consume("leftBrace", message);
		const statements: PointCoreStatement[] = [];
		while (!this.check("rightBrace")) statements.push(this.parseStatement());
		this.consume("rightBrace", "Expected end of block");
		return statements;
	}

	private parseParameters(): PointCoreParameter[] {
		const params: PointCoreParameter[] = [];
		if (this.check("rightParen")) return params;
		do {
			params.push(this.parseParameter());
		} while (this.match("comma"));
		return params;
	}

	private parseParameter(): PointCoreParameter {
		const name = this.consume("identifier", "Expected parameter name");
		this.consume("colon", `Expected type annotation for ${name.value}`);
		const type = this.parseTypeExpression();
		return { name: name.value, type, span: { start: name.span.start, end: type.span?.end ?? name.span.end } };
	}

	private parseTypeExpression(): PointCoreTypeExpression {
		const token = this.consume("identifier", "Expected type name");
		const args: PointCoreTypeExpression[] = [];
		if (this.match("less")) {
			do {
				args.push(this.parseTypeExpression());
			} while (this.match("comma"));
			this.consume("greater", "Expected end of type arguments");
		}
		return { kind: "typeRef", name: token.value, args, span: { start: token.span.start, end: this.previous().span.end } };
	}

	private parseExpression(): PointCoreExpression {
		return this.parseBinaryExpression(0);
	}

	private parseBinaryExpression(minPrecedence: number): PointCoreExpression {
		let left = this.parsePrimaryExpression();
		while (true) {
			const operator = this.peekBinaryOperator();
			if (!operator) break;
			const precedence = precedenceFor(operator);
			if (precedence < minPrecedence) break;
			this.advance();
			const right = this.parseBinaryExpression(precedence + 1);
			left = {
				kind: "binary",
				operator,
				left,
				right,
				span: { start: left.span?.start ?? this.previous().span.start, end: right.span?.end ?? this.previous().span.end },
			};
		}
		return left;
	}

	private parsePrimaryExpression(): PointCoreExpression {
		let expression = this.parseAtomExpression();
		while (this.match("dot")) {
			const name = this.consume("identifier", "Expected property name");
			expression = {
				kind: "property",
				target: expression,
				name: name.value,
				span: { start: expression.span?.start ?? name.span.start, end: name.span.end },
			};
		}
		return expression;
	}

	private parseAtomExpression(): PointCoreExpression {
		if (this.check("string")) {
			const token = this.advance();
			return { kind: "literal", value: token.value, span: token.span };
		}
		if (this.check("number")) {
			const token = this.advance();
			return { kind: "literal", value: Number(token.value), span: token.span };
		}
		if (this.match("leftParen")) {
			const start = this.previous().span.start;
			const expression = this.parseExpression();
			this.consume("rightParen", "Expected end of grouped expression");
			return { ...expression, span: { start, end: this.previous().span.end } };
		}
		if (this.match("leftBracket")) return this.parseListExpression();
		if (this.match("leftBrace")) return this.parseRecordExpression();
		const identifier = this.consume("identifier", "Expected expression");
		if (identifier.value === "true") return { kind: "literal", value: true, span: identifier.span };
		if (identifier.value === "false") return { kind: "literal", value: false, span: identifier.span };
		if (this.match("leftParen")) {
			const args: PointCoreExpression[] = [];
			if (!this.check("rightParen")) {
				do {
					args.push(this.parseExpression());
				} while (this.match("comma"));
			}
			this.consume("rightParen", "Expected end of call arguments");
			return {
				kind: "call",
				callee: identifier.value,
				args,
				span: { start: identifier.span.start, end: this.previous().span.end },
			};
		}
		return { kind: "identifier", name: identifier.value, span: identifier.span };
	}

	private parseListExpression(): PointCoreExpression {
		const start = this.previous().span.start;
		const items: PointCoreExpression[] = [];
		if (!this.check("rightBracket")) {
			do {
				items.push(this.parseExpression());
			} while (this.match("comma"));
		}
		this.consume("rightBracket", "Expected end of list");
		return { kind: "list", items, span: { start, end: this.previous().span.end } };
	}

	private parseRecordExpression(): PointCoreExpression {
		const start = this.previous().span.start;
		const fields: PointCoreRecordField[] = [];
		if (!this.check("rightBrace")) {
			do {
				const name = this.consume("identifier", "Expected record field name");
				this.consume("colon", `Expected value for record field ${name.value}`);
				const value = this.parseExpression();
				fields.push({
					name: name.value,
					value,
					span: { start: name.span.start, end: value.span?.end ?? name.span.end },
				});
			} while (this.match("comma"));
		}
		this.consume("rightBrace", "Expected end of record");
		return { kind: "record", fields, span: { start, end: this.previous().span.end } };
	}

	private peekBinaryOperator(): PointCoreBinaryOperator | null {
		const token = this.peek();
		if (token.type === "plus") return "+";
		if (token.type === "minus") return "-";
		if (token.type === "star") return "*";
		if (token.type === "slash") return "/";
		if (token.type === "equalsEquals") return "==";
		if (token.type === "bangEquals") return "!=";
		if (token.type === "less") return "<";
		if (token.type === "lessEquals") return "<=";
		if (token.type === "greater") return ">";
		if (token.type === "greaterEquals") return ">=";
		if (token.type === "identifier" && (token.value === "and" || token.value === "or")) return token.value;
		return null;
	}

	private consumeKeyword(keyword: string) {
		const token = this.consume("identifier", `Expected ${keyword}`);
		if (token.value !== keyword) throw new PointCoreParserError(`Expected ${keyword}`, token);
		return token;
	}

	private matchKeyword(keyword: string) {
		if (!this.checkKeyword(keyword)) return false;
		this.advance();
		return true;
	}

	private checkKeyword(keyword: string) {
		return this.check("identifier") && this.peek().value === keyword;
	}

	private consume(type: PointCoreTokenType, message: string) {
		if (this.check(type)) return this.advance();
		throw new PointCoreParserError(message, this.peek());
	}

	private match(type: PointCoreTokenType) {
		if (!this.check(type)) return false;
		this.advance();
		return true;
	}

	private check(type: PointCoreTokenType) {
		return this.peek().type === type;
	}

	private checkNext(type: PointCoreTokenType) {
		return this.peek(1).type === type;
	}

	private advance() {
		if (!this.check("eof")) this.current += 1;
		return this.previous();
	}

	private peek(offset = 0) {
		return this.tokens[this.current + offset] ?? this.tokens[this.tokens.length - 1]!;
	}

	private previous() {
		return this.tokens[this.current - 1] ?? this.tokens[0]!;
	}
}

function precedenceFor(operator: PointCoreBinaryOperator): number {
	if (operator === "or") return 1;
	if (operator === "and") return 2;
	if (operator === "==" || operator === "!=") return 3;
	if (operator === "<" || operator === "<=" || operator === ">" || operator === ">=") return 4;
	if (operator === "+" || operator === "-") return 5;
	return 6;
}

export function mergeSpans(start: PointSourceSpan, end: PointSourceSpan): PointSourceSpan {
	return { start: start.start, end: end.end };
}
