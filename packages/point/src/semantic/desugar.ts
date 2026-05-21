import type {
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreFunctionDeclaration,
	PointCoreExternalDeclaration,
	PointCoreImportDeclaration,
	PointCoreParameter,
	PointCoreProgram,
	PointCoreStatement,
	PointCoreTypeDeclaration,
	PointCoreTypeExpression,
	PointCoreValueDeclaration,
	PointSourceSpan,
} from "../core/ast.ts";
import type {
	PointSemanticBinding,
	PointSemanticCalculationDeclaration,
	PointSemanticCalculationStatement,
	PointSemanticCommandDeclaration,
	PointSemanticDeclaration,
	PointSemanticExpression,
	PointSemanticExternalDeclaration,
	PointSemanticExternalFunction,
	PointSemanticLabelDeclaration,
	PointSemanticLabelStatement,
	PointSemanticMutationStatement,
	PointSemanticOutputBinding,
	PointSemanticPolicyDeclaration,
	PointSemanticPolicyStatement,
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticRouteDeclaration,
	PointSemanticRuleDeclaration,
	PointSemanticRuleStatement,
	PointSemanticTypeExpression,
	PointSemanticUseDeclaration,
	PointSemanticViewDeclaration,
	PointSemanticWorkflowDeclaration,
	PointSemanticWorkflowStatement,
	PointSemanticActionDeclaration,
} from "./ast.ts";
import { semanticFunctionName, toIdentifier, toPascalCase } from "./naming.ts";
import { semanticDeclarationMetadata } from "./metadata.ts";

interface DesugarContext {
	records: Map<string, Map<string, string>>;
	callables: Map<string, string>;
	bindings: Map<string, string>;
	outputName: string;
	outputType: PointCoreTypeExpression;
}

export function desugarSemanticProgram(program: PointSemanticProgram): PointCoreProgram {
	const records = new Map<string, Map<string, string>>();
	const callables = buildCallableMap(program, records);
	const declarations: PointCoreDeclaration[] = [];

	for (const declaration of program.declarations) {
		if (declaration.kind === "record") {
			declarations.push(desugarRecord(declaration));
			continue;
		}
		declarations.push(...desugarDeclaration(declaration, records, callables));
	}

	return {
		kind: "coreProgram",
		module: program.module,
		declarations,
		span: program.span,
		semantic: { source: "semantic" },
		semanticSource: program,
	};
}

export function desugarSemanticImports(
	uses: PointSemanticUseDeclaration[],
	resolve: (use: PointSemanticUseDeclaration) => { from: string; names: string[] },
): PointCoreImportDeclaration[] {
	return uses
		.map((use) => ({
			kind: "import" as const,
			names: resolve(use).names,
			from: resolve(use).from,
			span: use.span,
		}))
		.filter((declaration) => declaration.names.length > 0);
}

function buildCallableMap(
	program: PointSemanticProgram,
	records: Map<string, Map<string, string>>,
): Map<string, string> {
	const callables = new Map<string, string>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "record") registerRecord(declaration, records);
		if (declaration.kind === "external") {
			for (const fn of declaration.functions) callables.set(fn.label, toIdentifier(fn.label));
		}
		if (
			declaration.kind === "calculation" ||
			declaration.kind === "rule" ||
			declaration.kind === "label" ||
			declaration.kind === "action" ||
			declaration.kind === "policy" ||
			declaration.kind === "view" ||
			declaration.kind === "route" ||
			declaration.kind === "workflow" ||
			declaration.kind === "command"
		) {
			const outputName = defaultOutputName(declaration);
			callables.set(declaration.name, semanticFunctionName(declaration.name, outputName, declaration.kind));
		}
	}
	return callables;
}

function defaultOutputName(declaration: PointSemanticDeclaration): string {
	if (declaration.kind === "label") return "label";
	if (declaration.kind === "policy") return "policy";
	if (declaration.kind === "view") return "view";
	if (declaration.kind === "route") return "route";
	if ("output" in declaration) return toIdentifier(declaration.output.name);
	return "result";
}

function registerRecord(declaration: PointSemanticRecordDeclaration, records: Map<string, Map<string, string>>): void {
	const fields = new Map<string, string>();
	for (const field of declaration.fields) fields.set(field.label, toIdentifier(field.label));
	records.set(toPascalCase(declaration.name), fields);
}

