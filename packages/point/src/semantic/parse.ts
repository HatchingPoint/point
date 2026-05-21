import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticActionDeclaration,
	PointSemanticActionStatement,
	PointSemanticCalculationDeclaration,
	PointSemanticCalculationStatement,
	PointSemanticCommandDeclaration,
	PointSemanticCommandStatement,
	PointSemanticDeclaration,
	PointSemanticExternalDeclaration,
	PointSemanticExternalFunction,
	PointSemanticField,
	PointSemanticLabelDeclaration,
	PointSemanticLabelStatement,
	PointSemanticMutationStatement,
	PointSemanticOutputBinding,
	PointSemanticPolicyDeclaration,
	PointSemanticPolicyStatement,
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticRouteDeclaration,
	PointSemanticRouteStatement,
	PointSemanticRuleDeclaration,
	PointSemanticRuleStatement,
	PointSemanticUseDeclaration,
	PointSemanticViewDeclaration,
	PointSemanticViewStatement,
	PointSemanticPageDeclaration,
	PointSemanticWorkflowDeclaration,
	PointSemanticWorkflowStatement,
	PointSemanticBinding,
} from "./ast.ts";
import {
	buildExpressionContext,
	lineSpan,
	parseSemanticExpression,
	parseSemanticTypeExpression,
} from "./expressions.ts";
import { collectSemanticCallables } from "./callables.ts";

function parseLineExpression(
	expressionSource: string,
	context: ReturnType<typeof buildExpressionContext>,
	fileSource: string,
	lineNumber: number,
) {
	return parseSemanticExpression(expressionSource, context, lineSpan(fileSource, lineNumber));
}

export function isPointSemanticAstEnabled(): boolean {
	return process.env.POINT_LEGACY_LOWER !== "1";
}

/** Parse semantic `.point` source to semantic AST. */
export function parsePointSourceV2(source: string): PointSemanticProgram {
	return parseSemanticSource(source);
}

