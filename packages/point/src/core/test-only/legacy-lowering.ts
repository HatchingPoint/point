import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PointCoreProgram, PointCoreStatement } from "../ast.ts";
import { modulePathFromLock, readPointLockSync } from "../packages.ts";
import { assertSemanticPointSource, isSemanticPointSyntax } from "../semantic-source.ts";
import { scanUseDeclarations } from "../../semantic/callables.ts";
import { isCapabilitiesLine } from "../capabilities.ts";
import { desugarSemanticProgram } from "../../semantic/desugar.ts";
import { parseSemanticSourceWithUses } from "../parser.ts";
import { parsePointCore } from "./core-text-parser.ts";

/** Legacy string-lowering path retained for migration parity tests only. */
export function parsePointSourceLegacy(source: string): PointCoreProgram {
	assertSemanticPointSource(source);
	return parsePointSourceViaLowering(source);
}

function parsePointSourceViaLowering(source: string): PointCoreProgram {
	const lowered = lowerSemanticPointSyntax(source);
	const program = parsePointCore(lowered);
	if (isSemanticPointSyntax(source)) {
		attachSemanticMetadata(program, source);
		enrichPageLayouts(program, source);
		enrichLayoutSpecs(program, source);
		enrichViewRenderClasses(program, source);
	}
	return program;
}

function enrichViewRenderClasses(program: PointCoreProgram, source: string): void {
	const desugared = desugarSemanticProgram(parseSemanticSourceWithUses(source));
	const viewFunctions = desugared.declarations.filter(
		(declaration): declaration is Extract<(typeof desugared.declarations)[number], { kind: "function" }> =>
			declaration.kind === "function" && declaration.semantic?.kind === "view",
	);
	for (const declaration of program.declarations) {
		if (declaration.kind !== "function" || declaration.semantic?.kind !== "view") continue;
		const match = viewFunctions.find((candidate) => candidate.name === declaration.name);
		if (!match) continue;
		copyViewRenderClasses(declaration.body, match.body);
	}
}

function copyViewRenderClasses(target: PointCoreStatement[], source: PointCoreStatement[]): void {
	for (let index = 0; index < source.length; index += 1) {
		const sourceStatement = source[index];
		const targetStatement = target[index];
		if (!sourceStatement || !targetStatement) continue;
		if (sourceStatement.kind === "return" && targetStatement.kind === "return" && sourceStatement.className) {
			targetStatement.className = sourceStatement.className;
			continue;
		}
		if (sourceStatement.kind === "if" && targetStatement.kind === "if") {
			const sourceReturn = sourceStatement.thenBody[0];
			const targetReturn = targetStatement.thenBody[0];
			if (sourceReturn?.kind === "return" && targetReturn?.kind === "return" && sourceReturn.className) {
				targetReturn.className = sourceReturn.className;
			}
		}
	}
}

function enrichLayoutSpecs(program: PointCoreProgram, source: string): void {
	const desugared = desugarSemanticProgram(parseSemanticSourceWithUses(source));
	const layoutFunctions = desugared.declarations.filter(
		(declaration): declaration is Extract<(typeof desugared.declarations)[number], { kind: "function" }> =>
			declaration.kind === "function" && declaration.semantic?.kind === "layout",
	);
	for (const declaration of program.declarations) {
		if (declaration.kind !== "function" || declaration.semantic?.kind !== "layout") continue;
		const match = layoutFunctions.find((candidate) => candidate.name === declaration.name);
		if (!match?.semantic?.layoutSpec) continue;
		declaration.semantic.layoutSpec = match.semantic.layoutSpec;
	}
}

function enrichPageLayouts(program: PointCoreProgram, source: string): void {
	const desugared = desugarSemanticProgram(parseSemanticSourceWithUses(source));
	const pageFunctions = desugared.declarations.filter(
		(declaration): declaration is Extract<(typeof desugared.declarations)[number], { kind: "function" }> =>
			declaration.kind === "function" && declaration.semantic?.kind === "page",
	);
	for (const declaration of program.declarations) {
		if (declaration.kind !== "function" || declaration.semantic?.kind !== "page") continue;
		const match = pageFunctions.find((candidate) => candidate.name === declaration.name);
		if (!match?.semantic?.pageLayout) continue;
		declaration.semantic.pageLayout = match.semantic.pageLayout;
	}
}