function desugarDeclaration(
	declaration: PointSemanticDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreDeclaration[] {
	switch (declaration.kind) {
		case "record":
			return [desugarRecord(declaration)];
		case "calculation":
			return [desugarCalculation(declaration, records, callables)];
		case "rule":
			return [desugarRule(declaration, records, callables)];
		case "label":
			return [desugarLabel(declaration, records, callables)];
		case "external":
			return desugarExternal(declaration);
		case "action":
			return [desugarAction(declaration, records, callables)];
		case "policy":
			return [desugarPolicy(declaration, records, callables)];
		case "view":
			return [desugarView(declaration, records, callables)];
		case "route":
			return [desugarRoute(declaration, records, callables)];
		case "workflow":
			return [desugarWorkflow(declaration, records, callables)];
		case "command":
			return [desugarCommand(declaration, records, callables)];
	}
}

function desugarRecord(declaration: PointSemanticRecordDeclaration): PointCoreTypeDeclaration {
	return {
		kind: "type",
		name: toPascalCase(declaration.name),
		fields: declaration.fields.map((field) => ({
			name: toIdentifier(field.label),
			type: desugarType(field.type),
			semanticName: field.label,
			span: field.span,
		})),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarExternal(declaration: PointSemanticExternalDeclaration): PointCoreExternalDeclaration[] {
	return declaration.functions.map((fn) => desugarExternalFunction(fn));
}

function desugarExternalFunction(fn: PointSemanticExternalFunction): PointCoreExternalDeclaration {
	return {
		kind: "external",
		name: toIdentifier(fn.label),
		params: fn.params.map((param) => desugarParameter(param)),
		returnType: desugarType(fn.returnType),
		from: fn.from,
		importName: fn.importAs,
		semantic: { kind: "external", name: fn.label, outputName: undefined, effects: undefined },
		span: fn.span,
	};
}

function desugarCalculation(
	declaration: PointSemanticCalculationDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, outputName, "calculation"),
		params,
		returnType: outputType,
		body: desugarCalculationBody(declaration.body, ctx),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarRule(
	declaration: PointSemanticRuleDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, outputName, "rule"),
		params,
		returnType: outputType,
		body: desugarRuleBody(declaration.body, ctx),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarLabel(
	declaration: PointSemanticLabelDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const outputType = desugarType(declaration.output.type);
	const { params, bindings } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName: "result", outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "label", "label"),
		params,
		returnType: outputType,
		body: desugarLabelBody(declaration.body, ctx),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarAction(
	declaration: PointSemanticActionDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, outputName, "action"),
		params,
		returnType: outputType,
		body: declaration.body.map((statement) => ({
			kind: "return" as const,
			value: desugarExpression(statement.value, ctx),
		})),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarPolicy(
	declaration: PointSemanticPolicyDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const outputType: PointCoreTypeExpression = { kind: "typeRef", name: "Bool", args: [] };
	const { params, bindings } = collectBindings(declaration.inputs, { name: "result", type: { kind: "typeRef", name: "Bool", args: [] } });
	const ctx: DesugarContext = { records, callables, bindings, outputName: "result", outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "policy", "policy"),
		params,
		returnType: outputType,
		body: desugarPolicyBody(declaration.body, ctx),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarView(
	declaration: PointSemanticViewDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const outputType: PointCoreTypeExpression = { kind: "typeRef", name: "Text", args: [] };
	const { params, bindings } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName: "page", outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "view", "view"),
		params,
		returnType: outputType,
		body: desugarViewBody(declaration.body, ctx),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarRoute(
	declaration: PointSemanticRouteDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "route", "route"),
		params,
		returnType: outputType,
		body: declaration.body.map((statement) => ({
			kind: "return" as const,
			value: desugarExpression(statement.value, ctx),
		})),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarWorkflow(
	declaration: PointSemanticWorkflowDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "workflow", "workflow"),
		params,
		returnType: outputType,
		body: desugarWorkflowBody(declaration.body, ctx),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarCommand(
	declaration: PointSemanticCommandDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "command", "command"),
		params,
		returnType: outputType,
		body: declaration.body.map((statement) => ({
			kind: "return" as const,
			value: desugarExpression(statement.value, ctx),
		})),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function collectBindings(inputs: PointSemanticBinding[], output: PointSemanticOutputBinding) {
	const bindings = new Map<string, string>();
	const params: PointCoreParameter[] = inputs.map((input) => {
		const name = toIdentifier(input.label);
		bindings.set(input.label, name);
		return { name, type: desugarType(input.type), semanticName: input.label, span: input.span };
	});
	const outputName = toIdentifier(output.name);
	bindings.set(output.name, outputName);
	const outputType = desugarType(output.type);
	return { params, bindings, outputName, outputType };
}

function desugarParameter(binding: PointSemanticBinding): PointCoreParameter {
	return {
		name: toIdentifier(binding.label),
		type: desugarType(binding.type),
		semanticName: binding.label,
		span: binding.span,
	};
}

function desugarType(type: PointSemanticTypeExpression): PointCoreTypeExpression {
	if (type.name === "List" || type.name === "Maybe" || type.name === "Or") {
		return { kind: "typeRef", name: type.name, args: type.args.map(desugarType) };
	}
	const primitives = new Set(["Text", "Int", "Float", "Bool", "Void", "Error", "Page"]);
	if (primitives.has(type.name)) return { kind: "typeRef", name: type.name, args: [] };
	return { kind: "typeRef", name: toPascalCase(type.name), args: [] };
}

function desugarCalculationBody(statements: PointSemanticCalculationStatement[], ctx: DesugarContext): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "assignIs") {
			const name = toIdentifier(statement.name);
			if (name !== ctx.outputName) throw new Error(`Calculation can only assign its output ${ctx.outputName}`);
			body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
			continue;
		}
		if (statement.kind === "startsAt" || statement.kind === "startsAs") {
			const name = toIdentifier(statement.name);
			ctx.bindings.set(statement.name, name);
			body.push(mutableValue(name, ctx.outputType, desugarExpression(statement.value, ctx), true, statement.span));
			continue;
		}
		if (statement.kind === "forEach") {
			body.push(...desugarForEach(statement, ctx));
			continue;
		}
		if (statement.kind === "return") {
			body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
			continue;
		}
		body.push(...desugarMutation(statement, ctx));
	}
	return body;
}

function desugarRuleBody(statements: PointSemanticRuleStatement[], ctx: DesugarContext): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "startsAt") {
			const name = toIdentifier(statement.name);
			ctx.bindings.set(statement.name, name);
			body.push(mutableValue(name, ctx.outputType, desugarExpression(statement.value, ctx), true, statement.span));
			continue;
		}
		if (statement.kind === "addWhen") {
			body.push({
				kind: "if",
				condition: desugarExpression(statement.condition, ctx),
				thenBody: [
					{
						kind: "assignment",
						name: ctx.outputName,
						operator: "+=",
						value: desugarExpression(statement.amount, ctx),
						span: statement.span,
					},
				],
				elseBody: [],
				span: statement.span,
			});
			continue;
		}
		if (statement.kind === "forEach") {
			body.push(...desugarForEach(statement, ctx));
			continue;
		}
		if (statement.kind === "return") {
			body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
			continue;
		}
		body.push(...desugarMutation(statement, ctx));
	}
	return body;
}