export function parseSemanticSource(source: string): PointSemanticProgram {
	const lines = source.split(/\r?\n/);
	const records = new Map<string, Map<string, string>>();
	const callables = collectSemanticCallables(source);
	const uses: PointSemanticUseDeclaration[] = [];
	const declarations: PointSemanticDeclaration[] = [];
	let moduleName: string | undefined;
	let index = 0;

	while (index < lines.length) {
		const lineNumber = index + 1;
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) {
			index += 1;
			continue;
		}
		if (trimmed.startsWith("module ")) {
			moduleName = trimmed.slice("module ".length).trim();
			index += 1;
			continue;
		}
		if (trimmed.startsWith("use ")) {
			uses.push(parseUseDeclaration(trimmed, lineNumber));
			index += 1;
			continue;
		}
		if (trimmed.startsWith("record ")) {
			const parsed = parseRecord(lines, index, source, records);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("calculation ")) {
			const parsed = parseCalculation(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("rule ")) {
			const parsed = parseRule(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("label ")) {
			const parsed = parseLabel(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("external ")) {
			const parsed = parseExternal(lines, index, source);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("action ")) {
			const parsed = parseAction(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("policy ")) {
			const parsed = parsePolicy(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("view ")) {
			const parsed = parseView(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("page ")) {
			const parsed = parsePage(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("route ")) {
			const parsed = parseRoute(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("workflow ")) {
			const parsed = parseWorkflow(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("command ")) {
			const parsed = parseCommand(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		throw new Error(`Unknown semantic top-level declaration at ${lineNumber}: ${trimmed}`);
	}

	return {
		kind: "semanticProgram",
		module: moduleName,
		uses,
		declarations,
		span: lineSpan(source, 1),
	};
}

function parseUseDeclaration(line: string, lineNumber: number): PointSemanticUseDeclaration {
	const match = line.match(/^use\s+([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*)(?:\s+from\s+"([^"]+)")?$/);
	if (!match) throw new Error(`Invalid use declaration: ${line}`);
	return {
		kind: "use",
		moduleName: match[1] ?? "",
		from: match[2],
		span: lineSpanFromLine(lineNumber, line),
	};
}

function parseRecord(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
): { declaration: PointSemanticRecordDeclaration; next: number } {
	const lineNumber = start + 1;
	const name = (lines[start] ?? "").trim().slice("record ".length).trim();
	const fields: PointSemanticField[] = [];
	const fieldMap = new Map<string, string>();
	let index = start + 1;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed)) break;
		const colon = trimmed.indexOf(":");
		if (colon === -1) throw new Error(`Expected field type in record ${name}: ${trimmed}`);
		const label = trimmed.slice(0, colon).trim();
		fields.push({
			label,
			type: parseSemanticTypeExpression(trimmed.slice(colon + 1).trim()),
			span: lineSpan(source, index + 1),
		});
		fieldMap.set(label, toIdentifier(label));
	}
	records.set(toPascalCase(name), fieldMap);
	return {
		declaration: { kind: "record", name, fields, span: lineSpan(source, lineNumber) },
		next: index,
	};
}

function parseCalculation(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticCalculationDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("calculation ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "result", type: { kind: "typeRef", name: "Void", args: [] } };
	const statements: PointSemanticCalculationStatement[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			bindings.push(output.name);
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		const loop = line.match(/^for each (.+) in (.+)$/);
		if (loop) {
			const item = loop[1]?.trim() ?? "";
			const iterable = parseLineExpression(loop[2] ?? "", context, source, lineNumber);
			const loopBody: PointSemanticMutationStatement[] = [];
			const loopParamTypes = new Map(paramTypes);
			loopParamTypes.set(item, listItemType(loop[2] ?? "", paramTypes));
			const loopBindings = [...bindings, item];
			while (body.lines[lineIndex + 1] && !isLoopBoundary(body.lines[lineIndex + 1]!)) {
				lineIndex += 1;
				const mutation = parseMutationStatement(
					body.lines[lineIndex]!,
					buildExpressionContext({ bindings: loopBindings, paramTypes: loopParamTypes, recordFields: records, callables }),
					source,
					body.lineNumbers[lineIndex] ?? lineNumber,
				);
				if (mutation) loopBody.push(mutation);
			}
			statements.push({ kind: "forEach", item, iterable, body: loopBody, span: lineSpan(source, lineNumber) });
			continue;
		}
		const isExpr = line.match(/^(.+) is (.+)$/);
		if (isExpr) {
			statements.push({
				kind: "assignIs",
				name: isExpr[1]?.trim() ?? "",
				value: parseLineExpression(isExpr[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const startsAt = line.match(/^(.+) starts at (.+)$/);
		if (startsAt) {
			statements.push({
				kind: "startsAt",
				name: startsAt[1]?.trim() ?? "",
				value: parseLineExpression(startsAt[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const startsAs = line.match(/^(.+) starts as (.+)$/);
		if (startsAs) {
			statements.push({
				kind: "startsAs",
				name: startsAs[1]?.trim() ?? "",
				value: parseLineExpression(startsAs[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const mutation = parseMutationStatement(line, context, source, lineNumber);
		if (mutation) {
			statements.push(mutation);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown calculation statement: ${line}`);
	}

	return {
		declaration: {
			kind: "calculation",
			name,
			inputs,
			output,
			body: statements,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseRule(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticRuleDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("rule ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "result", type: { kind: "typeRef", name: "Void", args: [] } };
	const statements: PointSemanticRuleStatement[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			bindings.push(output.name);
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		const startsAt = line.match(/^(.+) starts at (.+)$/);
		if (startsAt) {
			statements.push({
				kind: "startsAt",
				name: startsAt[1]?.trim() ?? "",
				value: parseLineExpression(startsAt[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const addWhen = line.match(/^add (.+) when (.+)$/);
		if (addWhen) {
			statements.push({
				kind: "addWhen",
				amount: parseLineExpression(addWhen[1] ?? "", context, source, lineNumber),
				condition: parseLineExpression(addWhen[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const loop = line.match(/^for each (.+) in (.+)$/);
		if (loop) {
			const item = loop[1]?.trim() ?? "";
			const iterable = parseLineExpression(loop[2] ?? "", context, source, lineNumber);
			const loopBody: PointSemanticMutationStatement[] = [];
			const loopParamTypes = new Map(paramTypes);
			loopParamTypes.set(item, listItemType(loop[2] ?? "", paramTypes));
			const loopBindings = [...bindings, item];
			while (body.lines[lineIndex + 1] && !isLoopBoundary(body.lines[lineIndex + 1]!)) {
				lineIndex += 1;
				const mutation = parseMutationStatement(body.lines[lineIndex]!, buildExpressionContext({ bindings: loopBindings, paramTypes: loopParamTypes, recordFields: records, callables }), source, body.lineNumbers[lineIndex] ?? lineNumber);
				if (mutation) loopBody.push(mutation);
			}
			statements.push({ kind: "forEach", item, iterable, body: loopBody, span: lineSpan(source, lineNumber) });
			continue;
		}
		const mutation = parseMutationStatement(line, context, source, lineNumber);
		if (mutation) {
			statements.push(mutation);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown rule statement: ${line}`);
	}

	return {
		declaration: { kind: "rule", name, inputs, output, body: statements, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parseLabel(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticLabelDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("label ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "result", type: { kind: "typeRef", name: "Text", args: [] } };
	const statements: PointSemanticLabelStatement[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		const whenReturn = line.match(/^when (.+) return (.+)$/);
		if (whenReturn) {
			statements.push({
				kind: "whenReturn",
				condition: parseLineExpression(whenReturn[1] ?? "", context, source, lineNumber),
				value: parseLineExpression(whenReturn[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("otherwise return ")) {
			statements.push({
				kind: "otherwiseReturn",
				value: parseLineExpression(line.slice("otherwise return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown label statement: ${line}`);
	}

	return {
		declaration: { kind: "label", name, inputs, output, body: statements, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parseExternal(lines: string[], start: number, source: string): { declaration: PointSemanticExternalDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("external ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const functions: PointSemanticExternalFunction[] = [];
	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		const match = line.match(/^(.+)\((.*)\):\s*(.+?)\s+from\s+"([^"]+)"(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/);
		if (!match) throw new Error(`Unknown external declaration: ${line}`);
		functions.push({
			label: match[1]?.trim() ?? "",
			params: (match[2] ?? "")
				.split(",")
				.map((part) => part.trim())
				.filter(Boolean)
				.map((part) => parseInputBinding(part, source, lineNumber)),
			returnType: parseSemanticTypeExpression(match[3] ?? "Void"),
			from: match[4] ?? "",
			importAs: match[5],
			span: lineSpan(source, lineNumber),
		});
	}
	return {
		declaration: { kind: "external", name, functions, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parseAction(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticActionDeclaration; next: number } {
	return parseCallableBlock("action", lines, start, source, records, callables) as { declaration: PointSemanticActionDeclaration; next: number };
}

function parsePolicy(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticPolicyDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("policy ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	const statements: PointSemanticPolicyStatement[] = [];
	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		if (line.startsWith("allow ")) {
			statements.push({ kind: "allow", condition: parseLineExpression(line.slice("allow ".length), context, source, lineNumber), span: lineSpan(source, lineNumber) });
			continue;
		}
		if (line.startsWith("deny ")) {
			statements.push({ kind: "deny", condition: parseLineExpression(line.slice("deny ".length), context, source, lineNumber), span: lineSpan(source, lineNumber) });
			continue;
		}
		if (line.startsWith("require ")) {
			statements.push({ kind: "require", condition: parseLineExpression(line.slice("require ".length), context, source, lineNumber), span: lineSpan(source, lineNumber) });
			continue;
		}
		throw new Error(`Unknown policy statement: ${line}`);
	}
	return { declaration: { kind: "policy", name, inputs, body: statements, span: lineSpan(source, start + 1) }, next: body.next };
}

function parseView(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticViewDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("view ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "page", type: { kind: "typeRef", name: "Page", args: [] } };
	const statements: PointSemanticViewStatement[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		const whenRender = line.match(/^when (.+) render (.+)$/);
		if (whenRender) {
			statements.push({
				kind: "whenRender",
				condition: parseLineExpression(whenRender[1] ?? "", context, source, lineNumber),
				value: parseLineExpression(whenRender[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("render ")) {
			statements.push({
				kind: "render",
				value: parseLineExpression(line.slice("render ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown view statement: ${line}`);
	}

	return {
		declaration: { kind: "view", name, inputs, output, body: statements, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parsePage(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticPageDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("page ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let title: PointSemanticPageDeclaration["title"] | undefined;
	let description: PointSemanticPageDeclaration["description"];
	let main: PointSemanticPageDeclaration["main"] | undefined;

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		if (line.startsWith("title ")) {
			title = parseLineExpression(line.slice("title ".length), context, source, lineNumber);
			continue;
		}
		if (line.startsWith("description ")) {
			description = parseLineExpression(line.slice("description ".length), context, source, lineNumber);
			continue;
		}
		if (line.startsWith("main render ")) {
			main = parseLineExpression(line.slice("main render ".length), context, source, lineNumber);
			continue;
		}
		throw new Error(`Unknown page statement: ${line}`);
	}

	if (!title) throw new Error(`Page ${name} requires a title`);
	if (!main) throw new Error(`Page ${name} requires main render`);

	return {
		declaration: { kind: "page", name, inputs, title, description, main, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parseRoute(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticRouteDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("route ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	let method = "GET";
	let path = "/";
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "response", type: { kind: "typeRef", name: "Text", args: [] } };
	const statements: PointSemanticRouteStatement[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("method ")) {
			method = line.slice("method ".length).trim();
			continue;
		}
		if (line.startsWith("path ")) {
			path = line.slice("path ".length).trim().replace(/^"|"$/g, "");
			continue;
		}
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			bindings.push(output.name);
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		if (line.startsWith("return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown route statement: ${line}`);
	}

	return {
		declaration: {
			kind: "route",
			name,
			method,
			path,
			inputs,
			output,
			body: statements,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseWorkflow(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticWorkflowDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("workflow ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "result", type: { kind: "typeRef", name: "Void", args: [] } };
	const statements: PointSemanticWorkflowStatement[] = [];
	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			bindings.push(output.name);
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		const step = line.match(/^step (.+) is (.+)$/);
		if (step) {
			const stepName = step[1]?.trim() ?? "";
			statements.push({
				kind: "step",
				name: stepName,
				value: parseLineExpression(step[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			bindings.push(stepName);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown workflow statement: ${line}`);
	}
	return { declaration: { kind: "workflow", name, inputs, output, body: statements, span: lineSpan(source, start + 1) }, next: body.next };
}

function parseCommand(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticCommandDeclaration; next: number } {
	const parsed = parseCallableBlock("command", lines, start, source, records, callables) as { declaration: PointSemanticCommandDeclaration; next: number };
	return parsed;
}

function parseCallableBlock(
	kind: "action" | "command",
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
) {
	const name = (lines[start] ?? "").trim().slice(`${kind} `.length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const parsed = parseSimpleCallableBody(body, source, start, records, callables);
	if (kind === "command") {
		const commandStatements: PointSemanticCommandStatement[] = parsed.statements
			.filter((statement): statement is PointSemanticActionStatement => statement.kind === "return")
			.map((statement) => ({ kind: "return", value: statement.value, span: statement.span }));
		return {
			declaration: {
				kind: "command",
				name,
				inputs: parsed.inputs,
				output: parsed.output,
				body: commandStatements,
				span: lineSpan(source, start + 1),
			},
			next: body.next,
		};
	}
	return {
		declaration: {
			kind: "action",
			name,
			inputs: parsed.inputs,
			output: parsed.output,
			touches: parsed.touches,
			body: parsed.statements,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseSimpleCallableBody(
	body: SemanticBody,
	source: string,
	start: number,
	records: Map<string, Map<string, string>>,
	callables: string[],
) {
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "result", type: { kind: "typeRef", name: "Void", args: [] } };
	const touches: string[] = [];
	const statements: PointSemanticActionStatement[] = [];
	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("input ")) {
			const binding = parseInputBinding(line.slice("input ".length), source, lineNumber);
			inputs.push(binding);
			paramTypes.set(binding.label, typeLabel(binding.type));
			bindings.push(binding.label);
			continue;
		}
		if (line.startsWith("output ")) {
			output = parseOutputBinding(line.slice("output ".length));
			bindings.push(output.name);
			continue;
		}
		if (line.startsWith("touches ")) {
			touches.push(...line.slice("touches ".length).split(",").map((effect) => effect.trim()).filter(Boolean));
			continue;
		}
		const context = buildExpressionContext({ bindings, paramTypes, recordFields: records, callables });
		if (line.startsWith("return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown callable statement: ${line}`);
	}
	return { inputs, output, touches, statements };
}

function parseMutationStatement(
	line: string,
	context: ReturnType<typeof buildExpressionContext>,
	fileSource: string,
	lineNumber: number,
): PointSemanticMutationStatement | null {
	const addTo = line.match(/^add (.+) to (.+)$/);
	if (addTo) {
		return {
			kind: "addTo",
			amount: parseLineExpression(addTo[1] ?? "", context, fileSource, lineNumber),
			target: addTo[2]?.trim() ?? "",
			span: lineSpan(fileSource, lineNumber),
		};
	}
	const subtractFrom = line.match(/^subtract (.+) from (.+)$/);
	if (subtractFrom) {
		return {
			kind: "subtractFrom",
			amount: parseLineExpression(subtractFrom[1] ?? "", context, fileSource, lineNumber),
			target: subtractFrom[2]?.trim() ?? "",
			span: lineSpan(fileSource, lineNumber),
		};
	}
	const setTo = line.match(/^set (.+) to (.+)$/);
	if (setTo) {
		return {
			kind: "setTo",
			target: setTo[1]?.trim() ?? "",
			value: parseLineExpression(setTo[2] ?? "", context, fileSource, lineNumber),
			span: lineSpan(fileSource, lineNumber),
		};
	}
	return null;
}

function parseInputBinding(source: string, _fileSource: string, lineNumber: number): PointSemanticBinding {
	const colon = source.indexOf(":");
	if (colon === -1) throw new Error(`Expected typed binding: ${source}`);
	return {
		label: source.slice(0, colon).trim(),
		type: parseSemanticTypeExpression(source.slice(colon + 1).trim()),
		span: lineSpanFromLine(lineNumber, source),
	};
}

function parseOutputBinding(source: string): PointSemanticOutputBinding {
	const colon = source.indexOf(":");
	if (colon !== -1) {
		return {
			name: source.slice(0, colon).trim(),
			type: parseSemanticTypeExpression(source.slice(colon + 1).trim()),
		};
	}
	return { name: "result", type: parseSemanticTypeExpression(source.trim()) };
}

interface SemanticBody {
	lines: string[];
	lineNumbers: number[];
	next: number;
}

function collectSemanticBody(lines: string[], start: number): SemanticBody {
	const body: string[] = [];
	const lineNumbers: number[] = [];
	let index = start;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed)) break;
		body.push(trimmed);
		lineNumbers.push(index + 1);
	}
	return { lines: body, lineNumbers, next: index };
}

function isSemanticTopLevel(line: string): boolean {
	return /^(module|use|record|calculation|rule|label|external|action|policy|view|page|route|workflow|command)\s+/.test(line);
}

function isLoopBoundary(line: string): boolean {
	return (
		line.startsWith("input ") ||
		line.startsWith("output ") ||
		line.startsWith("return ") ||
		line.startsWith("for each ") ||
		/^(.+) starts (at|as) (.+)$/.test(line) ||
		isSemanticTopLevel(line)
	);
}

function typeLabel(type: { kind: "typeRef"; name: string; args: unknown[] }): string {
	if (type.name === "List" && type.args[0]) {
		return `List<${typeLabel(type.args[0] as { kind: "typeRef"; name: string; args: unknown[] })}>`;
	}
	if (type.name === "Maybe" && type.args[0]) {
		return `Maybe<${typeLabel(type.args[0] as { kind: "typeRef"; name: string; args: unknown[] })}>`;
	}
	const primitives = new Set(["Text", "Int", "Float", "Bool", "Void", "Maybe", "Or", "Error", "Page"]);
	if (primitives.has(type.name)) return type.name;
	return toPascalCase(type.name);
}

function listItemType(source: string, paramTypes: Map<string, string>): string {
	const trimmed = source.trim();
	for (const [label, type] of paramTypes) {
		if (trimmed === label && type.startsWith("List<")) return type.slice("List<".length, -1);
	}
	return "Unknown";
}

function toPascalCase(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join("");
}

function toIdentifier(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word, index) => (index === 0 ? word.toLowerCase() : toPascalCase(word))).join("");
}

function lineSpanFromLine(lineNumber: number, line: string): PointSourceSpan {
	return {
		start: { line: lineNumber, column: 1, offset: 0 },
		end: { line: lineNumber, column: line.length + 1, offset: line.length },
	};
}
