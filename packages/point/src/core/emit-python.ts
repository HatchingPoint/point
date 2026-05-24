import type {
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreExternalDeclaration,
	PointCoreFunctionDeclaration,
	PointCoreParameter,
	PointCorePrimitiveType,
	PointCoreProgram,
	PointCoreStatement,
	PointCoreTypeDeclaration,
	PointCoreTypeExpression,
	PointCoreValueDeclaration,
} from "./ast.ts";
import type { PointSemanticMiddlewareDeclaration, PointSemanticRouteDeclaration } from "../semantic/ast.ts";
import { toIdentifier, toPascalCase } from "../semantic/naming.ts";
import { programHasOrchestrationExtensions } from "./emit-workflow.ts";
import { programHasPipelines } from "./emit-pipeline.ts";
import { emitPythonRouteServeCommand, emitPythonRouteServerRuntime } from "./emit-python-routes.ts";
import { emitPythonWorkflowHelpers, emitPythonWorkflowTimedStepCall } from "./emit-python-workflow.ts";
import { emitPythonPipelineHelpers } from "./emit-python-pipeline.ts";

const BINARY_OPERATORS: Record<string, string> = {
	and: "and",
	or: "or",
};

const UNSUPPORTED_SEMANTIC_KINDS = new Set(["view", "page"]);
const POINT_STD_PREFIX = "@hatchingpoint/point/std/";
const POINT_STD_MODULE_NAMES = new Set([
	"ai",
	"crypto",
	"env",
	"fs",
	"http",
	"json",
	"money",
	"path",
	"process",
	"sql",
	"stream",
	"text",
	"time",
	"yaml",
]);
const ASYNC_POINT_STD_SYMBOLS = new Set([
	"processSpawn",
	"processStreamLines",
	"httpGet",
	"httpPost",
	"httpFetch",
	"streamReadText",
	"streamWriteText",
	"streamReadLines",
	"streamWriteLines",
	"openaiComplete",
	"openaiStream",
	"anthropicComplete",
	"anthropicStream",
	"sleep",
]);

const POINT_STD_SYMBOL_ALIASES: Record<string, Record<string, string>> = {
	ai: {
		openaiCompleteRaw: "openaiComplete",
		openaiStreamRaw: "openaiStream",
		anthropicCompleteRaw: "anthropicComplete",
		anthropicStreamRaw: "anthropicStream",
		envGetRaw: "envGet",
	},
	crypto: {
		sha256Hash: "cryptoSha256",
		hmacSha256: "cryptoHmacSha256",
		jwtSign: "cryptoJwtSign",
		jwtVerify: "cryptoJwtVerify",
		checkJwtValid: "cryptoJwtIsValid",
	},
	env: { envGetRaw: "envGet" },
	fs: { readFileRaw: "readFile", writeFileRaw: "writeFile" },
	http: {
		httpGetRaw: "httpGet",
		httpPostRaw: "httpPost",
		httpFetchRaw: "httpFetch",
		httpAssertStatusRaw: "httpAssertStatus",
		httpAssertJsonBodyRaw: "httpAssertJsonBody",
	},
	path: { joinPaths: "pathJoin", resolvePath: "pathResolve" },
	process: { spawnRaw: "processSpawn", streamLinesRaw: "processStreamLines" },
	stream: {
		streamReadTextRaw: "streamReadText",
		streamWriteTextRaw: "streamWriteText",
		streamReadLinesRaw: "streamReadLines",
		streamWriteLinesRaw: "streamWriteLines",
		streamJoinLinesRaw: "streamJoinLines",
	},
	time: {
		instantNowRaw: "instantNow",
		parseInstantRaw: "parseInstant",
		formatInstantRaw: "formatInstant",
		timeNow: "now",
		sleepMilliseconds: "sleep",
		durationFromSecondsRaw: "durationFromSeconds",
		durationToSecondsRaw: "durationToSeconds",
	},
};

function isPointStdExternal(from: string): boolean {
	return from.startsWith(POINT_STD_PREFIX);
}

function isPointStdModuleName(moduleName: string): boolean {
	return POINT_STD_MODULE_NAMES.has(moduleName);
}

function buildPointStdSymbolLookup(program: PointCoreProgram): Map<string, string> {
	const lookup = new Map<string, string>();
	for (const declaration of program.declarations) {
		if (declaration.kind !== "external" || !isPointStdExternal(declaration.from)) continue;
		const moduleName = declaration.from.slice(POINT_STD_PREFIX.length);
		lookup.set(`${moduleName}:${declaration.name}`, declaration.importName ?? declaration.name);
	}
	return lookup;
}

