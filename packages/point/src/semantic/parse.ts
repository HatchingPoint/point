import type { PointSourceSpan } from "../core/ast.ts";
import { parseStylePrefix, isPointStyleModifier } from "../core/ui-style.ts";
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
	PointSemanticExpression,
	PointSemanticField,
	PointSemanticLabelDeclaration,
	PointSemanticLabelStatement,
	PointSemanticMiddlewareDeclaration,
	PointSemanticMiddlewareStatement,
	PointSemanticMutationStatement,
	PointSemanticOutputBinding,
	PointSemanticPolicyDeclaration,
	PointSemanticGuardDeclaration,
	PointSemanticPolicyStatement,
	PointSemanticProgram,
	PointSemanticThemeDeclaration,
	PointSemanticRecordDeclaration,
	PointSemanticVariantDeclaration,
	PointSemanticVariantCase,
	PointSemanticRouteDeclaration,
	PointSemanticRouteStatement,
	PointSemanticScheduleDeclaration,
	PointSemanticScheduleInterval,
	PointSemanticScheduleIntervalUnit,
	PointSemanticPromptDeclaration,
	PointSemanticStreamRouteDeclaration,
	PointSemanticStreamRouteEvent,
	PointSemanticStreamRouteHandler,
	PointSemanticRuleDeclaration,
	PointSemanticRuleStatement,
	PointSemanticUseDeclaration,
	PointSemanticViewDeclaration,
	PointSemanticViewStatement,
	PointSemanticLayoutDeclaration,
	PointSemanticLayoutSlot,
	PointSemanticNavigationDeclaration,
	PointSemanticNavigationRoute,
	PointSemanticPageDeclaration,
	PointSemanticWorkflowDeclaration,
	PointSemanticWorkflowStatement,
	PointSemanticWorkflowStepOptions,
	PointSemanticPipelineDeclaration,
	PointSemanticPipelineStatement,
	PointSemanticSessionDeclaration,
	PointSemanticBinding,
} from "./ast.ts";
import {
	buildExpressionContext,
	lineSpan,
	parseSemanticExpression,
	parseSemanticTypeExpression,
} from "./expressions.ts";
import { collectSemanticCallables, type CollectSemanticCallablesOptions } from "./callables.ts";

export interface ParseSemanticSourceOptions {
	resolveUseSource?: CollectSemanticCallablesOptions["resolveUseSource"];
}
import { toIdentifier } from "./naming.ts";

type SemanticVariants = Map<string, Map<string, Map<string, string>>>;

function parseLineExpression(
	expressionSource: string,
	context: ReturnType<typeof expressionContext>,
	fileSource: string,
	lineNumber: number,
) {
	return parseSemanticExpression(expressionSource, context, lineSpan(fileSource, lineNumber));
}

function parseWhenCondition(
	conditionSource: string,
	context: ReturnType<typeof expressionContext>,
	fileSource: string,
	lineNumber: number,
): PointSemanticExpression {
	const trimmed = conditionSource.trim();
	const presentMatch = trimmed.match(/^(.+)\s+present$/);
	if (presentMatch) {
		return {
			kind: "binary",
			operator: "!=",
			left: parseLineExpression(presentMatch[1] ?? "", context, fileSource, lineNumber),
			right: { kind: "literal", value: null, span: lineSpan(fileSource, lineNumber) },
			span: lineSpan(fileSource, lineNumber),
		};
	}
	const noneMatch = trimmed.match(/^(.+)\s+is\s+none$/);
	if (noneMatch) {
		return {
			kind: "binary",
			operator: "==",
			left: parseLineExpression(noneMatch[1] ?? "", context, fileSource, lineNumber),
			right: { kind: "literal", value: null, span: lineSpan(fileSource, lineNumber) },
			span: lineSpan(fileSource, lineNumber),
		};
	}
	return parseLineExpression(conditionSource, context, fileSource, lineNumber);
}

export function isPointSemanticAstEnabled(): boolean {
	return process.env.POINT_LEGACY_LOWER !== "1";
}

/** Parse semantic `.point` source to semantic AST. */
export function parsePointSourceV2(source: string, options?: ParseSemanticSourceOptions): PointSemanticProgram {
	return parseSemanticSource(source, options);
}