function desugarLabelBody(statements: PointSemanticLabelStatement[], ctx: DesugarContext): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "whenReturn") {
			body.push({
				kind: "if",
				condition: desugarExpression(statement.condition, ctx),
				thenBody: [{ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span }],
				elseBody: [],
				span: statement.span,
			});
			continue;
		}
		body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
	}
	return body;
}

function desugarPolicyBody(statements: PointSemanticPolicyStatement[], ctx: DesugarContext): PointCoreStatement[] {
	return statements.map((statement) => {
		if (statement.kind === "deny") {
			return {
				kind: "return" as const,
				span: statement.span,
				value: {
					kind: "binary" as const,
					operator: "==" as const,
					left: desugarExpression(statement.condition, ctx),
					right: { kind: "literal" as const, value: false },
					span: statement.span,
				},
			};
		}
		return { kind: "return" as const, value: desugarExpression(statement.condition, ctx), span: statement.span };
	});
}

function desugarViewBody(statements: PointSemanticViewStatement[], ctx: DesugarContext): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "whenRender") {
			body.push({
				kind: "if",
				condition: desugarExpression(statement.condition, ctx),
				thenBody: [{ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span }],
				elseBody: [],
				span: statement.span,
			});
			continue;
		}
		body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
	}
	return body;
}

function desugarWorkflowBody(statements: PointSemanticWorkflowStatement[], ctx: DesugarContext): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "step") {
			const name = toIdentifier(statement.name);
			ctx.bindings.set(statement.name, name);
			body.push(mutableValue(name, ctx.outputType, desugarExpression(statement.value, ctx), false, statement.span));
			continue;
		}
		body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
	}
	return body;
}