function resolvePointStdImportName(moduleName: string, publicName: string, lookup: Map<string, string>): string {
	return lookup.get(`${moduleName}:${publicName}`) ?? POINT_STD_SYMBOL_ALIASES[moduleName]?.[publicName] ?? publicName;
}

function buildAsyncStdCallSet(program: PointCoreProgram): Set<string> {
	const symbols = new Set(ASYNC_POINT_STD_SYMBOLS);
	for (const declaration of program.declarations) {
		if (declaration.kind !== "external" || !isPointStdExternal(declaration.from)) continue;
		const imported = declaration.importName ?? declaration.name;
		if (ASYNC_POINT_STD_SYMBOLS.has(imported)) symbols.add(declaration.name);
	}
	return symbols;
}

function programUsesPointStd(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => {
		if (declaration.kind === "external") return isPointStdExternal(declaration.from);
		if (declaration.kind !== "import") return false;
		const moduleName = toPythonModuleName(declaration.from.replace(/^\.\//, "").replace(/-/g, "_"));
		return isPointStdModuleName(moduleName);
	});
}

function programUsesRelativeSiblingImports(program: PointCoreProgram): boolean {
	return program.declarations.some(
		(declaration) =>
			declaration.kind === "import" && (declaration.from.startsWith("./") || declaration.from.startsWith("../")),
	);
}

function emitPythonRuntimeBootstrap(program: PointCoreProgram): string[] {
	const useStd = programUsesPointStd(program);
	const useSiblingImports = programUsesRelativeSiblingImports(program);
	if (!useStd && !useSiblingImports) return [];
	const lines = ["import sys", "from pathlib import Path as _PointPath", "_point_here = _PointPath(__file__).resolve()"];
	if (useSiblingImports) {
		lines.push(
			"_point_module_dir = _point_here.parent",
			"if str(_point_module_dir) not in sys.path:",
			"    sys.path.insert(0, str(_point_module_dir))",
		);
	}
	if (useStd) {
		lines.push(
			"_point_std_candidates = [_point_here.parents[1] / \"packages\" / \"point\" / \"python_std\"]",
			"for _point_parent in _point_here.parents:",
			"    _point_std_candidates.append(_point_parent / \"node_modules\" / \"@hatchingpoint\" / \"point\" / \"python_std\")",
			"_point_std_root = next((candidate for candidate in _point_std_candidates if candidate.is_dir()), None)",
			"if _point_std_root is not None and str(_point_std_root) not in sys.path:",
			"    sys.path.insert(0, str(_point_std_root))",
		);
	}
	return lines;
}

/** True when every declaration is emit-able as Python batch emit (no views, routes, workflows, commands, or variants). */
export function isPureLogicProgram(program: PointCoreProgram): boolean {
	const routes = program.semanticSource?.declarations.filter((declaration) => declaration.kind === "route") ?? [];
	if (routes.length > 0) return false;
	return !program.declarations.some((declaration) => {
		if (declaration.semantic && UNSUPPORTED_SEMANTIC_KINDS.has(declaration.semantic.kind)) return true;
		if (declaration.semantic?.kind === "route") return true;
		if (declaration.kind === "type" && declaration.semantic?.kind === "variant") return true;
		return false;
	});
}

/** Emit Python from a core AST program. Production path: parsePointSource → check → emit. */
export function emitPointCorePython(program: PointCoreProgram): string {
	const routes = program.semanticSource?.declarations.filter((declaration): declaration is PointSemanticRouteDeclaration => declaration.kind === "route") ?? [];
	const routeServeCommand = program.declarations.find((declaration) => declaration.kind === "function" && isRouteServeCommand(declaration));
	const lines: string[] = [];
	lines.push("# Generated by Point. Do not edit directly.");
	if (program.module) lines.push(`# Point module: ${program.module}`);
	lines.push("");
	lines.push("from __future__ import annotations");
	lines.push("");
	const bootstrap = emitPythonRuntimeBootstrap(program);
	if (bootstrap.length > 0) {
		lines.push(...bootstrap, "");
	}
	if (programHasOrchestrationExtensions(program) || programHasPipelines(program)) {
		lines.push(...emitPythonWorkflowHelpers(program));
	}
	if (programHasPipelines(program)) {
		lines.push(...emitPythonPipelineHelpers());
	}
	const typingImports: string[] = [];
	if (program.declarations.some((declaration) => declaration.kind === "type")) typingImports.push("TypedDict");
	if (programHasPipelines(program)) typingImports.push("Callable");
	if (typingImports.length > 0) lines.push(`from typing import ${typingImports.join(", ")}`);
	if (routes.length > 0) {
		lines.push("import json");
		lines.push("import os");
		lines.push("import re");
	}
	if (typingImports.length > 0 || routes.length > 0) lines.push("");
	const pointStdLookup = buildPointStdSymbolLookup(program);
	const asyncStdCalls = buildAsyncStdCallSet(program);
	for (const declaration of program.declarations) {
		if (declaration.kind === "function" && declaration.semantic?.kind === "command" && routes.length > 0 && isRouteServeCommand(declaration)) {
			lines.push(...emitPythonRouteServeCommand(declaration.name, declaration.params.map(emitParam)), "");
			continue;
		}
		const emitted = emitDeclaration(declaration, routes.length > 0, pointStdLookup, asyncStdCalls);
		if (emitted.length > 0) lines.push(...emitted, "");
	}
	if (routes.length > 0 && routeServeCommand) {
		const middlewareByName = buildMiddlewareMap(program.semanticSource?.declarations ?? []);
		const records = buildRecordFieldMap(program.semanticSource?.declarations ?? []);
		lines.push(...emitPythonRouteServerRuntime(routes, middlewareByName, records), "");
	}
	lines.push(...emitPythonCommandMain(program, routes.length > 0));
	return `${trimTrailingBlankLines(lines).join("\n")}\n`;
}

function emitDeclaration(
	declaration: PointCoreDeclaration,
	hasRoutes: boolean,
	pointStdLookup: Map<string, string>,
	asyncStdCalls: Set<string>,
): string[] {
	if (declaration.kind === "import") return emitImportDeclaration(declaration, pointStdLookup);
	if (declaration.kind === "external") return emitExternal(declaration);
	if (declaration.kind === "type") return emitType(declaration);
	if (declaration.kind === "value") return [emitValue(declaration, false, asyncStdCalls)];
	if (declaration.semantic && UNSUPPORTED_SEMANTIC_KINDS.has(declaration.semantic.kind)) {
		return [`# Point: ${declaration.semantic.kind} blocks are not supported in Python emit yet`];
	}
	if (declaration.kind === "function" && declaration.semantic?.kind === "command" && hasRoutes && isRouteServeCommand(declaration)) {
		return [];
	}
	return emitFunction(declaration, asyncStdCalls);
}

function emitImportDeclaration(declaration: Extract<PointCoreDeclaration, { kind: "import" }>, pointStdLookup: Map<string, string>): string[] {
	const from = declaration.from.replaceAll("\\", "/");
	const isRelativeImport = from.startsWith("./") || from.startsWith("../");
	const stdModuleMatch = from.match(/^std\/(.+)$/);
	const moduleName = toPythonModuleName((stdModuleMatch?.[1] ?? from.replace(/^\.\//, "")).replace(/-/g, "_"));
	if (isRelativeImport || !isPointStdModuleName(moduleName)) {
		return [`from ${moduleName} import ${declaration.names.join(", ")}`];
	}
	return declaration.names.map((name) => {
		const imported = resolvePointStdImportName(moduleName, name, pointStdLookup);
		return imported === name
			? `from point_std.${moduleName} import ${imported}`
			: `from point_std.${moduleName} import ${imported} as ${name}`;
	});
}

function emitType(declaration: PointCoreTypeDeclaration): string[] {
	const fieldLines = declaration.fields.map((field) => `    ${field.name}: ${emitTypeExpression(field.type)}`);
	if (fieldLines.length === 0) {
		return [`class ${declaration.name}(TypedDict):`, "    pass"];
	}
	return [`class ${declaration.name}(TypedDict):`, ...fieldLines];
}

function emitExternal(declaration: PointCoreExternalDeclaration): string[] {
	if (declaration.from === "node:fs" && declaration.importName === "readFileSync") {
		return [
			`def ${declaration.name}(${declaration.params.map(emitParam).join(", ")}) -> ${emitTypeExpression(declaration.returnType)}:`,
			"    from pathlib import Path",
			"    return Path(path).read_text()",
		];
	}
	if (isPointStdExternal(declaration.from)) {
		const moduleName = `point_std.${declaration.from.slice(POINT_STD_PREFIX.length)}`;
		const imported = declaration.importName ?? declaration.name;
		return [`from ${moduleName} import ${imported} as ${declaration.name}`];
	}
	const moduleName = declaration.from.replace(/^\.\//, "").replace(/-/g, "_");
	const imported = declaration.importName ?? declaration.name;
	return [`from ${toPythonModuleName(moduleName)} import ${imported} as ${declaration.name}`];
}

function emitFunction(declaration: PointCoreFunctionDeclaration, asyncStdCalls: Set<string>): string[] {
	const isStreamAction = declaration.semantic?.isStreamAction === true;
	const isAsync =
		isStreamAction ||
		declaration.semantic?.kind === "action" ||
		declaration.semantic?.kind === "workflow" ||
		declaration.semantic?.kind === "pipeline" ||
		declaration.semantic?.kind === "command";
	return [
		`${isAsync ? "async " : ""}def ${declaration.name}(${declaration.params.map(emitParam).join(", ")}) -> ${emitReturnType(declaration)}:`,
		...indentLines(declaration.body.flatMap((statement) => emitStatement(statement, declaration.semantic?.kind, isAsync, asyncStdCalls))),
	];
}

function emitReturnType(declaration: PointCoreFunctionDeclaration): string {
	if (declaration.semantic?.kind === "action" || declaration.semantic?.kind === "workflow" || declaration.semantic?.kind === "pipeline" || declaration.semantic?.kind === "command") {
		return emitTypeExpression(declaration.returnType);
	}
	return emitTypeExpression(declaration.returnType);
}

function emitStatement(
	statement: PointCoreStatement,
	semanticKind: string | undefined,
	inAsyncFunction: boolean,
	asyncStdCalls: Set<string>,
): string[] {
	if (statement.kind === "yield") {
		if (!statement.value) return ["yield"];
		if (statement.value.kind === "call") {
			const iterable = `${statement.value.callee}(${statement.value.args.map((arg) => emitExpression(arg, inAsyncFunction, asyncStdCalls)).join(", ")})`;
			return [`async for __point_line in ${iterable}:`, "    yield __point_line"];
		}
		return [`async for __point_line in ${emitExpression(statement.value, inAsyncFunction, asyncStdCalls)}:`, "    yield __point_line"];
	}
	if (statement.kind === "return") {
		if (semanticKind === "view" || semanticKind === "page") return ["# Point: view/page return values are not supported in Python emit yet", "return \"\""];
		return [statement.value ? `return ${emitExpression(statement.value, inAsyncFunction, asyncStdCalls)}` : "return"];
	}
	if (statement.kind === "value") return [emitValue(statement, false, asyncStdCalls)];
	if (statement.kind === "assignment") {
		return [`${statement.name} ${statement.operator} ${emitExpression(statement.value, inAsyncFunction, asyncStdCalls)}`];
	}
	if (statement.kind === "if") {
		const lines = [
			`if ${emitCondition(statement.condition, inAsyncFunction, asyncStdCalls)}:`,
			...indentLines(statement.thenBody.flatMap((child) => emitStatement(child, semanticKind, inAsyncFunction, asyncStdCalls))),
		];
		if (statement.elseBody.length > 0) {
			lines.push("else:", ...indentLines(statement.elseBody.flatMap((child) => emitStatement(child, semanticKind, inAsyncFunction, asyncStdCalls))));
		}
		return lines;
	}
	if (statement.kind === "for") {
		return [
			`for ${statement.itemName} in ${emitExpression(statement.iterable, inAsyncFunction, asyncStdCalls)}:`,
			...indentLines(statement.body.flatMap((child) => emitStatement(child, semanticKind, inAsyncFunction, asyncStdCalls))),
		];
	}
	if (statement.kind === "expression") {
		return [emitExpression(statement.value, inAsyncFunction, asyncStdCalls)];
	}
	return [];
}

function emitValue(declaration: PointCoreValueDeclaration, inAsyncFunction: boolean, asyncStdCalls: Set<string>): string {
	return `${declaration.name}: ${emitTypeExpression(declaration.type)} = ${emitExpression(declaration.value, inAsyncFunction, asyncStdCalls)}`;
}

function emitParam(param: PointCoreParameter): string {
	if (param.name === "__pointPipelineLog") {
		return `${param.name}: Callable[[dict[str, object]], None] | None = None`;
	}
	return `${param.name}: ${emitTypeExpression(param.type)}`;
}

function emitTypeExpression(type: PointCoreTypeExpression): string {
	if (type.name === "Handler" && type.args.length === 1) {
		return `Callable[[${emitTypeExpression(type.args[0]!)}], None]`;
	}
	if (type.name === "List") return `list[${type.args[0] ? emitTypeExpression(type.args[0]) : "object"}]`;
	if (type.name === "Maybe") return `${type.args[0] ? emitTypeExpression(type.args[0]) : "object"} | None`;
	if (type.name === "Or") return type.args.map(emitTypeExpression).join(" | ");
	if (type.name === "Error") return "dict[str, str]";
	if (type.name === "Instant") return "str";
	if (type.name === "Duration") return "int";
	if (isPrimitiveType(type.name)) return emitPrimitiveType(type.name);
	return type.name;
}

function emitPrimitiveType(type: PointCorePrimitiveType): string {
	if (type === "Text") return "str";
	if (type === "Int") return "int";
	if (type === "Float") return "float";
	if (type === "Bool") return "bool";
	return "None";
}

function emitExpression(expression: PointCoreExpression, inAsyncFunction = false, asyncStdCalls: Set<string> = new Set()): string {
	if (expression.kind === "literal") return emitLiteral(expression.value);
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "list") return `[${expression.items.map((item) => emitExpression(item, inAsyncFunction, asyncStdCalls)).join(", ")}]`;
	if (expression.kind === "record") {
		return `{${expression.fields.map((field) => `"${field.name}": ${emitExpression(field.value, inAsyncFunction, asyncStdCalls)}`).join(", ")}}`;
	}
	// Tagged dict / discriminated union (Python parity with TS/JS): every variant lowers to one object whose
	// discriminator is the string field "kind", equal to the Point case label in PascalCase (e.g. Succeeded).
	// Payload field keys match core lowering / Point identifiers (camelCase fragments, e.g. receipt id → receiptId).
	if (expression.kind === "variant") {
		const payload = expression.fields.map((field) => `"${field.name}": ${emitExpression(field.value, inAsyncFunction, asyncStdCalls)}`).join(", ");
		return payload.length > 0
			? `{"kind": ${JSON.stringify(expression.caseName)}, ${payload}}`
			: `{"kind": ${JSON.stringify(expression.caseName)}}`;
	}
	if (expression.kind === "await") return `await ${emitExpression(expression.value, inAsyncFunction, asyncStdCalls)}`;
	if (expression.kind === "property") return `${emitExpression(expression.target, inAsyncFunction, asyncStdCalls)}[${JSON.stringify(expression.name)}]`;
	if (expression.kind === "call") {
		if (expression.callee === "Error") {
			const message = expression.args[0] ? emitExpression(expression.args[0], inAsyncFunction, asyncStdCalls) : '""';
			return `{"message": ${message}}`;
		}
		if (expression.callee === "pointMapLookup") {
			const mapExpr = expression.args[0] ? emitExpression(expression.args[0], inAsyncFunction, asyncStdCalls) : "{}";
			const keyExpr = expression.args[1] ? emitExpression(expression.args[1], inAsyncFunction, asyncStdCalls) : '""';
			return `(${mapExpr}.get(str(${keyExpr})))`;
		}
		if (expression.callee === "pointMapLiteral") {
			const pairs: string[] = [];
			for (let index = 0; index < expression.args.length; index += 2) {
				const keyArg = expression.args[index];
				const valueArg = expression.args[index + 1];
				const key = keyArg?.kind === "literal" && typeof keyArg.value === "string" ? JSON.stringify(keyArg.value) : '""';
				pairs.push(`${key}: ${valueArg ? emitExpression(valueArg, inAsyncFunction, asyncStdCalls) : "None"}`);
			}
			return `{${pairs.join(", ")}}`;
		}
		if (expression.callee === "pointJsonResponse") {
			const body = expression.args[0] ? emitExpression(expression.args[0], inAsyncFunction, asyncStdCalls) : "{}";
			const status = expression.args[1] ? emitExpression(expression.args[1], inAsyncFunction, asyncStdCalls) : "200";
			const headers = expression.args[2] ? emitExpression(expression.args[2], inAsyncFunction, asyncStdCalls) : "None";
			return `point_json_response(${body}, ${status}, ${headers})`;
		}
		if (expression.callee === "pointWorkflowTimedStep") return emitPythonWorkflowTimedStepCall(expression);
		if (expression.callee === "pointPipelineEmitLog") {
			return `point_pipeline_emit_log(${expression.args.map((arg) => emitExpression(arg, inAsyncFunction, asyncStdCalls)).join(", ")})`;
		}
		if (expression.callee === "pointIsError") {
			return `pointIsError(${expression.args.map((arg) => emitExpression(arg, inAsyncFunction, asyncStdCalls)).join(", ")})`;
		}
		const call = `${expression.callee}(${expression.args.map((arg) => emitExpression(arg, inAsyncFunction, asyncStdCalls)).join(", ")})`;
		if (inAsyncFunction && asyncStdCalls.has(expression.callee)) return `await ${call}`;
		return call;
	}
	const operator = BINARY_OPERATORS[expression.operator] ?? expression.operator;
	return `(${emitExpression(expression.left, inAsyncFunction, asyncStdCalls)} ${operator} ${emitExpression(expression.right, inAsyncFunction, asyncStdCalls)})`;
}

function emitLiteral(value: unknown): string {
	if (value === null) return "None";
	if (value === true) return "True";
	if (value === false) return "False";
	if (typeof value === "string") return JSON.stringify(value);
	return String(value);
}

function emitCondition(expression: PointCoreExpression, inAsyncFunction: boolean, asyncStdCalls: Set<string>): string {
	const emitted = emitExpression(expression, inAsyncFunction, asyncStdCalls);
	return emitted.startsWith("(") && emitted.endsWith(")") ? emitted.slice(1, -1) : emitted;
}

function toPythonModuleName(from: string): string {
	return from.replace(/\.ts$/, "").replace(/\.js$/, "").replace(/\.py$/, "");
}

function isPrimitiveType(type: string): type is PointCorePrimitiveType {
	return type === "Text" || type === "Int" || type === "Float" || type === "Bool" || type === "Void";
}

function indentLines(lines: string[]): string[] {
	return lines.map((line) => `    ${line}`);
}

function trimTrailingBlankLines(lines: string[]): string[] {
	while (lines.at(-1) === "") lines.pop();
	return lines;
}

function isRouteServeCommand(declaration: PointCoreFunctionDeclaration): boolean {
	const name = declaration.semantic?.name ?? "";
	return name.toLowerCase().startsWith("serve ");
}

function findCommandEntryName(program: PointCoreProgram): string | null {
	const zeroArgFunctions = program.declarations.filter((declaration) => declaration.kind === "function" && declaration.params.length === 0);
	const preferred =
		zeroArgFunctions.find((declaration) => declaration.semantic?.kind === "command") ??
		zeroArgFunctions.find((declaration) => declaration.name === "main") ??
		zeroArgFunctions[0];
	return preferred?.name ?? null;
}

function emitPythonCommandMain(program: PointCoreProgram, hasRoutes: boolean): string[] {
	const entryName = findCommandEntryName(program);
	if (!entryName) return [];
	const entry = program.declarations.find(
		(declaration): declaration is PointCoreFunctionDeclaration => declaration.kind === "function" && declaration.name === entryName,
	);
	if (!entry || entry.semantic?.kind !== "command") return [];
	if (hasRoutes && isRouteServeCommand(entry)) return [];
	return [
		'if __name__ == "__main__":',
		"    import asyncio",
		`    __point_result = asyncio.run(${entryName}())`,
		"    if __point_result is not None:",
		'        print(__point_result if isinstance(__point_result, str) else __import__("json").dumps(__point_result))',
	];
}

function buildMiddlewareMap(
	declarations: Array<{ kind: string; name?: string } & Partial<PointSemanticMiddlewareDeclaration>>,
): Map<string, PointSemanticMiddlewareDeclaration> {
	const middlewareByName = new Map<string, PointSemanticMiddlewareDeclaration>();
	for (const declaration of declarations) {
		if (declaration.kind === "middleware" && declaration.name) {
			middlewareByName.set(declaration.name, declaration as PointSemanticMiddlewareDeclaration);
		}
	}
	return middlewareByName;
}

function buildRecordFieldMap(
	declarations: Array<{ kind: string; name?: string; fields?: Array<{ label: string }> }>,
): Map<string, Map<string, string>> {
	const records = new Map<string, Map<string, string>>();
	for (const declaration of declarations) {
		if (declaration.kind !== "record" || !declaration.name || !declaration.fields) continue;
		const fields = new Map<string, string>();
		for (const field of declaration.fields) {
			fields.set(field.label, toIdentifier(field.label));
		}
		records.set(toPascalCase(declaration.name), fields);
	}
	return records;
}