export function parseSemanticSource(source: string, options?: ParseSemanticSourceOptions): PointSemanticProgram {
	const lines = source.split(/\r?\n/);
	const records = new Map<string, Map<string, string>>();
	const variants = new Map<string, Map<string, Map<string, string>>>();
	const callables = collectSemanticCallables(source, { resolveUseSource: options?.resolveUseSource });
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
		if (trimmed.startsWith("theme ")) {
			const parsed = parseTheme(lines, index, source);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("record ")) {
			const parsed = parseRecord(lines, index, source, records);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("variant ")) {
			const parsed = parseVariant(lines, index, source, variants);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("calculation ")) {
			const parsed = parseCalculation(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("rule ")) {
			const parsed = parseRule(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("label ")) {
			const parsed = parseLabel(lines, index, source, records, variants, callables);
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
			const parsed = parseAction(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("policy ")) {
			const parsed = parsePolicy(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("guard ")) {
			const parsed = parseGuard(lines, index, source);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("view ")) {
			const parsed = parseView(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("layout ")) {
			const parsed = parseLayout(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("navigation ")) {
			const parsed = parseNavigation(lines, index, source);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("page ")) {
			const parsed = parsePage(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("middleware ")) {
			const parsed = parseMiddleware(lines, index, source, records, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("stream route ")) {
			const parsed = parseStreamRoute(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("route ")) {
			const parsed = parseRoute(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("workflow ")) {
			const parsed = parseWorkflow(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("pipeline ")) {
			const parsed = parsePipeline(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("session ")) {
			const parsed = parseSession(lines, index, source);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("command ")) {
			const parsed = parseCommand(lines, index, source, records, variants, callables);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("schedule ")) {
			const parsed = parseSchedule(lines, index, source);
			declarations.push(parsed.declaration);
			index = parsed.next;
			continue;
		}
		if (trimmed.startsWith("prompt ")) {
			const parsed = parsePrompt(lines, index, source);
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

function parseTheme(
	lines: string[],
	start: number,
	source: string,
): { declaration: PointSemanticThemeDeclaration; next: number } {
	const header = (lines[start] ?? "").trim();
	const headerMatch = header.match(/^theme\s+(.+)$/);
	if (!headerMatch) throw new Error(`Invalid theme declaration: ${header}`);
	const name = headerMatch[1] ?? "";
	const settings: Pick<PointSemanticThemeDeclaration, "accent" | "density" | "radius"> = {};
	let index = start + 1;
	while (index < lines.length) {
		const lineNumber = index + 1;
		const line = (lines[index] ?? "").trim();
		if (!line) {
			index += 1;
			continue;
		}
		if (!line.startsWith("  ") && line.length > 0 && !/^\s/.test(lines[index] ?? "")) break;
		const trimmed = line.trim();
		const settingMatch = trimmed.match(/^(accent|density|radius)\s+([a-z]+)$/);
		if (!settingMatch) throw new Error(`Unknown theme setting at ${lineNumber}: ${trimmed}`);
		const key = settingMatch[1] as "accent" | "density" | "radius";
		settings[key] = settingMatch[2] ?? "";
		index += 1;
	}
	return {
		declaration: {
			kind: "theme",
			name,
			...settings,
			span: lineSpan(source, start + 1),
		},
		next: index,
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

function parseVariant(
	lines: string[],
	start: number,
	source: string,
	variants: SemanticVariants,
): { declaration: PointSemanticVariantDeclaration; next: number } {
	const lineNumber = start + 1;
	const name = (lines[start] ?? "").trim().slice("variant ".length).trim();
	const cases: PointSemanticVariantCase[] = [];
	const caseMap = new Map<string, Map<string, string>>();
	let index = start + 1;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed)) break;
		const parsed = parseVariantCaseLine(trimmed, source, index + 1);
		cases.push(parsed);
		const fieldMap = new Map<string, string>();
		for (const field of parsed.fields) fieldMap.set(field.label, toIdentifier(field.label));
		caseMap.set(toPascalCase(parsed.label), fieldMap);
	}
	variants.set(toPascalCase(name), caseMap);
	return {
		declaration: { kind: "variant", name, cases, span: lineSpan(source, lineNumber) },
		next: index,
	};
}

function parseVariantCaseLine(line: string, source: string, lineNumber: number): PointSemanticVariantCase {
	const withIndex = line.indexOf(" with ");
	if (withIndex === -1) {
		return { label: toPascalCase(line.trim()), fields: [], span: lineSpan(source, lineNumber) };
	}
	const label = toPascalCase(line.slice(0, withIndex).trim());
	const payloadSource = line.slice(withIndex + " with ".length);
	const fieldParts = splitTopLevelPayloadFields(payloadSource);
	const fields: PointSemanticField[] = fieldParts.map((part) => {
		const colon = part.indexOf(":");
		if (colon === -1) throw new Error(`Expected field type in variant case ${label}: ${part}`);
		return {
			label: part.slice(0, colon).trim(),
			type: parseSemanticTypeExpression(part.slice(colon + 1).trim()),
			span: lineSpan(source, lineNumber),
		};
	});
	return { label, fields, span: lineSpan(source, lineNumber) };
}

function splitTopLevelPayloadFields(source: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let quote: '"' | null = null;
	let current = "";
	const separator = " and ";
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

function allVariantCases(variants?: SemanticVariants): Map<string, Map<string, string>> {
	const variantCases = new Map<string, Map<string, string>>();
	for (const cases of variants?.values() ?? []) {
		for (const [caseLabel, fields] of cases) {
			variantCases.set(toPascalCase(caseLabel), fields);
		}
	}
	return variantCases;
}

function expressionContext(options: {
	bindings?: string[];
	paramTypes?: Map<string, string>;
	records?: Map<string, Map<string, string>>;
	variants?: SemanticVariants;
	callables?: string[];
	outputType?: string;
}): ReturnType<typeof buildExpressionContext> {
	const context = buildExpressionContext({
		bindings: options.bindings,
		paramTypes: options.paramTypes,
		recordFields: options.records,
		variantCases: allVariantCases(options.variants),
		callables: options.callables,
	});
	for (const [param, type] of options.paramTypes ?? []) {
		const cases = options.variants?.get(type);
		if (!cases) continue;
		for (const [caseLabel, fieldMap] of cases) {
			for (const fieldLabel of fieldMap.keys()) context.atoms.push(`${param}.${fieldLabel}`);
		}
	}
	if (options.outputType) {
		const cases = options.variants?.get(options.outputType);
		if (cases) {
			for (const caseLabel of cases.keys()) context.atoms.push(toPascalCase(caseLabel));
		}
	}
	return context;
}

function parseOnVariantReturn(
	line: string,
	context: ReturnType<typeof expressionContext>,
	source: string,
	lineNumber: number,
): PointSemanticLabelStatement | null {
	const match = line.match(/^on (.+?) return (.+)$/);
	if (!match) return null;
	const casePart = match[1]?.trim() ?? "";
	const valueSource = match[2]?.trim() ?? "";
	const withIndex = casePart.indexOf(" with ");
	if (withIndex === -1) {
		return {
			kind: "onVariantReturn",
			caseLabel: casePart,
			bindings: [],
			value: parseLineExpression(valueSource, context, source, lineNumber),
			span: lineSpan(source, lineNumber),
		};
	}
	const caseLabel = casePart.slice(0, withIndex).trim();
	const bindings = splitTopLevelPayloadFields(casePart.slice(withIndex + " with ".length));
	const narrowedContext =
		bindings.length > 0
			? {
					...context,
					bindings: [...context.bindings, ...bindings],
					atoms: [...context.atoms, ...bindings],
				}
			: context;
	return {
		kind: "onVariantReturn",
		caseLabel,
		bindings,
		value: parseLineExpression(valueSource, narrowedContext, source, lineNumber),
		span: lineSpan(source, lineNumber),
	};
}

function parseCalculation(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
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
		const context = expressionContext({
			bindings,
			paramTypes,
			records,
			variants,
			callables,
			outputType: typeLabel(output.type),
		});
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
					expressionContext({ bindings: loopBindings, paramTypes: loopParamTypes, records, variants, callables }),
					source,
					body.lineNumbers[lineIndex] ?? lineNumber,
				);
				if (mutation) loopBody.push(mutation);
			}
			statements.push({ kind: "forEach", item, iterable, body: loopBody, span: lineSpan(source, lineNumber) });
			continue;
		}
		const whenReturn = line.match(/^when (.+) return (.+)$/);
		if (whenReturn) {
			statements.push({
				kind: "whenReturn",
				condition: parseWhenCondition(whenReturn[1] ?? "", context, source, lineNumber),
				value: parseLineExpression(whenReturn[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("otherwise return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("otherwise return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
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
	variants: SemanticVariants,
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
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
				condition: parseWhenCondition(addWhen[2] ?? "", context, source, lineNumber),
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
				const mutation = parseMutationStatement(body.lines[lineIndex]!, expressionContext({ bindings: loopBindings, paramTypes: loopParamTypes, records, variants, callables }), source, body.lineNumbers[lineIndex] ?? lineNumber);
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
		const whenReturn = line.match(/^when (.+) return (.+)$/);
		if (whenReturn) {
			statements.push({
				kind: "whenReturn",
				condition: parseWhenCondition(whenReturn[1] ?? "", context, source, lineNumber),
				value: parseLineExpression(whenReturn[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("otherwise return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("otherwise return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
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
	variants: SemanticVariants,
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		const whenReturn = line.match(/^when (.+) return (.+)$/);
		if (whenReturn) {
			statements.push({
				kind: "whenReturn",
				condition: parseWhenCondition(whenReturn[1] ?? "", context, source, lineNumber),
				value: parseLineExpression(whenReturn[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const onVariantReturn = parseOnVariantReturn(line, context, source, lineNumber);
		if (onVariantReturn) {
			statements.push(onVariantReturn);
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
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticActionDeclaration; next: number } {
	return parseCallableBlock("action", lines, start, source, records, variants, callables) as { declaration: PointSemanticActionDeclaration; next: number };
}

function parsePolicy(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
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

function parseGuard(
	lines: string[],
	start: number,
	source: string,
): { declaration: PointSemanticGuardDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("guard ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const patterns: string[] = [];
	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("allow ")) {
			patterns.push(parseGuardPattern(line.slice("allow ".length), source, lineNumber));
			continue;
		}
		throw new Error(`Unknown guard statement: ${line}`);
	}
	return { declaration: { kind: "guard", name, patterns, span: lineSpan(source, start + 1) }, next: body.next };
}

function parseGuardPattern(raw: string, source: string, lineNumber: number): string {
	const trimmed = raw.trim();
	if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
		try {
			return JSON.parse(trimmed) as string;
		} catch {
			throw new Error(`Invalid guard path pattern at ${lineNumber}:1`);
		}
	}
	if (!trimmed) throw new Error(`Guard path pattern required at ${lineNumber}:1`);
	return trimmed;
}

function parseStyledRender(
	rest: string,
	context: ReturnType<typeof expressionContext>,
	source: string,
	lineNumber: number,
): { className?: string; style?: string[]; value: PointSemanticExpression } {
	const classMatch = rest.match(/^class "([^"]+)" (.+)$/);
	if (classMatch) {
		return {
			className: classMatch[1],
			value: parseLineExpression(classMatch[2] ?? "", context, source, lineNumber),
		};
	}
	const { style, remainder } = parseStylePrefix(rest);
	const unknownStringRender = remainder.match(/^([a-z]+) "([^"]*)"$/);
	if (unknownStringRender && !isPointStyleModifier(unknownStringRender[1] ?? "")) {
		style.push(unknownStringRender[1] ?? "");
		return {
			style: style.length > 0 ? style : undefined,
			value: parseLineExpression(`"${unknownStringRender[2] ?? ""}"`, context, source, lineNumber),
		};
	}
	return {
		style: style.length > 0 ? style : undefined,
		value: parseLineExpression(remainder, context, source, lineNumber),
	};
}

function parseDataLoadStateRender(
	state: "loading" | "error" | "empty" | "connecting" | "disconnected",
	rest: string,
	context: ReturnType<typeof expressionContext>,
	source: string,
	lineNumber: number,
): { className?: string; style?: string[]; value: PointSemanticExpression } {
	return parseStyledRender(rest, context, source, lineNumber);
}

function parseFormStyleLine(rest: string): string[] | undefined {
	const { style, remainder } = parseStylePrefix(rest);
	if (remainder.trim()) throw new Error(`Unknown form style modifier: ${remainder.trim()}`);
	return style.length > 0 ? style : undefined;
}

function styledRenderFields(render: { className?: string; style?: string[] }): { className?: string; style?: string[] } {
	return {
		...(render.className ? { className: render.className } : {}),
		...(render.style ? { style: render.style } : {}),
	};
}

function parseView(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticViewDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("view ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "page", type: { kind: "typeRef", name: "Page", args: [] } };
	const statements: PointSemanticViewStatement[] = [];
	let hasDataBinding = false;

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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		const loadFetchMatch = line.match(/^load data from fetch GET "(.+)" field ([a-z][a-z0-9 ]*) type (.+)$/i);
		if (loadFetchMatch) {
			statements.push({
				kind: "loadFetch",
				method: "GET",
				url: loadFetchMatch[1]?.trim() ?? "",
				field: loadFetchMatch[2]?.trim() ?? "",
				itemType: loadFetchMatch[3]?.trim() ?? "",
				span: lineSpan(source, lineNumber),
			});
			if (!hasDataBinding) {
				hasDataBinding = true;
				paramTypes.set("data", loadFetchMatch[3]?.trim() ?? "Text");
				bindings.push("data");
			}
			continue;
		}
		const loadDataMatch = line.match(/^load data from action (.+)$/);
		if (loadDataMatch) {
			statements.push({
				kind: "loadData",
				action: loadDataMatch[1]?.trim() ?? "",
				span: lineSpan(source, lineNumber),
			});
			if (!hasDataBinding) {
				hasDataBinding = true;
				paramTypes.set("data", "Text");
				bindings.push("data");
			}
			continue;
		}
		const onMountMatch = line.match(/^on mount call (.+)$/);
		if (onMountMatch) {
			statements.push({
				kind: "onMountCall",
				action: onMountMatch[1]?.trim() ?? "",
				span: lineSpan(source, lineNumber),
			});
			if (!hasDataBinding) {
				hasDataBinding = true;
				paramTypes.set("data", "Text");
				bindings.push("data");
			}
			continue;
		}
		const subscribePathMatch = line.match(/^subscribe to ("[^"]+")$/);
		if (subscribePathMatch) {
			const path = JSON.parse(subscribePathMatch[1] ?? '""') as string;
			statements.push({ kind: "streamSubscribePath", path, span: lineSpan(source, lineNumber) });
			if (!paramTypes.has("messages")) {
				paramTypes.set("messages", "List<Text>");
				bindings.push("messages");
			}
			if (!paramTypes.has("connected")) {
				paramTypes.set("connected", "Bool");
				bindings.push("connected");
			}
			continue;
		}
		const subscribeRouteMatch = line.match(/^subscribe to stream (.+)$/);
		if (subscribeRouteMatch) {
			statements.push({
				kind: "streamSubscribeRoute",
				routeName: subscribeRouteMatch[1]?.trim() ?? "",
				span: lineSpan(source, lineNumber),
			});
			if (!paramTypes.has("messages")) {
				paramTypes.set("messages", "List<Text>");
				bindings.push("messages");
			}
			if (!paramTypes.has("connected")) {
				paramTypes.set("connected", "Bool");
				bindings.push("connected");
			}
			continue;
		}
		const whenConnectingClass = line.match(/^when connecting render class "([^"]+)" (.+)$/);
		if (whenConnectingClass) {
			const render = parseDataLoadStateRender("connecting", whenConnectingClass[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenConnectingRender",
				value: render.value,
				className: whenConnectingClass[1],
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenConnecting = line.match(/^when connecting render (.+)$/);
		if (whenConnecting) {
			const render = parseDataLoadStateRender("connecting", whenConnecting[1] ?? "", context, source, lineNumber);
			statements.push({ kind: "whenConnectingRender", value: render.value, ...styledRenderFields(render), span: lineSpan(source, lineNumber) });
			continue;
		}
		const whenDisconnectedClass = line.match(/^when disconnected render class "([^"]+)" (.+)$/);
		if (whenDisconnectedClass) {
			const render = parseDataLoadStateRender("disconnected", whenDisconnectedClass[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenDisconnectedRender",
				value: render.value,
				className: whenDisconnectedClass[1],
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenDisconnected = line.match(/^when disconnected render (.+)$/);
		if (whenDisconnected) {
			const render = parseDataLoadStateRender("disconnected", whenDisconnected[1] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenDisconnectedRender",
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenLoadingClass = line.match(/^when loading render class "([^"]+)" (.+)$/);
		if (whenLoadingClass) {
			const render = parseDataLoadStateRender("loading", whenLoadingClass[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenLoadingRender",
				value: render.value,
				className: whenLoadingClass[1],
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenLoading = line.match(/^when loading render (.+)$/);
		if (whenLoading) {
			const render = parseDataLoadStateRender("loading", whenLoading[1] ?? "", context, source, lineNumber);
			statements.push({ kind: "whenLoadingRender", value: render.value, ...styledRenderFields(render), span: lineSpan(source, lineNumber) });
			continue;
		}
		const whenErrorClass = line.match(/^when error render class "([^"]+)" (.+)$/);
		if (whenErrorClass) {
			const render = parseDataLoadStateRender("error", whenErrorClass[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenErrorRender",
				value: render.value,
				className: whenErrorClass[1],
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenError = line.match(/^when error render (.+)$/);
		if (whenError) {
			const render = parseDataLoadStateRender("error", whenError[1] ?? "", context, source, lineNumber);
			statements.push({ kind: "whenErrorRender", value: render.value, ...styledRenderFields(render), span: lineSpan(source, lineNumber) });
			continue;
		}
		const whenEmptyClass = line.match(/^when empty render class "([^"]+)" (.+)$/);
		if (whenEmptyClass) {
			const render = parseDataLoadStateRender("empty", whenEmptyClass[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenEmptyRender",
				value: render.value,
				className: whenEmptyClass[1],
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenEmpty = line.match(/^when empty render (.+)$/);
		if (whenEmpty) {
			const render = parseDataLoadStateRender("empty", whenEmpty[1] ?? "", context, source, lineNumber);
			statements.push({ kind: "whenEmptyRender", value: render.value, ...styledRenderFields(render), span: lineSpan(source, lineNumber) });
			continue;
		}
		const whenRenderClass = line.match(/^when (.+) render class "([^"]+)" (.+)$/);
		if (whenRenderClass) {
			statements.push({
				kind: "whenRender",
				condition: parseWhenCondition(whenRenderClass[1] ?? "", context, source, lineNumber),
				className: whenRenderClass[2],
				value: parseLineExpression(whenRenderClass[3] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const whenRender = line.match(/^when (.+) render (.+)$/);
		if (whenRender) {
			const render = parseStyledRender(whenRender[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "whenRender",
				condition: parseWhenCondition(whenRender[1] ?? "", context, source, lineNumber),
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("render ")) {
			const renderLink = line.match(/^render link "(.+)" to "(.+)"$/);
			if (renderLink) {
				statements.push({
					kind: "link",
					label: renderLink[1] ?? "",
					path: renderLink[2] ?? "",
					span: lineSpan(source, lineNumber),
				});
				continue;
			}
			const render = parseStyledRender(line.slice("render ".length), context, source, lineNumber);
			statements.push({
				kind: "render",
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const linkLine = line.match(/^link "(.+)" to "(.+)"$/);
		if (linkLine) {
			statements.push({
				kind: "link",
				label: linkLine[1] ?? "",
				path: linkLine[2] ?? "",
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const navigateLine = line.match(/^navigate to "(.+)"$/);
		if (navigateLine) {
			statements.push({
				kind: "navigate",
				path: navigateLine[1] ?? "",
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const bindCheckbox = line.match(/^bind checkbox "(.+)" to (.+)$/);
		if (bindCheckbox) {
			statements.push({
				kind: "bindCheckbox",
				label: bindCheckbox[1] ?? "",
				target: parseLineExpression(bindCheckbox[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const bindField = line.match(/^bind field "(.+)" to (.+)$/);
		if (bindField) {
			statements.push({
				kind: "bindField",
				label: bindField[1] ?? "",
				target: parseLineExpression(bindField[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const formLine = line.match(/^form(?: (.+))?$/);
		if (formLine) {
			const bindings = parseViewBindBlock(body, lineIndex + 1, context, source);
			if (bindings.bindings.length === 0) throw new Error(`form requires bind field or bind checkbox lines`);
			const style = formLine[1] ? parseFormStyleLine(formLine[1]) : undefined;
			statements.push({
				kind: "form",
				bindings: bindings.bindings,
				...(style ? { style } : {}),
				span: lineSpan(source, lineNumber),
			});
			lineIndex = bindings.next - 1;
			continue;
		}
		if (line === "tabs") {
			const tabsBlock = parseViewTabsBlock(body, lineIndex + 1, context, source);
			if (tabsBlock.tabs.length < 2) throw new Error(`tabs requires at least two tab lines`);
			statements.push({ kind: "tabs", tabs: tabsBlock.tabs, span: lineSpan(source, lineNumber) });
			lineIndex = tabsBlock.next - 1;
			continue;
		}
		const eachLinkClass = line.match(/^each (.+) in (.+) render class "([^"]+)" link (.+) to (.+)$/);
		if (eachLinkClass) {
			const eachContext = eachItemContext(bindings, paramTypes, records, variants, callables, eachLinkClass[1] ?? "", eachLinkClass[2] ?? "");
			statements.push({
				kind: "eachRender",
				item: eachLinkClass[1] ?? "",
				iterable: parseLineExpression(eachLinkClass[2] ?? "", context, source, lineNumber),
				className: eachLinkClass[3],
				value: parseLineExpression(eachLinkClass[4] ?? "", eachContext, source, lineNumber),
				linkPath: parseLineExpression(eachLinkClass[5] ?? "", eachContext, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const eachLink = line.match(/^each (.+) in (.+) render link (.+) to (.+)$/);
		if (eachLink) {
			const eachContext = eachItemContext(bindings, paramTypes, records, variants, callables, eachLink[1] ?? "", eachLink[2] ?? "");
			statements.push({
				kind: "eachRender",
				item: eachLink[1] ?? "",
				iterable: parseLineExpression(eachLink[2] ?? "", context, source, lineNumber),
				value: parseLineExpression(eachLink[3] ?? "", eachContext, source, lineNumber),
				linkPath: parseLineExpression(eachLink[4] ?? "", eachContext, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const eachClass = line.match(/^each (.+) in (.+) render class "([^"]+)" (.+)$/);
		if (eachClass) {
			const eachContext = eachItemContext(bindings, paramTypes, records, variants, callables, eachClass[1] ?? "", eachClass[2] ?? "");
			statements.push({
				kind: "eachRender",
				item: eachClass[1] ?? "",
				iterable: parseLineExpression(eachClass[2] ?? "", context, source, lineNumber),
				className: eachClass[3],
				value: parseLineExpression(eachClass[4] ?? "", eachContext, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const eachRender = line.match(/^each (.+) in (.+) render (.+)$/);
		if (eachRender) {
			const eachContext = eachItemContext(bindings, paramTypes, records, variants, callables, eachRender[1] ?? "", eachRender[2] ?? "");
			const rest = eachRender[3] ?? "";
			const { style, remainder } = parseStylePrefix(rest);
			const linkMatch = remainder.match(/^link (.+) to (.+)$/);
			if (linkMatch) {
				statements.push({
					kind: "eachRender",
					item: eachRender[1] ?? "",
					iterable: parseLineExpression(eachRender[2] ?? "", context, source, lineNumber),
					...(style.length > 0 ? { style } : {}),
					value: parseLineExpression(linkMatch[1] ?? "", eachContext, source, lineNumber),
					linkPath: parseLineExpression(linkMatch[2] ?? "", eachContext, source, lineNumber),
					span: lineSpan(source, lineNumber),
				});
				continue;
			}
			const render = parseStyledRender(rest, eachContext, source, lineNumber);
			statements.push({
				kind: "eachRender",
				item: eachRender[1] ?? "",
				iterable: parseLineExpression(eachRender[2] ?? "", context, source, lineNumber),
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const modalWhenClass = line.match(/^modal "(.+)" when (.+) render class "([^"]+)" (.+)$/);
		if (modalWhenClass) {
			statements.push({
				kind: "modal",
				title: modalWhenClass[1] ?? "",
				when: parseWhenCondition(modalWhenClass[2] ?? "", context, source, lineNumber),
				className: modalWhenClass[3],
				value: parseLineExpression(modalWhenClass[4] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const modalWhen = line.match(/^modal "(.+)" when (.+) render (.+)$/);
		if (modalWhen) {
			const render = parseStyledRender(modalWhen[3] ?? "", context, source, lineNumber);
			statements.push({
				kind: "modal",
				title: modalWhen[1] ?? "",
				when: parseWhenCondition(modalWhen[2] ?? "", context, source, lineNumber),
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const modalClass = line.match(/^modal "(.+)" render class "([^"]+)" (.+)$/);
		if (modalClass) {
			statements.push({
				kind: "modal",
				title: modalClass[1] ?? "",
				className: modalClass[2],
				value: parseLineExpression(modalClass[3] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const modalRender = line.match(/^modal "(.+)" render (.+)$/);
		if (modalRender) {
			const render = parseStyledRender(modalRender[2] ?? "", context, source, lineNumber);
			statements.push({
				kind: "modal",
				title: modalRender[1] ?? "",
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("on change call ")) {
			statements.push({
				kind: "onChangeCall",
				callback: line.slice("on change call ".length).trim(),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("on message call ")) {
			statements.push({
				kind: "onMessageCall",
				callback: line.slice("on message call ".length).trim(),
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

function parseLayout(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticLayoutDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("layout ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const slots: PointSemanticLayoutSlot[] = [];
	const bindings: string[] = [];
	const paramTypes = new Map<string, string>();

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		const slotMatch = line.match(/^slot (\w+) render (.+)$/);
		if (!slotMatch) throw new Error(`Unknown layout statement: ${line}`);
		const slotName = slotMatch[1] ?? "";
		const renderSource = slotMatch[2] ?? "";
		const { style, remainder } = parseStylePrefix(renderSource);
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		slots.push({
			name: slotName,
			content: parseLineExpression(remainder, context, source, lineNumber),
			...(style.length > 0 ? { style } : {}),
			span: lineSpan(source, lineNumber),
		});
	}

	return {
		declaration: { kind: "layout", name, slots, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parseNavigation(
	lines: string[],
	start: number,
	source: string,
): { declaration: PointSemanticNavigationDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("navigation ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const routes: PointSemanticNavigationRoute[] = [];
	let bootstrapRouter = false;

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line === "bootstrap router") {
			bootstrapRouter = true;
			continue;
		}
		const routeMatch = line.match(/^path "(.+)" page (.+)$/);
		if (routeMatch) {
			routes.push({
				path: routeMatch[1] ?? "",
				pageName: routeMatch[2] ?? "",
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown navigation statement: ${line}`);
	}

	if (routes.length === 0) throw new Error(`Navigation ${name} requires at least one path ... page ... route`);

	return {
		declaration: { kind: "navigation", name, routes, bootstrapRouter, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function collectPageBody(lines: string[], start: number): SemanticBody {
	const body: string[] = [];
	const lineNumbers: number[] = [];
	let index = start;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed) && !trimmed.startsWith("layout ")) break;
		body.push(trimmed);
		lineNumbers.push(index + 1);
	}
	return { lines: body, lineNumbers, next: index };
}

function parsePage(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticPageDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("page ".length).trim();
	const body = collectPageBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let layout: string | undefined;
	let loadData: string | undefined;
	let title: PointSemanticPageDeclaration["title"] | undefined;
	let description: PointSemanticPageDeclaration["description"];
	let main: PointSemanticPageDeclaration["main"] | undefined;
	let mainClassName: string | undefined;
	let mainStyle: string[] | undefined;
	let whenLoadingRender: PointSemanticPageDeclaration["whenLoadingRender"];
	let whenLoadingClassName: string | undefined;
	let whenLoadingStyle: string[] | undefined;
	let whenErrorRender: PointSemanticPageDeclaration["whenErrorRender"];
	let whenErrorClassName: string | undefined;
	let whenErrorStyle: string[] | undefined;
	let whenEmptyRender: PointSemanticPageDeclaration["whenEmptyRender"];
	let whenEmptyClassName: string | undefined;
	let whenEmptyStyle: string[] | undefined;
	let streamSubscribePath: string | undefined;
	let streamSubscribeRoute: string | undefined;
	let onMessageCall: string | undefined;
	let whenConnectingRender: PointSemanticPageDeclaration["whenConnectingRender"];
	let whenConnectingClassName: string | undefined;
	let whenConnectingStyle: string[] | undefined;
	let whenDisconnectedRender: PointSemanticPageDeclaration["whenDisconnectedRender"];
	let whenDisconnectedClassName: string | undefined;
	let whenDisconnectedStyle: string[] | undefined;
	let hasDataBinding = false;
	let hasStreamBinding = false;

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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		const loadDataMatch = line.match(/^load data from action (.+)$/);
		if (loadDataMatch) {
			loadData = loadDataMatch[1]?.trim();
			if (!hasDataBinding) {
				hasDataBinding = true;
				paramTypes.set("data", "Text");
				bindings.push("data");
			}
			continue;
		}
		const onMountMatch = line.match(/^on mount call (.+)$/);
		if (onMountMatch) {
			loadData = onMountMatch[1]?.trim();
			if (!hasDataBinding) {
				hasDataBinding = true;
				paramTypes.set("data", "Text");
				bindings.push("data");
			}
			continue;
		}
		const subscribePathMatch = line.match(/^subscribe to ("[^"]+")$/);
		if (subscribePathMatch) {
			streamSubscribePath = JSON.parse(subscribePathMatch[1] ?? '""') as string;
			if (!hasStreamBinding) {
				hasStreamBinding = true;
				paramTypes.set("messages", "List<Text>");
				bindings.push("messages");
				paramTypes.set("connected", "Bool");
				bindings.push("connected");
			}
			continue;
		}
		const subscribeRouteMatch = line.match(/^subscribe to stream (.+)$/);
		if (subscribeRouteMatch) {
			streamSubscribeRoute = subscribeRouteMatch[1]?.trim();
			if (!hasStreamBinding) {
				hasStreamBinding = true;
				paramTypes.set("messages", "List<Text>");
				bindings.push("messages");
				paramTypes.set("connected", "Bool");
				bindings.push("connected");
			}
			continue;
		}
		if (line.startsWith("on message call ")) {
			onMessageCall = line.slice("on message call ".length).trim();
			continue;
		}
		const whenConnectingClass = line.match(/^when connecting render class "([^"]+)" (.+)$/);
		if (whenConnectingClass) {
			whenConnectingClassName = whenConnectingClass[1];
			whenConnectingRender = parseLineExpression(whenConnectingClass[2] ?? "", context, source, lineNumber);
			continue;
		}
		const whenConnecting = line.match(/^when connecting render (.+)$/);
		if (whenConnecting) {
			const render = parseDataLoadStateRender("connecting", whenConnecting[1] ?? "", context, source, lineNumber);
			whenConnectingRender = render.value;
			whenConnectingClassName = render.className;
			whenConnectingStyle = render.style;
			continue;
		}
		const whenDisconnectedClass = line.match(/^when disconnected render class "([^"]+)" (.+)$/);
		if (whenDisconnectedClass) {
			whenDisconnectedClassName = whenDisconnectedClass[1];
			whenDisconnectedRender = parseLineExpression(whenDisconnectedClass[2] ?? "", context, source, lineNumber);
			continue;
		}
		const whenDisconnected = line.match(/^when disconnected render (.+)$/);
		if (whenDisconnected) {
			const render = parseDataLoadStateRender("disconnected", whenDisconnected[1] ?? "", context, source, lineNumber);
			whenDisconnectedRender = render.value;
			whenDisconnectedClassName = render.className;
			whenDisconnectedStyle = render.style;
			continue;
		}
		const whenLoadingClass = line.match(/^when loading render class "([^"]+)" (.+)$/);
		if (whenLoadingClass) {
			whenLoadingClassName = whenLoadingClass[1];
			whenLoadingRender = parseLineExpression(whenLoadingClass[2] ?? "", context, source, lineNumber);
			continue;
		}
		const whenLoading = line.match(/^when loading render (.+)$/);
		if (whenLoading) {
			const render = parseDataLoadStateRender("loading", whenLoading[1] ?? "", context, source, lineNumber);
			whenLoadingRender = render.value;
			whenLoadingClassName = render.className;
			whenLoadingStyle = render.style;
			continue;
		}
		const whenErrorClass = line.match(/^when error render class "([^"]+)" (.+)$/);
		if (whenErrorClass) {
			whenErrorClassName = whenErrorClass[1];
			whenErrorRender = parseLineExpression(whenErrorClass[2] ?? "", context, source, lineNumber);
			continue;
		}
		const whenError = line.match(/^when error render (.+)$/);
		if (whenError) {
			const render = parseDataLoadStateRender("error", whenError[1] ?? "", context, source, lineNumber);
			whenErrorRender = render.value;
			whenErrorClassName = render.className;
			whenErrorStyle = render.style;
			continue;
		}
		const whenEmptyClass = line.match(/^when empty render class "([^"]+)" (.+)$/);
		if (whenEmptyClass) {
			whenEmptyClassName = whenEmptyClass[1];
			whenEmptyRender = parseLineExpression(whenEmptyClass[2] ?? "", context, source, lineNumber);
			continue;
		}
		const whenEmpty = line.match(/^when empty render (.+)$/);
		if (whenEmpty) {
			const render = parseDataLoadStateRender("empty", whenEmpty[1] ?? "", context, source, lineNumber);
			whenEmptyRender = render.value;
			whenEmptyClassName = render.className;
			whenEmptyStyle = render.style;
			continue;
		}
		if (line.startsWith("layout ")) {
			layout = line.slice("layout ".length).trim();
			continue;
		}
		if (line.startsWith("title ")) {
			title = parseLineExpression(line.slice("title ".length), context, source, lineNumber);
			continue;
		}
		if (line.startsWith("description ")) {
			description = parseLineExpression(line.slice("description ".length), context, source, lineNumber);
			continue;
		}
		if (line.startsWith("main render ")) {
			const rest = line.slice("main render ".length);
			const classMatch = rest.match(/^class "([^"]+)" (.+)$/);
			if (classMatch) {
				mainClassName = classMatch[1];
				main = parseLineExpression(classMatch[2] ?? "", context, source, lineNumber);
				continue;
			}
			const styled = parseStyledRender(rest, context, source, lineNumber);
			main = styled.value;
			mainClassName = styled.className;
			mainStyle = styled.style;
			continue;
		}
		throw new Error(`Unknown page statement: ${line}`);
	}

	if (!title) throw new Error(`Page ${name} requires a title`);
	if (!main) throw new Error(`Page ${name} requires main render`);

	return {
		declaration: {
			kind: "page",
			name,
			layout,
			inputs,
			loadData,
			title,
			description,
			main,
			mainClassName,
			...(mainStyle ? { mainStyle } : {}),
			whenLoadingRender,
			whenLoadingClassName,
			...(whenLoadingStyle ? { whenLoadingStyle } : {}),
			whenErrorRender,
			whenErrorClassName,
			...(whenErrorStyle ? { whenErrorStyle } : {}),
			whenEmptyRender,
			whenEmptyClassName,
			...(whenEmptyStyle ? { whenEmptyStyle } : {}),
			streamSubscribePath,
			streamSubscribeRoute,
			onMessageCall,
			whenConnectingRender,
			whenConnectingClassName,
			...(whenConnectingStyle ? { whenConnectingStyle } : {}),
			whenDisconnectedRender,
			whenDisconnectedClassName,
			...(whenDisconnectedStyle ? { whenDisconnectedStyle } : {}),
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseMiddleware(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	callables: string[],
): { declaration: PointSemanticMiddlewareDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("middleware ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "response", type: { kind: "typeRef", name: "Maybe", args: [{ kind: "typeRef", name: "Text", args: [] }] } };
	const statements: PointSemanticMiddlewareStatement[] = [];

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
		if (line.startsWith("when ")) {
			const match = line.match(/^when (.+) return (.+)$/);
			if (!match) throw new Error(`Unknown middleware statement: ${line}`);
			statements.push({
				kind: "whenReturn",
				condition: parseWhenCondition(match[1] ?? "", context, source, lineNumber),
				value: parseLineExpression(match[2] ?? "", context, source, lineNumber),
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
		throw new Error(`Unknown middleware statement: ${line}`);
	}

	return {
		declaration: { kind: "middleware", name, inputs, output, body: statements, span: lineSpan(source, start + 1) },
		next: body.next,
	};
}

function parseStreamRoute(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticStreamRouteDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("stream route ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	let path = "/";
	let messageType = { kind: "typeRef" as const, name: "Text", args: [] };
	const handlers: PointSemanticStreamRouteHandler[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		if (line.startsWith("path ")) {
			path = line.slice("path ".length).trim().replace(/^"|"$/g, "");
			continue;
		}
		if (line.startsWith("message ")) {
			messageType = parseSemanticTypeExpression(line.slice("message ".length).trim());
			continue;
		}
		const streamActionMatch = line.match(/^on (connect|disconnect) stream from action (.+)$/);
		if (streamActionMatch) {
			const event = streamActionMatch[1] as PointSemanticStreamRouteEvent;
			handlers.push({
				event,
				mode: "streamFromAction",
				actionName: streamActionMatch[2]?.trim() ?? "",
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const handlerMatch = line.match(/^on (connect|message|disconnect)(?:\s+([A-Za-z][A-Za-z0-9_ ]*))?\s+return\s+(.+)$/);
		if (handlerMatch) {
			const event = handlerMatch[1] as PointSemanticStreamRouteEvent;
			const inputLabel = handlerMatch[2]?.trim();
			const returnSource = handlerMatch[3] ?? "";
			const bindings = event === "message" && inputLabel ? [inputLabel] : [];
			const paramTypes = new Map<string, string>();
			if (event === "message" && inputLabel) {
				paramTypes.set(inputLabel, typeLabel(messageType));
			}
			const context = expressionContext({ bindings, paramTypes, records, variants, callables });
			handlers.push({
				event,
				inputLabel,
				mode: "return",
				value: parseLineExpression(returnSource, context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		throw new Error(`Unknown stream route statement: ${line}`);
	}

	return {
		declaration: {
			kind: "streamRoute",
			name,
			path,
			messageType,
			handlers,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseRoute(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticRouteDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("route ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	let method = "GET";
	let path = "/";
	const before: string[] = [];
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
		if (line.startsWith("before ")) {
			before.push(line.slice("before ".length).trim());
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		if (line.startsWith("return json ")) {
			statements.push(parseReturnJson(line.slice("return ".length), context, source, lineNumber));
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
		throw new Error(`Unknown route statement: ${line}`);
	}

	return {
		declaration: {
			kind: "route",
			name,
			method,
			path,
			before,
			inputs,
			output,
			body: statements,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseReturnJson(
	source: string,
	context: ReturnType<typeof buildExpressionContext>,
	fileSource: string,
	lineNumber: number,
): PointSemanticRouteStatement {
	let rest = source.trim();
	if (!rest.startsWith("json ")) throw new Error(`Expected json response body: ${source}`);
	rest = rest.slice("json ".length).trimStart();
	let status: PointSemanticExpression | undefined;
	let headers: PointSemanticExpression | undefined;
	if (rest.startsWith("status ")) {
		rest = rest.slice("status ".length);
		const space = rest.search(/\s/);
		const statusSource = space === -1 ? rest : rest.slice(0, space);
		status = parseLineExpression(statusSource, context, fileSource, lineNumber);
		rest = space === -1 ? "" : rest.slice(space).trimStart();
	}
	if (rest.startsWith("headers ")) {
		rest = rest.slice("headers ".length);
		const headersEnd = findRecordEnd(rest);
		headers = parseLineExpression(rest.slice(0, headersEnd), context, fileSource, lineNumber);
		rest = rest.slice(headersEnd).trimStart();
	}
	const value = parseLineExpression(rest, context, fileSource, lineNumber);
	return { kind: "returnJson", value, status, headers, span: lineSpan(fileSource, lineNumber) };
}

function findRecordEnd(source: string): number {
	if (!source.startsWith("{")) return source.length;
	let depth = 0;
	for (let index = 0; index < source.length; index += 1) {
		const char = source[index];
		if (char === "{") depth += 1;
		if (char === "}") {
			depth -= 1;
			if (depth === 0) return index + 1;
		}
	}
	return source.length;
}

function parseWorkflow(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		const step = line.match(/^step (.+) is (.+)$/);
		if (step) {
			const stepName = step[1]?.trim() ?? "";
			const options = parseWorkflowStepOptions(body, lineIndex, source, context);
			lineIndex = options.nextLineIndex;
			statements.push({
				kind: "step",
				name: stepName,
				value: parseLineExpression(step[2] ?? "", context, source, lineNumber),
				options: options.value,
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

function parsePipeline(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticPipelineDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("pipeline ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const inputs: PointSemanticBinding[] = [];
	const paramTypes = new Map<string, string>();
	const bindings: string[] = [];
	let output: PointSemanticOutputBinding = { name: "result", type: { kind: "typeRef", name: "Void", args: [] } };
	const statements: PointSemanticPipelineStatement[] = [];
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		const step = line.match(/^step (.+) is (.+)$/);
		if (step) {
			const stepName = step[1]?.trim() ?? "";
			const options = parseWorkflowStepOptions(body, lineIndex, source, context);
			lineIndex = options.nextLineIndex;
			statements.push({
				kind: "step",
				name: stepName,
				value: parseLineExpression(step[2] ?? "", context, source, lineNumber),
				options: options.value,
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
		throw new Error(`Unknown pipeline statement: ${line}`);
	}
	return { declaration: { kind: "pipeline", name, inputs, output, body: statements, span: lineSpan(source, start + 1) }, next: body.next };
}

function parseSession(
	lines: string[],
	start: number,
	source: string,
): { declaration: PointSemanticSessionDeclaration; next: number } {
	const name = (lines[start] ?? "").trim().slice("session ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	let messageRecordName: string | undefined;
	let messagesField: PointSemanticBinding | undefined;
	let streamActionName: string | undefined;

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		const messageMatch = line.match(/^message (.+)$/);
		if (messageMatch) {
			messageRecordName = messageMatch[1]?.trim() ?? "";
			continue;
		}
		const messagesMatch = line.match(/^messages (.+)$/);
		if (messagesMatch) {
			messagesField = parseInputBinding(messagesMatch[1] ?? "", source, lineNumber);
			continue;
		}
		const streamMatch = line.match(/^stream response from action (.+)$/);
		if (streamMatch) {
			streamActionName = streamMatch[1]?.trim() ?? "";
			continue;
		}
		throw new Error(`Unknown session statement at line ${lineNumber}: ${line}`);
	}

	if (!messageRecordName) throw new Error(`Session ${name} requires message <record>`);
	if (!messagesField) throw new Error(`Session ${name} requires messages <label>: List<record>`);
	if (!streamActionName) throw new Error(`Session ${name} requires stream response from action <name>`);

	return {
		declaration: {
			kind: "session",
			name,
			messageRecordName,
			messagesField,
			streamActionName,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseCommand(
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
): { declaration: PointSemanticCommandDeclaration; next: number } {
	const parsed = parseCallableBlock("command", lines, start, source, records, variants, callables) as { declaration: PointSemanticCommandDeclaration; next: number };
	return parsed;
}

function parseSchedule(
	lines: string[],
	start: number,
	source: string,
): { declaration: PointSemanticScheduleDeclaration; next: number } {
	const header = (lines[start] ?? "").trim();
	const inlineMatch = header.match(/^schedule every (\d+) (seconds?|minutes?|hours?) call (.+)$/);
	if (inlineMatch) {
		const amount = Number(inlineMatch[1]);
		const unit = normalizeScheduleIntervalUnit(inlineMatch[2] ?? "");
		const actionName = inlineMatch[3]?.trim() ?? "";
		if (!Number.isInteger(amount) || amount <= 0) throw new Error(`Schedule interval must be a positive integer: ${header}`);
		if (!actionName) throw new Error(`Schedule requires an action to call: ${header}`);
		return {
			declaration: {
				kind: "schedule",
				name: `${actionName} tick`,
				interval: { amount, unit, span: lineSpan(source, start + 1) },
				actionName,
				span: lineSpan(source, start + 1),
			},
			next: start + 1,
		};
	}

	const name = header.slice("schedule ".length).trim();
	if (!name) throw new Error("Schedule block requires a name");
	const body = collectSemanticBody(lines, start + 1);
	let interval: PointSemanticScheduleInterval | undefined;
	let actionName: string | undefined;

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		const everyMatch = line.match(/^every (\d+) (seconds?|minutes?|hours?)$/);
		if (everyMatch) {
			const amount = Number(everyMatch[1]);
			if (!Number.isInteger(amount) || amount <= 0) throw new Error(`Schedule interval must be a positive integer: ${line}`);
			interval = { amount, unit: normalizeScheduleIntervalUnit(everyMatch[2] ?? ""), span: lineSpan(source, lineNumber) };
			continue;
		}
		const callMatch = line.match(/^call (.+)$/);
		if (callMatch) {
			actionName = callMatch[1]?.trim() ?? "";
			continue;
		}
		throw new Error(`Unknown schedule statement: ${line}`);
	}

	if (!interval) throw new Error(`Schedule ${name} requires every N seconds|minutes|hours`);
	if (!actionName) throw new Error(`Schedule ${name} requires call <action>`);

	return {
		declaration: {
			kind: "schedule",
			name,
			interval,
			actionName,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function normalizeScheduleIntervalUnit(raw: string): PointSemanticScheduleIntervalUnit {
	const normalized = raw.toLowerCase();
	if (normalized.startsWith("second")) return "seconds";
	if (normalized.startsWith("minute")) return "minutes";
	if (normalized.startsWith("hour")) return "hours";
	throw new Error(`Unknown schedule interval unit: ${raw}`);
}

function parsePrompt(
	lines: string[],
	start: number,
	source: string,
): { declaration: PointSemanticPromptDeclaration; next: number } {
	const header = (lines[start] ?? "").trim();
	const name = header.slice("prompt ".length).trim();
	if (!name) throw new Error("Prompt block requires a name");
	const body = collectSemanticBody(lines, start + 1);
	let version: string | undefined;
	let recordName: string | undefined;
	let template: string | undefined;

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
		const lineNumber = body.lineNumbers[lineIndex] ?? start + 2;
		const versionMatch = line.match(/^version (.+)$/);
		if (versionMatch) {
			version = versionMatch[1]?.trim() ?? "";
			continue;
		}
		const inputMatch = line.match(/^input (.+)$/);
		if (inputMatch) {
			recordName = inputMatch[1]?.trim() ?? "";
			continue;
		}
		const quotedTemplateMatch = line.match(/^template "([^"]*)"$/);
		if (quotedTemplateMatch) {
			template = quotedTemplateMatch[1] ?? "";
			continue;
		}
		const templateMatch = line.match(/^template (.+)$/);
		if (templateMatch) {
			template = templateMatch[1]?.trim() ?? "";
			continue;
		}
		throw new Error(`Unknown prompt statement at line ${lineNumber}: ${line}`);
	}

	if (!version) throw new Error(`Prompt ${name} requires version N or version label`);
	if (!recordName) throw new Error(`Prompt ${name} requires input <record>`);
	if (template === undefined) throw new Error(`Prompt ${name} requires template text`);

	return {
		declaration: {
			kind: "prompt",
			name,
			version,
			recordName,
			template,
			span: lineSpan(source, start + 1),
		},
		next: body.next,
	};
}

function parseCallableBlock(
	kind: "action" | "command",
	lines: string[],
	start: number,
	source: string,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
) {
	const name = (lines[start] ?? "").trim().slice(`${kind} `.length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const parsed = parseSimpleCallableBody(body, source, start, records, variants, callables);
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
	variants: SemanticVariants,
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
		const context = expressionContext({ bindings, paramTypes, records, variants, callables });
		if (line.startsWith("return ")) {
			statements.push({
				kind: "return",
				value: parseLineExpression(line.slice("return ".length), context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		if (line.startsWith("yield ")) {
			statements.push({
				kind: "yield",
				value: parseLineExpression(line.slice("yield ".length), context, source, lineNumber),
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
	context: ReturnType<typeof expressionContext>,
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

function eachItemContext(
	bindings: string[],
	paramTypes: Map<string, string>,
	records: Map<string, Map<string, string>>,
	variants: SemanticVariants,
	callables: string[],
	item: string,
	iterableSource: string,
) {
	const nextParamTypes = new Map(paramTypes);
	nextParamTypes.set(item, listItemType(iterableSource, paramTypes));
	return expressionContext({
		bindings: [...bindings, item],
		paramTypes: nextParamTypes,
		records,
		variants,
		callables,
	});
}

function parseViewBindBlock(
	body: SemanticBody,
	start: number,
	context: ReturnType<typeof expressionContext>,
	source: string,
): { bindings: import("./ast.ts").PointSemanticViewBindStatement[]; next: number } {
	const bindings: import("./ast.ts").PointSemanticViewBindStatement[] = [];
	let index = start;
	for (; index < body.lines.length; index += 1) {
		const line = body.lines[index] ?? "";
		const lineNumber = body.lineNumbers[index] ?? start + 1;
		const bindField = line.match(/^bind field "(.+)" to (.+)$/);
		if (bindField) {
			bindings.push({
				kind: "bindField",
				label: bindField[1] ?? "",
				target: parseLineExpression(bindField[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		const bindCheckbox = line.match(/^bind checkbox "(.+)" to (.+)$/);
		if (bindCheckbox) {
			bindings.push({
				kind: "bindCheckbox",
				label: bindCheckbox[1] ?? "",
				target: parseLineExpression(bindCheckbox[2] ?? "", context, source, lineNumber),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		break;
	}
	return { bindings, next: index };
}

function parseViewTabsBlock(
	body: SemanticBody,
	start: number,
	context: ReturnType<typeof expressionContext>,
	source: string,
): { tabs: import("./ast.ts").PointSemanticViewTab[]; next: number } {
	const tabs: import("./ast.ts").PointSemanticViewTab[] = [];
	let index = start;
	for (; index < body.lines.length; index += 1) {
		const line = body.lines[index] ?? "";
		const lineNumber = body.lineNumbers[index] ?? start + 1;
		const tabRender = line.match(/^tab "(.+)" render (.+)$/);
		if (tabRender) {
			const render = parseStyledRender(tabRender[2] ?? "", context, source, lineNumber);
			tabs.push({
				label: tabRender[1] ?? "",
				value: render.value,
				...styledRenderFields(render),
				span: lineSpan(source, lineNumber),
			});
			continue;
		}
		break;
	}
	return { tabs, next: index };
}

function isOrchestrationStepBoundary(line: string): boolean {
	return (
		line.startsWith("input ") ||
		line.startsWith("output ") ||
		line.startsWith("return ") ||
		line.startsWith("step ") ||
		isSemanticTopLevel(line)
	);
}

function parseWorkflowStepOptions(
	body: SemanticBody,
	stepLineIndex: number,
	source: string,
	context: ReturnType<typeof expressionContext>,
): { value?: PointSemanticWorkflowStepOptions; nextLineIndex: number } {
	const options: PointSemanticWorkflowStepOptions = {};
	let lineIndex = stepLineIndex;
	while (lineIndex + 1 < body.lines.length) {
		const nextLine = body.lines[lineIndex + 1] ?? "";
		if (isOrchestrationStepBoundary(nextLine)) break;
		lineIndex += 1;
		const lineNumber = body.lineNumbers[lineIndex] ?? stepLineIndex + 2;
		const retry = nextLine.match(/^retry (\d+) times$/);
		if (retry) {
			options.retryCount = Number(retry[1]);
			continue;
		}
		const timeout = nextLine.match(/^timeout after (\d+) seconds?$/);
		if (timeout) {
			options.timeoutSeconds = Number(timeout[1]);
			continue;
		}
		const requirePolicy = nextLine.match(/^require policy (.+)$/);
		if (requirePolicy) {
			options.requiredPolicy = requirePolicy[1]?.trim() ?? "";
			options.requiredPolicySpan = lineSpan(source, lineNumber);
			continue;
		}
		const touchScope = nextLine.match(/^touches file scope (.+)$/);
		if (touchScope) {
			options.fileScopeGuard = touchScope[1]?.trim() ?? "";
			continue;
		}
		const requireGuard = nextLine.match(/^require guard (.+)$/);
		if (requireGuard) {
			options.fileScopeGuard = requireGuard[1]?.trim() ?? "";
			continue;
		}
		const onFailure = nextLine.match(/^on failure return (.+)$/);
		if (onFailure) {
			options.onFailure = parseLineExpression(onFailure[1] ?? "", context, source, lineNumber);
			continue;
		}
		throw new Error(`Unknown workflow step option: ${nextLine}`);
	}
	return { value: Object.keys(options).length > 0 ? options : undefined, nextLineIndex: lineIndex };
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
	if (/^label\s+is\s+/.test(line)) return false;
	return /^(module|use|record|variant|calculation|rule|label|external|action|policy|guard|view|layout|navigation|page|middleware|stream route|route|workflow|pipeline|session|command|schedule|prompt|theme)\s+/.test(line);
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
	if (type.name === "Handler" && type.args[0]) {
		return `Handler ${typeLabel(type.args[0] as { kind: "typeRef"; name: string; args: unknown[] })}`;
	}
	if (type.name === "Map" && type.args[0] && type.args[1]) {
		return `Map<${typeLabel(type.args[0] as { kind: "typeRef"; name: string; args: unknown[] })}, ${typeLabel(type.args[1] as { kind: "typeRef"; name: string; args: unknown[] })}>`;
	}
	const primitives = new Set(["Text", "Int", "Float", "Bool", "Void", "Maybe", "Or", "Error", "Page", "Handler"]);
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