function desugarForEach(
	statement: Extract<PointSemanticCalculationStatement | PointSemanticRuleStatement, { kind: "forEach" }>,
	ctx: DesugarContext,
): PointCoreStatement[] {
	const itemName = toIdentifier(statement.item);
	const loopCtx: DesugarContext = {
		...ctx,
		bindings: new Map(ctx.bindings),
	};
	loopCtx.bindings.set(statement.item, itemName);
	return [
		{
			kind: "for",
			itemName,
			iterable: desugarExpression(statement.iterable, ctx),
			body: statement.body.flatMap((mutation) => desugarMutation(mutation, loopCtx)),
			span: statement.span,
		},
	];
}

function desugarMutation(statement: PointSemanticMutationStatement, ctx: DesugarContext): PointCoreStatement[] {
	if (statement.kind === "addTo") {
		return [
			{
				kind: "assignment",
				name: toIdentifier(statement.target),
				operator: "+=",
				value: desugarExpression(statement.amount, ctx),
				span: statement.span,
			},
		];
	}
	if (statement.kind === "subtractFrom") {
		return [
			{
				kind: "assignment",
				name: toIdentifier(statement.target),
				operator: "-=",
				value: desugarExpression(statement.amount, ctx),
				span: statement.span,
			},
		];
	}
	return [
		{
			kind: "assignment",
			name: toIdentifier(statement.target),
			operator: "=",
			value: desugarExpression(statement.value, ctx),
			span: statement.span,
		},
	];
}

function mutableValue(
	name: string,
	type: PointCoreTypeExpression,
	value: PointCoreExpression,
	mutable: boolean,
	span?: PointSourceSpan,
): PointCoreValueDeclaration {
	return { kind: "value", name, type, value, mutable, span };
}

function desugarExpression(expression: PointSemanticExpression, ctx: DesugarContext): PointCoreExpression {
	switch (expression.kind) {
		case "literal":
			return { kind: "literal", value: expression.value, span: expression.span };
		case "name":
			return { kind: "identifier", name: resolveName(expression.label, ctx.bindings), span: expression.span };
		case "property":
			return {
				kind: "property",
				target: desugarExpression(expression.target, ctx),
				name: toIdentifier(expression.label),
				span: expression.span,
			};
		case "binary":
			return {
				kind: "binary",
				operator: expression.operator,
				left: desugarExpression(expression.left, ctx),
				right: desugarExpression(expression.right, ctx),
				span: expression.span,
			};
		case "call":
			return {
				kind: "call",
				callee: resolveCallable(expression.callee, ctx.callables),
				args: expression.args.map((arg) => desugarExpression(arg, ctx)),
				span: expression.span,
			};
		case "await":
			return { kind: "await", value: desugarExpression(expression.value, ctx), span: expression.span };
		case "list":
			return { kind: "list", items: expression.items.map((item) => desugarExpression(item, ctx)), span: expression.span };
		case "record":
			return {
				kind: "record",
				fields: expression.fields.map((field) => ({
					name: toIdentifier(field.label),
					value: desugarExpression(field.value, ctx),
					span: field.span,
				})),
				span: expression.span,
			};
		case "error":
			return {
				kind: "call",
				callee: "Error",
				args: [{ kind: "literal", value: expression.message, span: expression.span }],
				span: expression.span,
			};
	}
}

function resolveName(label: string, bindings: Map<string, string>): string {
	if (bindings.has(label)) return bindings.get(label)!;
	if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(label)) return label;
	return toIdentifier(label);
}

function resolveCallable(label: string, callables: Map<string, string>): string {
	if (callables.has(label)) return callables.get(label)!;
	if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(label)) return label;
	return toIdentifier(label);
}