function lowerSemanticPointSyntax(source: string, cwd?: string): string {
	if (!isSemanticPointSyntax(source)) return source;
	const lines = source.split(/\r?\n/);
	const output: string[] = [];
	const records = new Map<string, Map<string, string>>();
	const cwdResolved = cwd ?? process.cwd();
	const externalBindings = new Map([
		...collectExternalBindings(source),
		...collectCallableBindings(source),
		...collectImportedBindings(source, cwdResolved),
	]);
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
		if (trimmed.startsWith("use ") || isCapabilitiesLine(trimmed)) {
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
			const lowered = lowerCalculation(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("rule ")) {
			const lowered = lowerRule(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("label ")) {
			const lowered = lowerLabel(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("external ")) {
			const lowered = lowerExternal(lines, index);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("action ")) {
			const lowered = lowerAction(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("policy ")) {
			const lowered = lowerPolicy(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("view ")) {
			const lowered = lowerView(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("layout ")) {
			const lowered = lowerLayout(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("page ")) {
			const lowered = lowerPage(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("middleware ")) {
			const lowered = lowerMiddleware(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("stream route ")) {
			const lowered = lowerStreamRoute(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("route ")) {
			const lowered = lowerRoute(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("workflow ")) {
			const lowered = lowerWorkflow(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("command ")) {
			const lowered = lowerCommand(lines, index, records, externalBindings);
			output.push(...lowered.lines);
			index = lowered.next;
			continue;
		}
		if (trimmed.startsWith("schedule ") || trimmed.startsWith("prompt ") || trimmed.startsWith("pipeline ") || trimmed.startsWith("session ") || trimmed.startsWith("guard ")) {
			const body = collectSemanticBody(lines, index + 1);
			index = body.next;
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
		if (/^(record|calculation|rule|label|external|action|policy|view|layout|page|middleware|stream route|route|workflow|pipeline|session|command)\s+/.test(trimmed)) hasSemanticDeclaration = true;
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
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("rule ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
	let outputName = "result";
	let outputType = "Void";
	const statements: string[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
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
		const loop = line.match(/^for each (.+) in (.+)$/);
		if (loop) {
			const itemLabel = loop[1]?.trim() ?? "";
			const itemName = toIdentifier(itemLabel);
			const iterableSource = loop[2] ?? "";
			const iterable = lowerExpression(iterableSource, paramTypes, records, bindings);
			const loopParamTypes = new Map(paramTypes);
			const itemType = listItemTypeFor(iterableSource, paramTypes, bindings);
			if (itemType) loopParamTypes.set(itemName, itemType);
			const loopBindings = new Map(bindings);
			loopBindings.set(itemLabel, itemName);
			const loopBody: string[] = [];
			while (body.lines[lineIndex + 1] && !isSemanticLoopBoundary(body.lines[lineIndex + 1]!)) {
				lineIndex += 1;
				loopBody.push(...lowerSemanticMutationStatement(body.lines[lineIndex]!, loopParamTypes, records, loopBindings));
			}
			statements.push(`for ${itemName} in ${iterable} {`);
			statements.push(...indentRaw(loopBody));
			statements.push("}");
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
		const mutation = lowerSemanticMutationStatement(line, paramTypes, records, bindings);
		if (mutation.length > 0) {
			statements.push(...mutation);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown rule statement: ${line}`);
	}

	const functionName = semanticFunctionName(label, outputName, "rule");
	return {
		lines: [`fn ${functionName}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerCalculation(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("calculation ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
	let outputName = "result";
	let outputType = "Void";
	const statements: string[] = [];

	for (let lineIndex = 0; lineIndex < body.lines.length; lineIndex += 1) {
		const line = body.lines[lineIndex] ?? "";
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
		const loop = line.match(/^for each (.+) in (.+)$/);
		if (loop) {
			const itemLabel = loop[1]?.trim() ?? "";
			const itemName = toIdentifier(itemLabel);
			const iterableSource = loop[2] ?? "";
			const iterable = lowerExpression(iterableSource, paramTypes, records, bindings);
			const loopParamTypes = new Map(paramTypes);
			const itemType = listItemTypeFor(iterableSource, paramTypes, bindings);
			if (itemType) loopParamTypes.set(itemName, itemType);
			const loopBindings = new Map(bindings);
			loopBindings.set(itemLabel, itemName);
			const loopBody: string[] = [];
			while (body.lines[lineIndex + 1] && !isSemanticLoopBoundary(body.lines[lineIndex + 1]!)) {
				lineIndex += 1;
				loopBody.push(...lowerSemanticMutationStatement(body.lines[lineIndex]!, loopParamTypes, records, loopBindings));
			}
			statements.push(`for ${itemName} in ${iterable} {`);
			statements.push(...indentRaw(loopBody));
			statements.push("}");
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
		const mutation = lowerSemanticMutationStatement(line, paramTypes, records, bindings);
		if (mutation.length > 0) {
			statements.push(...mutation);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
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
		throw new Error(`Unknown calculation statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, outputName, "calculation")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerLabel(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("label ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
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
		lines: [`fn ${semanticFunctionName(label, "label", "label")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerExternal(lines: string[], start: number): { lines: string[]; next: number } {
	const body = collectSemanticBody(lines, start + 1);
	const output: string[] = [];
	for (const line of body.lines) {
		const match = line.match(/^(.+)\((.*)\):\s*(.+?)\s+from\s+"([^"]+)"(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/);
		if (!match) throw new Error(`Unknown external declaration: ${line}`);
		const name = toIdentifier(match[1] ?? "");
		const params = (match[2] ?? "")
			.split(",")
			.map((param) => param.trim())
			.filter(Boolean)
			.map((param) => {
				const binding = parseTypedBinding(param);
				return `${toIdentifier(binding.name)}: ${binding.type}`;
			});
		const returnType = normalizeTypeExpressionSource(match[3] ?? "Void");
		const importName = match[5] ? ` as ${match[5]}` : "";
		output.push(`external fn ${name}(${params.join(", ")}): ${returnType} from ${JSON.stringify(match[4])}${importName}`);
	}
	output.push("");
	return { lines: output, next: body.next };
}

function lowerAction(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("action ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
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
		if (line.startsWith("touches ")) continue;
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown action statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, outputName, "action")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerPolicy(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("policy ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
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
		if (line.startsWith("allow ") || line.startsWith("require ")) {
			const expression = line.replace(/^(allow|require)\s+/, "");
			statements.push(`return ${lowerExpression(expression, paramTypes, records, bindings)}`);
			continue;
		}
		if (line.startsWith("deny ")) {
			statements.push(`return ${lowerExpression(line.slice("deny ".length), paramTypes, records, bindings)} == false`);
			continue;
		}
		throw new Error(`Unknown policy statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, "policy", "policy")}(${params.join(", ")}): Bool {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerView(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("view ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
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
		if (line.startsWith("render ")) {
			statements.push(`return ${lowerClassPrefixedRender(line.slice("render ".length), paramTypes, records, bindings)}`);
			continue;
		}
		const whenRenderClass = line.match(/^when (.+) render class "([^"]+)" (.+)$/);
		if (whenRenderClass) {
			statements.push(`if ${lowerExpression(whenRenderClass[1] ?? "", paramTypes, records, bindings)} {`);
			statements.push(`  return ${lowerExpression(whenRenderClass[3] ?? "", paramTypes, records, bindings)}`);
			statements.push("}");
			continue;
		}
		const whenRender = line.match(/^when (.+) render (.+)$/);
		if (whenRender) {
			statements.push(`if ${lowerExpression(whenRender[1] ?? "", paramTypes, records, bindings)} {`);
			statements.push(`  return ${lowerExpression(whenRender[2] ?? "", paramTypes, records, bindings)}`);
			statements.push("}");
			continue;
		}
		throw new Error(`Unknown view statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, "view", "view")}(${params.join(", ")}): Text {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerClassPrefixedRender(
	rest: string,
	paramTypes: Map<string, string>,
	records: Map<string, Map<string, string>>,
	bindings: Map<string, string>,
): string {
	const classMatch = rest.match(/^class "([^"]+)" (.+)$/);
	if (classMatch) {
		return lowerExpression(classMatch[2] ?? "", paramTypes, records, bindings);
	}
	return lowerExpression(rest, paramTypes, records, bindings);
}

function lowerLayout(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("layout ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
	let defaultExpression = '""';

	for (const line of body.lines) {
		const slotMatch = line.match(/^slot (\w+) render (.+)$/);
		if (!slotMatch) throw new Error(`Unknown layout statement: ${line}`);
		if (slotMatch[1] === "main") {
			defaultExpression = lowerExpression(slotMatch[2] ?? "", paramTypes, records, bindings);
		}
	}

	return {
		lines: [`fn ${semanticFunctionName(label, "layout", "layout")}(): Text {`, `  return ${defaultExpression}`, "}", ""],
		next: body.next,
	};
}

function lowerPage(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("page ".length).trim();
	const body = collectPageBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
	let mainExpression: string | undefined;

	for (const line of body.lines) {
		if (line.startsWith("input ")) {
			const param = parseTypedBinding(line.slice("input ".length));
			const paramName = toIdentifier(param.name);
			params.push(`${paramName}: ${param.type}`);
			paramTypes.set(paramName, param.type);
			bindings.set(param.name, paramName);
			continue;
		}
		if (line.startsWith("title ") || line.startsWith("description ") || line.startsWith("layout ")) continue;
		if (line.startsWith("main render class ")) {
			const mainRenderClass = line.match(/^main render class "([^"]+)" (.+)$/);
			if (mainRenderClass) {
				mainExpression = lowerExpression(mainRenderClass[2] ?? "", paramTypes, records, bindings);
				continue;
			}
		}
		if (line.startsWith("main render ")) {
			mainExpression = lowerExpression(line.slice("main render ".length), paramTypes, records, bindings);
			continue;
		}
		throw new Error(`Unknown page statement: ${line}`);
	}

	if (!mainExpression) throw new Error(`Page ${label} requires main render`);

	return {
		lines: [`fn ${semanticFunctionName(label, "page", "page")}(${params.join(", ")}): Text {`, `  return ${mainExpression}`, "}", ""],
		next: body.next,
	};
}

function lowerStreamRoute(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("stream route ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const output: string[] = [];
	let messageType = "Text";

	for (const line of body.lines) {
		if (line.startsWith("path ")) continue;
		if (line.startsWith("message ")) {
			messageType = toPascalCase(line.slice("message ".length).trim());
			continue;
		}
		const handlerMatch = line.match(/^on (connect|message|disconnect)(?:\s+([A-Za-z][A-Za-z0-9_ ]*))?\s+return\s+(.+)$/);
		if (!handlerMatch) throw new Error(`Unknown stream route statement: ${line}`);
		const event = handlerMatch[1] ?? "connect";
		const inputLabel = handlerMatch[2]?.trim();
		const returnSource = handlerMatch[3] ?? "";
		const paramTypes = new Map<string, string>();
		const bindings = new Map<string, string>(externalBindings);
		const params: string[] = [];
		if (event === "message" && inputLabel) {
			const paramName = toIdentifier(inputLabel);
			params.push(`${paramName}: ${messageType}`);
			paramTypes.set(paramName, messageType);
			bindings.set(inputLabel, paramName);
		}
		const handlerName =
			event === "connect"
				? `${semanticFunctionName(label, "stream", "streamRoute")}Connect`
				: event === "message"
					? `${semanticFunctionName(label, "stream", "streamRoute")}Message`
					: `${semanticFunctionName(label, "stream", "streamRoute")}Disconnect`;
		const returnType = returnSource.trim() === "none" ? "Void" : event === "message" && returnSource.includes("{") ? messageType : "Text";
		output.push(
			`fn ${handlerName}(${params.join(", ")}): ${returnType} {`,
			`  return ${lowerExpression(returnSource, paramTypes, records, bindings)}`,
			"}",
			"",
		);
	}

	return { lines: output, next: body.next };
}

function lowerMiddleware(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("middleware ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
	let outputName = "response";
	let outputType = "Maybe Text";
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
		throw new Error(`Unknown middleware statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, outputName, "middleware")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerRoute(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("route ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
	let outputName = "response";
	let outputType = "Text";
	const statements: string[] = [];

	for (const line of body.lines) {
		if (line.startsWith("method ") || line.startsWith("path ") || line.startsWith("before ")) continue;
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
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown route statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, "route", "route")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerWorkflow(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("workflow ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
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
		const step = line.match(/^step (.+) is (.+)$/);
		if (step) {
			const name = toIdentifier(step[1] ?? "");
			bindings.set(step[1]?.trim() ?? name, name);
			statements.push(`let ${name}: ${outputType} = ${lowerExpression(step[2] ?? "", paramTypes, records, bindings)}`);
			continue;
		}
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown workflow statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, "workflow", "workflow")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

function lowerCommand(
	lines: string[],
	start: number,
	records: Map<string, Map<string, string>>,
	externalBindings: Map<string, string> = new Map(),
): { lines: string[]; next: number } {
	const label = (lines[start] ?? "").trim().slice("command ".length).trim();
	const body = collectSemanticBody(lines, start + 1);
	const params: string[] = [];
	const paramTypes = new Map<string, string>();
	const bindings = new Map<string, string>(externalBindings);
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
		if (line.startsWith("return ")) {
			statements.push(`return ${lowerExpression(line.slice("return ".length), paramTypes, records, bindings)}`);
			continue;
		}
		throw new Error(`Unknown command statement: ${line}`);
	}

	return {
		lines: [`fn ${semanticFunctionName(label, "command", "command")}(${params.join(", ")}): ${outputType} {`, ...indentRaw(statements), "}", ""],
		next: body.next,
	};
}

interface SemanticDeclarationInfo {
	kind: "record" | "calculation" | "rule" | "label";
	name: string;
	loweredName: string;
	outputName?: string;
	fields?: Map<string, string>;
	params?: Map<string, string>;
	effects?: string[];
}

function attachSemanticMetadata(program: PointCoreProgram, source: string) {
	program.semantic = { source: "semantic" };
	const declarations = collectSemanticDeclarationInfo(source);
	const byLoweredName = new Map(declarations.map((declaration) => [declaration.loweredName, declaration]));
	for (const declaration of program.declarations) {
		if (declaration.kind !== "type" && declaration.kind !== "function" && declaration.kind !== "external") continue;
		const semantic = byLoweredName.get(declaration.name);
		if (!semantic) continue;
		declaration.semantic = {
			kind: semantic.kind,
			name: semantic.name,
			outputName: semantic.outputName,
			effects: semantic.effects,
		};
		if (declaration.kind === "type") {
			for (const field of declaration.fields) {
				field.semanticName = semantic.fields ? findSemanticName(semantic.fields, field.name) : field.name;
			}
		}
		if (declaration.kind === "function" || declaration.kind === "external") {
			for (const param of declaration.params) {
				param.semanticName = semantic.params ? findSemanticName(semantic.params, param.name) : param.name;
			}
		}
	}
}

function collectSemanticDeclarationInfo(source: string): SemanticDeclarationInfo[] {
	const lines = source.split(/\r?\n/);
	const records = new Map<string, Map<string, string>>();
	const declarations: SemanticDeclarationInfo[] = [];
	let index = 0;
	while (index < lines.length) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed || trimmed.startsWith("module ")) {
			index += 1;
			continue;
		}
		if (trimmed.startsWith("record ")) {
			const name = trimmed.slice("record ".length).trim();
			const fields = new Map<string, string>();
			index += 1;
			for (; index < lines.length; index += 1) {
				const line = (lines[index] ?? "").trim();
				if (!line) continue;
				if (isSemanticTopLevel(line)) break;
				const colon = line.indexOf(":");
				if (colon !== -1) fields.set(line.slice(0, colon).trim(), toIdentifier(line.slice(0, colon).trim()));
			}
			const loweredName = toPascalCase(name);
			records.set(loweredName, fields);
			declarations.push({ kind: "record", name, loweredName, fields });
			continue;
		}
		if (
			trimmed.startsWith("calculation ") ||
			trimmed.startsWith("rule ") ||
			trimmed.startsWith("label ") ||
			trimmed.startsWith("action ") ||
			trimmed.startsWith("policy ") ||
			trimmed.startsWith("view ") ||
			trimmed.startsWith("layout ") ||
			trimmed.startsWith("page ") ||
			trimmed.startsWith("middleware ") ||
			trimmed.startsWith("route ") ||
			trimmed.startsWith("workflow ") ||
			trimmed.startsWith("command ")
		) {
			const kind = trimmed.startsWith("calculation ")
				? "calculation"
				: trimmed.startsWith("rule ")
					? "rule"
					: trimmed.startsWith("label ")
						? "label"
						: trimmed.startsWith("action ")
							? "action"
							: trimmed.startsWith("policy ")
								? "policy"
								: trimmed.startsWith("view ")
									? "view"
									: trimmed.startsWith("layout ")
										? "layout"
									: trimmed.startsWith("page ")
										? "page"
										: trimmed.startsWith("middleware ")
											? "middleware"
										: trimmed.startsWith("route ")
										? "route"
										: trimmed.startsWith("workflow ")
											? "workflow"
											: "command";
			const prefix = `${kind} `;
			const name = trimmed.slice(prefix.length).trim();
			const body = collectSemanticBody(lines, index + 1);
			const params = new Map<string, string>();
			let outputName =
				kind === "label" ? "label" : kind === "policy" ? "policy" : kind === "view" ? "view" : kind === "layout" ? "layout" : kind === "page" ? "page" : kind === "route" ? "route" : "result";
			const effects: string[] = [];
			for (const line of body.lines) {
				if (line.startsWith("input ")) {
					const param = parseTypedBinding(line.slice("input ".length));
					params.set(param.name, toIdentifier(param.name));
				}
				if (line.startsWith("output ")) {
					const output = parseOutputBinding(line.slice("output ".length));
					outputName = output.name;
				}
				if (line.startsWith("touches ")) effects.push(...line.slice("touches ".length).split(",").map((effect) => effect.trim()).filter(Boolean));
			}
			declarations.push({
				kind,
				name,
				loweredName: semanticFunctionName(name, outputName, kind),
				outputName,
				params,
				effects,
			});
			index = body.next;
			continue;
		}
		if (trimmed.startsWith("external ")) {
			const name = trimmed.slice("external ".length).trim();
			const body = collectSemanticBody(lines, index + 1);
			for (const line of body.lines) {
				const match = line.match(/^(.+)\(/);
				if (match) declarations.push({ kind: "external", name: match[1]?.trim() ?? name, loweredName: toIdentifier(match[1] ?? name) });
			}
			index = body.next;
			continue;
		}
		index += 1;
	}
	return declarations;
}

function collectExternalBindings(source: string): Map<string, string> {
	const bindings = new Map<string, string>();
	const lines = source.split(/\r?\n/);
	let index = 0;
	while (index < lines.length) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed.startsWith("external ")) {
			index += 1;
			continue;
		}
		const body = collectSemanticBody(lines, index + 1);
		for (const line of body.lines) {
			const match = line.match(/^(.+)\(/);
			if (match) bindings.set(match[1]?.trim() ?? "", toIdentifier(match[1] ?? ""));
		}
		index = body.next;
	}
	return bindings;
}

function collectImportedBindings(source: string, cwd: string): Map<string, string> {
	const bindings = new Map<string, string>();
	try {
		const lock = readPointLockSync(cwd);
		const visited = new Set<string>();
		const pending = [...scanUseDeclarations(source)];
		while (pending.length > 0) {
			const use = pending.pop()!;
			const key = use.from ?? use.moduleName;
			if (visited.has(key)) continue;
			visited.add(key);
			let dependencySource: string | null = null;
			try {
				const from = use.from ?? modulePathFromLock(lock, use.moduleName, cwd);
				const path = resolve(cwd, from);
				if (existsSync(path)) dependencySource = readFileSync(path, "utf8");
			} catch {
				dependencySource = null;
			}
			if (!dependencySource) continue;
			for (const [label, identifier] of collectExternalBindings(dependencySource)) bindings.set(label, identifier);
			for (const [label, identifier] of collectCallableBindings(dependencySource)) bindings.set(label, identifier);
			for (const nestedUse of scanUseDeclarations(dependencySource)) pending.push(nestedUse);
		}
	} catch {
		return bindings;
	}
	return bindings;
}

function collectCallableBindings(source: string): Map<string, string> {
	const bindings = new Map<string, string>();
	for (const declaration of collectSemanticDeclarationInfo(source)) {
		if (
			declaration.kind === "calculation" ||
			declaration.kind === "rule" ||
			declaration.kind === "label" ||
			declaration.kind === "action" ||
			declaration.kind === "policy" ||
			declaration.kind === "view" ||
			declaration.kind === "layout" ||
			declaration.kind === "page" ||
			declaration.kind === "middleware" ||
			declaration.kind === "route" ||
			declaration.kind === "workflow" ||
			declaration.kind === "command"
		) {
			bindings.set(declaration.name, declaration.loweredName);
		}
	}
	return bindings;
}

function findSemanticName(names: Map<string, string>, loweredName: string): string {
	for (const [semanticName, candidate] of names) {
		if (candidate === loweredName) return semanticName;
	}
	return loweredName;
}

function collectPageBody(lines: string[], start: number): { lines: string[]; next: number } {
	const body: string[] = [];
	let index = start;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isSemanticTopLevel(trimmed) && !trimmed.startsWith("layout ")) break;
		body.push(trimmed);
	}
	return { lines: body, next: index };
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
	return /^(module|use|record|variant|calculation|rule|label|external|action|policy|view|layout|navigation|page|middleware|stream route|route|workflow|pipeline|session|command|schedule|prompt|type|fn|let|var|import)\s+/.test(line);
}

function isSemanticLoopBoundary(line: string): boolean {
	return (
		line.startsWith("input ") ||
		line.startsWith("output ") ||
		line.startsWith("return ") ||
		line.startsWith("for each ") ||
		/^(.+) starts (at|as) (.+)$/.test(line)
	);
}

function lowerSemanticMutationStatement(
	line: string,
	paramTypes: Map<string, string>,
	records: Map<string, Map<string, string>>,
	bindings: Map<string, string>,
): string[] {
	const addTo = line.match(/^add (.+) to (.+)$/);
	if (addTo) {
		return [`${lowerExpression(addTo[2] ?? "", paramTypes, records, bindings)} += ${lowerExpression(addTo[1] ?? "", paramTypes, records, bindings)}`];
	}
	const subtractFrom = line.match(/^subtract (.+) from (.+)$/);
	if (subtractFrom) {
		return [`${lowerExpression(subtractFrom[2] ?? "", paramTypes, records, bindings)} -= ${lowerExpression(subtractFrom[1] ?? "", paramTypes, records, bindings)}`];
	}
	const setTo = line.match(/^set (.+) to (.+)$/);
	if (setTo) {
		return [`${lowerExpression(setTo[1] ?? "", paramTypes, records, bindings)} = ${lowerExpression(setTo[2] ?? "", paramTypes, records, bindings)}`];
	}
	return [];
}

function listItemTypeFor(source: string, paramTypes: Map<string, string>, bindings: Map<string, string>): string | null {
	const trimmed = source.trim();
	const identifier = bindings.get(trimmed) ?? toIdentifier(trimmed);
	const type = paramTypes.get(identifier);
	const match = type?.match(/^List<(.+)>$/);
	return match?.[1] ?? null;
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
	const lookupMatch = expression.match(/^lookup\s+(.+?)\s+((?:"(?:\\.|[^"\\])*")|[A-Za-z][A-Za-z0-9 ]*)$/);
	if (lookupMatch) {
		return `pointMapLookup(${lowerExpression(lookupMatch[1] ?? "", paramTypes, records, bindings)}, ${lowerExpression(lookupMatch[2] ?? "", paramTypes, records, bindings)})`;
	}
	if (/^map\s*\{/.test(expression)) {
		expression = expression.replace(/^map\s+/, "");
	}
	expression = expression.replace(/^Error\s+"([^"]*)"$/, (_match, message: string) => `Error(${JSON.stringify(message)})`);
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
	for (const fields of records.values()) {
		for (const [label, field] of [...fields].sort((a, b) => b[0].length - a[0].length)) {
			expression = replaceRecordFieldLabel(expression, label, field);
		}
	}
	return expression;
}

function replaceSemanticName(source: string, label: string, identifier: string): string {
	if (label === identifier) return source;
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return source.replace(new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), identifier);
}

function replaceRecordFieldLabel(source: string, label: string, identifier: string): string {
	if (label === identifier) return source;
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return source.replace(new RegExp(`([{,]\\s*)${escaped}(?=\\s*:)`, "g"), `$1${identifier}`);
}

function toIdentifier(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word, index) => (index === 0 ? word.toLowerCase() : toPascalCase(word))).join("");
}

function semanticFunctionName(
	label: string,
	outputName: string,
	kind: "calculation" | "rule" | "label" | "action" | "policy" | "view" | "layout" | "page" | "middleware" | "route" | "streamRoute" | "workflow" | "command",
): string {
	const base = toIdentifier(label);
	const suffix =
		kind === "label"
			? "Label"
			: kind === "policy"
				? "Policy"
				: kind === "view"
					? "View"
					: kind === "layout"
						? "Layout"
					: kind === "page"
						? "Page"
						: kind === "route"
						? "Route"
						: kind === "streamRoute"
							? "StreamRoute"
							: kind === "middleware"
								? "Middleware"
							: kind === "workflow"
							? "Workflow"
							: kind === "command"
								? "Command"
								: toPascalCase(outputName);
	if (!suffix) return base;
	return base.toLowerCase().endsWith(suffix.toLowerCase()) ? base : `${base}${suffix}`;
}

function toPascalCase(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join("");
}

function normalizeTypeExpressionSource(source: string): string {
	const trimmed = source.trim();
	const listMatch = trimmed.match(/^List<(.+)>$/);
	if (listMatch) return `List<${normalizeTypeExpressionSource(listMatch[1] ?? "")}>`;
	const maybeMatch = trimmed.match(/^Maybe<(.+)>$/);
	if (maybeMatch) return `Maybe<${normalizeTypeExpressionSource(maybeMatch[1] ?? "")}>`;
	const orParts = splitTopLevelOr(trimmed);
	if (orParts.length > 1) return `Or<${orParts.map(normalizeTypeExpressionSource).join(", ")}>`;
	const maybeSpaceMatch = trimmed.match(/^Maybe\s+(.+)$/);
	if (maybeSpaceMatch) return `Maybe<${normalizeTypeExpressionSource(maybeSpaceMatch[1] ?? "")}>`;
	const listSpaceMatch = trimmed.match(/^List\s+(.+)$/);
	if (listSpaceMatch) return `List<${normalizeTypeExpressionSource(listSpaceMatch[1] ?? "")}>`;
	if (
		trimmed === "Text" ||
		trimmed === "Int" ||
		trimmed === "Float" ||
		trimmed === "Bool" ||
		trimmed === "Void" ||
		trimmed === "Maybe" ||
		trimmed === "Error" ||
		trimmed === "Or"
	) {
		return trimmed;
	}
	return toPascalCase(trimmed);
}

function splitTopLevelOr(source: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = "";
	for (const token of source.split(/(\s+or\s+|[<>])/)) {
		if (!token) continue;
		if (token === "<") depth += 1;
		if (token === ">") depth -= 1;
		if (depth === 0 && /^\s+or\s+$/.test(token)) {
			parts.push(current.trim());
			current = "";
			continue;
		}
		current += token;
	}
	if (parts.length === 0) return [source];
	parts.push(current.trim());
	return parts;
}

function indentRaw(lines: string[]): string[] {
	return lines.map((line) => `  ${line}`);
}
