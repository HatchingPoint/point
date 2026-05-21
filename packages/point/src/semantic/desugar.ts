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
	PointSemanticViewControls,
	PointSemanticViewNavigation,
	PointSemanticViewEachSpec,
	PointSemanticViewModalSpec,
	PointSemanticViewTabsSpec,
	PointSemanticViewFieldBinding,
	PointSemanticDataLoad,
	PointSemanticStreamSubscribe,
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
	PointSemanticMiddlewareDeclaration,
	PointSemanticMutationStatement,
	PointSemanticOutputBinding,
	PointSemanticPolicyDeclaration,
	PointSemanticGuardDeclaration,
	PointSemanticPolicyStatement,
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticVariantDeclaration,
	PointSemanticRouteDeclaration,
	PointSemanticRouteStatement,
	PointSemanticStreamRouteDeclaration,
	PointSemanticStreamRouteHandler,
	PointSemanticRuleDeclaration,
	PointSemanticRuleStatement,
	PointSemanticTypeExpression,
	PointSemanticUseDeclaration,
	PointSemanticViewDeclaration,
	PointSemanticViewStatement,
	PointSemanticPageDeclaration,
	PointSemanticLayoutDeclaration,
	PointSemanticWorkflowDeclaration,
	PointSemanticWorkflowStatement,
	PointSemanticWorkflowStepOptions,
	PointSemanticPipelineDeclaration,
	PointSemanticPipelineStatement,
	PointSemanticActionDeclaration,
} from "./ast.ts";
import { pipelineLogParamName } from "../core/emit-pipeline.ts";
import { semanticFunctionName, streamRouteHandlerName, toIdentifier, toPascalCase, guardPatternsConstName } from "./naming.ts";
import { semanticDeclarationMetadata } from "./metadata.ts";

interface DesugarContext {
	records: Map<string, Map<string, string>>;
	callables: Map<string, string>;
	bindings: Map<string, string>;
	payloadFields?: Map<string, { base: string; field: string }>;
	outputName: string;
	outputType: PointCoreTypeExpression;
}

export function desugarSemanticProgram(program: PointSemanticProgram): PointCoreProgram {
	const records = new Map<string, Map<string, string>>();
	const callables = buildCallableMap(program, records);
	const actionOutputs = buildActionOutputMap(program);
	const policies = buildPolicyMap(program);
	const guards = buildGuardMap(program);
	const streamRoutes = buildStreamRouteMap(program);
	const declarations: PointCoreDeclaration[] = [];

	for (const declaration of program.declarations) {
		if (declaration.kind === "record" || declaration.kind === "variant") {
			declarations.push(desugarRecord(declaration));
			continue;
		}
		declarations.push(
			...desugarDeclaration(declaration, records, callables, actionOutputs, policies, guards, streamRoutes, program.module),
		);
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
		if (declaration.kind === "variant") registerVariant(declaration, records);
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
			declaration.kind === "layout" ||
			declaration.kind === "page" ||
			declaration.kind === "middleware" ||
			declaration.kind === "route" ||
			declaration.kind === "streamRoute" ||
			declaration.kind === "workflow" ||
			declaration.kind === "pipeline" ||
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
	if (declaration.kind === "layout") return "layout";
	if (declaration.kind === "page") return "page";
	if (declaration.kind === "route") return "route";
	if (declaration.kind === "streamRoute") return "stream";
	if (declaration.kind === "middleware") return toIdentifier(declaration.output.name);
	if ("output" in declaration) return toIdentifier(declaration.output.name);
	return "result";
}

function registerRecord(declaration: PointSemanticRecordDeclaration, records: Map<string, Map<string, string>>): void {
	const fields = new Map<string, string>();
	for (const field of declaration.fields) fields.set(field.label, toIdentifier(field.label));
	records.set(toPascalCase(declaration.name), fields);
}

function registerVariant(declaration: PointSemanticVariantDeclaration, records: Map<string, Map<string, string>>): void {
	const cases = new Map<string, string>();
	for (const variantCase of declaration.cases) cases.set(toPascalCase(variantCase.label), toPascalCase(variantCase.label));
	records.set(toPascalCase(declaration.name), cases);
}

function buildActionOutputMap(program: PointSemanticProgram): Map<string, PointSemanticTypeExpression> {
	const outputs = new Map<string, PointSemanticTypeExpression>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "action") outputs.set(declaration.name, declaration.output.type);
	}
	return outputs;
}

function buildPolicyMap(program: PointSemanticProgram): Map<string, PointSemanticPolicyDeclaration> {
	const policies = new Map<string, PointSemanticPolicyDeclaration>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "policy") policies.set(declaration.name, declaration);
	}
	return policies;
}

function buildGuardMap(program: PointSemanticProgram): Map<string, PointSemanticGuardDeclaration> {
	const guards = new Map<string, PointSemanticGuardDeclaration>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "guard") guards.set(declaration.name, declaration);
	}
	return guards;
}

function buildStreamRouteMap(program: PointSemanticProgram): Map<string, PointSemanticStreamRouteDeclaration> {
	const streamRoutes = new Map<string, PointSemanticStreamRouteDeclaration>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "streamRoute") streamRoutes.set(declaration.name, declaration);
	}
	return streamRoutes;
}

function desugarDeclaration(
	declaration: PointSemanticDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
	actionOutputs: Map<string, PointSemanticTypeExpression>,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	moduleName?: string,
): PointCoreDeclaration[] {
	switch (declaration.kind) {
		case "record":
		case "variant":
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
			return [desugarView(declaration, records, callables, actionOutputs, streamRoutes, moduleName)];
		case "layout":
			return [desugarLayout(declaration, records, callables)];
		case "navigation":
			return [];
		case "page":
			return [desugarPage(declaration, records, callables, actionOutputs, streamRoutes, moduleName)];
		case "middleware":
			return [desugarMiddleware(declaration, records, callables)];
		case "route":
			return [desugarRoute(declaration, records, callables)];
		case "streamRoute":
			return desugarStreamRoute(declaration, records, callables);
		case "guard":
			return [];
		case "workflow":
			return [desugarWorkflow(declaration, records, callables, policies, guards)];
		case "pipeline":
			return [desugarPipeline(declaration, records, callables, policies, guards)];
		case "session":
			return [];
		case "command":
			return [desugarCommand(declaration, records, callables)];
		case "schedule":
		case "prompt":
			return [];
	}
}

function desugarRecord(declaration: PointSemanticRecordDeclaration | PointSemanticVariantDeclaration): PointCoreTypeDeclaration {
	if (declaration.kind === "variant") {
		return {
			kind: "type",
			name: toPascalCase(declaration.name),
			fields: [],
			variantCases: declaration.cases.map((variantCase) => ({
				name: toPascalCase(variantCase.label),
				fields: variantCase.fields.map((field) => ({
					name: toIdentifier(field.label),
					type: desugarType(field.type),
					semanticName: field.label,
					span: field.span,
				})),
				span: variantCase.span,
			})),
			semantic: semanticDeclarationMetadata(declaration),
			span: declaration.span,
		};
	}
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
	const variantInput =
		declaration.inputs.length === 1
			? ([declaration.inputs[0]!.label, toIdentifier(declaration.inputs[0]!.label)] as const)
			: undefined;
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "label", "label"),
		params,
		returnType: outputType,
		body: desugarLabelBody(declaration.body, ctx, variantInput),
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
	const metadata = semanticDeclarationMetadata(declaration);
	const yieldStatement = declaration.body.find((statement) => statement.kind === "yield");
	if (yieldStatement) {
		metadata.isStreamAction = true;
		return {
			kind: "function",
			name: semanticFunctionName(declaration.name, outputName, "action"),
			params,
			returnType: outputType,
			body: [{ kind: "yield", value: desugarExpression(yieldStatement.value, ctx), span: yieldStatement.span }],
			semantic: metadata,
			span: declaration.span,
		};
	}
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, outputName, "action"),
		params,
		returnType: outputType,
		body: declaration.body.map((statement) => ({
			kind: "return" as const,
			value: desugarExpression(statement.value, ctx),
			span: statement.span,
		})),
		semantic: metadata,
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

function buildDataLoad(
	actionName: string,
	callables: Map<string, string>,
	actionOutputs: Map<string, PointSemanticTypeExpression>,
	loading?: PointSemanticExpression,
	loadingClassName?: string,
	error?: PointSemanticExpression,
	errorClassName?: string,
	empty?: PointSemanticExpression,
	emptyClassName?: string,
	ctx?: DesugarContext,
): PointSemanticDataLoad | undefined {
	const outputType = actionOutputs.get(actionName);
	const actionFunction = callables.get(actionName);
	if (!outputType || !actionFunction) return undefined;
	return {
		actionName,
		actionFunction,
		bindingName: "data",
		loading: loading && ctx ? desugarExpression(loading, ctx) : undefined,
		loadingClassName,
		error: error && ctx ? desugarExpression(error, ctx) : undefined,
		errorClassName,
		empty: empty && ctx ? desugarExpression(empty, ctx) : undefined,
		emptyClassName,
	};
}

function buildViewDataLoad(
	declaration: PointSemanticViewDeclaration,
	callables: Map<string, string>,
	actionOutputs: Map<string, PointSemanticTypeExpression>,
	ctx: DesugarContext,
): PointSemanticDataLoad | undefined {
	const loadStatement = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "loadData" | "onMountCall" }> =>
			statement.kind === "loadData" || statement.kind === "onMountCall",
	);
	if (!loadStatement) return undefined;
	const loading = declaration.body.find((statement) => statement.kind === "whenLoadingRender");
	const error = declaration.body.find((statement) => statement.kind === "whenErrorRender");
	const empty = declaration.body.find((statement) => statement.kind === "whenEmptyRender");
	return buildDataLoad(
		loadStatement.action,
		callables,
		actionOutputs,
		loading?.value,
		loading?.className,
		error?.value,
		error?.className,
		empty?.value,
		empty?.className,
		ctx,
	);
}

function resolveStreamSubscribeTarget(
	target:
		| { kind: "path"; path: string }
		| { kind: "route"; routeName: string },
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
): { path: string; routeName?: string; messageTypeName: string } | undefined {
	if (target.kind === "route") {
		const route = streamRoutes.get(target.routeName);
		if (!route) return undefined;
		return { path: route.path, routeName: target.routeName, messageTypeName: route.messageType.name };
	}
	for (const route of streamRoutes.values()) {
		if (route.path === target.path) {
			return { path: target.path, routeName: route.name, messageTypeName: route.messageType.name };
		}
	}
	return { path: target.path, messageTypeName: "Text" };
}

function buildViewStreamSubscribe(
	declaration: PointSemanticViewDeclaration,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	ctx: DesugarContext,
): PointSemanticStreamSubscribe | undefined {
	const subscribePath = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "streamSubscribePath" }> => statement.kind === "streamSubscribePath",
	);
	const subscribeRoute = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "streamSubscribeRoute" }> =>
			statement.kind === "streamSubscribeRoute",
	);
	if (!subscribePath && !subscribeRoute) return undefined;
	const target = subscribePath
		? resolveStreamSubscribeTarget({ kind: "path", path: subscribePath.path }, streamRoutes)
		: resolveStreamSubscribeTarget({ kind: "route", routeName: subscribeRoute!.routeName }, streamRoutes);
	if (!target) return undefined;
	const onMessageCall = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "onMessageCall" }> => statement.kind === "onMessageCall",
	);
	const connecting = declaration.body.find((statement) => statement.kind === "whenConnectingRender");
	const disconnected = declaration.body.find((statement) => statement.kind === "whenDisconnectedRender");
	const error = declaration.body.find((statement) => statement.kind === "whenErrorRender");
	return {
		routeName: target.routeName,
		path: target.path,
		messageTypeName: target.messageTypeName,
		bindingName: "messages",
		messageCallback: onMessageCall ? toIdentifier(onMessageCall.callback) : undefined,
		connecting: connecting && "value" in connecting ? desugarExpression(connecting.value, ctx) : undefined,
		connectingClassName: connecting && "className" in connecting ? connecting.className : undefined,
		disconnected: disconnected && "value" in disconnected ? desugarExpression(disconnected.value, ctx) : undefined,
		disconnectedClassName: disconnected && "className" in disconnected ? disconnected.className : undefined,
		error: error && "value" in error ? desugarExpression(error.value, ctx) : undefined,
		errorClassName: error && "className" in error ? error.className : undefined,
	};
}

function buildPageStreamSubscribe(
	declaration: PointSemanticPageDeclaration,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	ctx: DesugarContext,
): PointSemanticStreamSubscribe | undefined {
	if (!declaration.streamSubscribePath && !declaration.streamSubscribeRoute) return undefined;
	const target = declaration.streamSubscribePath
		? resolveStreamSubscribeTarget({ kind: "path", path: declaration.streamSubscribePath }, streamRoutes)
		: resolveStreamSubscribeTarget({ kind: "route", routeName: declaration.streamSubscribeRoute! }, streamRoutes);
	if (!target) return undefined;
	return {
		routeName: target.routeName,
		path: target.path,
		messageTypeName: target.messageTypeName,
		bindingName: "messages",
		messageCallback: declaration.onMessageCall ? toIdentifier(declaration.onMessageCall) : undefined,
		connecting: declaration.whenConnectingRender ? desugarExpression(declaration.whenConnectingRender, ctx) : undefined,
		connectingClassName: declaration.whenConnectingClassName,
		disconnected: declaration.whenDisconnectedRender ? desugarExpression(declaration.whenDisconnectedRender, ctx) : undefined,
		disconnectedClassName: declaration.whenDisconnectedClassName,
		error: declaration.whenErrorRender ? desugarExpression(declaration.whenErrorRender, ctx) : undefined,
		errorClassName: declaration.whenErrorClassName,
	};
}

function desugarView(
	declaration: PointSemanticViewDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
	actionOutputs: Map<string, PointSemanticTypeExpression>,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	moduleName?: string,
): PointCoreFunctionDeclaration {
	const outputType: PointCoreTypeExpression = { kind: "typeRef", name: "Text", args: [] };
	const { params, bindings } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName: "page", outputType };
	const viewDataLoad = buildViewDataLoad(declaration, callables, actionOutputs, ctx);
	if (viewDataLoad) ctx.bindings.set("data", "data");
	const viewStreamSubscribe = buildViewStreamSubscribe(declaration, streamRoutes, ctx);
	if (viewStreamSubscribe) {
		ctx.bindings.set("messages", "messages");
		ctx.bindings.set("connected", "connected");
	}
	const renderStatements = declaration.body.filter(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "render" | "whenRender" }> =>
			statement.kind === "render" || statement.kind === "whenRender",
	);
	const metadata = semanticDeclarationMetadata(declaration);
	const viewControls = buildViewControls(declaration, ctx);
	if (viewControls) metadata.viewControls = viewControls;
	const viewNavigation = buildViewNavigation(declaration);
	if (viewNavigation) metadata.viewNavigation = viewNavigation;
	const viewEach = buildViewEach(declaration, ctx);
	if (viewEach.length > 0) metadata.viewEach = viewEach;
	const viewModal = buildViewModal(declaration, ctx);
	if (viewModal) metadata.viewModal = viewModal;
	const viewTabs = buildViewTabs(declaration, ctx);
	if (viewTabs) metadata.viewTabs = viewTabs;
	if (viewDataLoad) metadata.viewDataLoad = viewDataLoad;
	if (viewStreamSubscribe) metadata.viewStreamSubscribe = viewStreamSubscribe;
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "view", "view"),
		params,
		returnType: outputType,
		body: desugarViewBody(renderStatements, ctx),
		semantic: metadata,
		span: declaration.span,
	};
}

function collectViewBindStatements(declaration: PointSemanticViewDeclaration): Extract<PointSemanticViewStatement, { kind: "bindCheckbox" | "bindField" }>[] {
	return declaration.body.flatMap((statement) => {
		if (statement.kind === "bindCheckbox" || statement.kind === "bindField") return [statement];
		if (statement.kind === "form") return statement.bindings;
		return [];
	});
}

function buildViewControls(
	declaration: PointSemanticViewDeclaration,
	ctx: DesugarContext,
): PointSemanticViewControls | undefined {
	const bindStatements = collectViewBindStatements(declaration);
	if (bindStatements.length === 0) return undefined;

	const onChangeCall = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "onChangeCall" }> => statement.kind === "onChangeCall",
	);
	const handlerInput = declaration.inputs.find((input) => input.type.name === "Handler" && input.type.args.length === 1);
	const callbackLabel = onChangeCall?.callback ?? handlerInput?.label;
	if (!callbackLabel) {
		throw new Error(`View ${declaration.name} with form bindings requires input Handler T or on change call`);
	}
	const changeCallback = toIdentifier(callbackLabel);

	return {
		changeCallback,
		fields: bindStatements.map((statement) => desugarViewFieldBinding(statement, ctx)),
	};
}

function desugarViewFieldBinding(
	statement: Extract<PointSemanticViewStatement, { kind: "bindCheckbox" | "bindField" }>,
	ctx: DesugarContext,
): PointSemanticViewFieldBinding {
	const target = desugarExpression(statement.target, ctx);
	if (target.kind !== "property") {
		throw new Error(`bind ${statement.kind === "bindField" ? "field" : "checkbox"} target must be a record field access`);
	}
	if (target.target.kind !== "identifier") {
		throw new Error(`bind ${statement.kind === "bindField" ? "field" : "checkbox"} target must start with an input record`);
	}
	return {
		label: statement.label,
		target,
		recordParam: target.target.name,
		fieldName: target.name,
		inputKind: statement.kind === "bindField" ? "text" : "checkbox",
	};
}

function buildViewEach(declaration: PointSemanticViewDeclaration, ctx: DesugarContext): PointSemanticViewEachSpec[] {
	return declaration.body
		.filter((statement): statement is Extract<PointSemanticViewStatement, { kind: "eachRender" }> => statement.kind === "eachRender")
		.map((statement) => ({
			itemName: statement.item,
			itemIdentifier: toIdentifier(statement.item),
			iterable: desugarExpression(statement.iterable, ctx),
			render: desugarExpression(statement.value, ctx),
			className: statement.className,
			linkPath: statement.linkPath ? desugarExpression(statement.linkPath, ctx) : undefined,
		}));
}

function buildViewModal(declaration: PointSemanticViewDeclaration, ctx: DesugarContext): PointSemanticViewModalSpec | undefined {
	const modal = declaration.body.find((statement): statement is Extract<PointSemanticViewStatement, { kind: "modal" }> => statement.kind === "modal");
	if (!modal) return undefined;
	return {
		title: modal.title,
		when: modal.when ? desugarExpression(modal.when, ctx) : undefined,
		content: desugarExpression(modal.value, ctx),
		className: modal.className,
	};
}

function buildViewTabs(declaration: PointSemanticViewDeclaration, ctx: DesugarContext): PointSemanticViewTabsSpec | undefined {
	const tabsStatement = declaration.body.find((statement): statement is Extract<PointSemanticViewStatement, { kind: "tabs" }> => statement.kind === "tabs");
	if (!tabsStatement) return undefined;
	return {
		tabs: tabsStatement.tabs.map((tab) => ({
			label: tab.label,
			content: desugarExpression(tab.value, ctx),
		})),
	};
}

function buildViewNavigation(declaration: PointSemanticViewDeclaration): PointSemanticViewNavigation | undefined {
	const links = declaration.body.flatMap((statement) => {
		if (statement.kind === "link") return [{ label: statement.label, path: statement.path }];
		if (statement.kind === "navigate") return [{ label: statement.path, path: statement.path }];
		return [];
	});
	if (links.length === 0) return undefined;
	return { links };
}

function desugarLayout(
	declaration: PointSemanticLayoutDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const outputType: PointCoreTypeExpression = { kind: "typeRef", name: "Text", args: [] };
	const ctx: DesugarContext = { records, callables, bindings: new Map(), outputName: "layout", outputType };
	const metadata = semanticDeclarationMetadata(declaration);
	metadata.layoutSpec = {
		name: declaration.name,
		slots: declaration.slots.map((slot) => ({
			name: slot.name,
			content: desugarExpression(slot.content, ctx),
		})),
	};
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "layout", "layout"),
		params: [],
		returnType: outputType,
		body: [{ kind: "return", value: { kind: "literal", value: "", span: declaration.span }, span: declaration.span }],
		semantic: metadata,
		span: declaration.span,
	};
}

function desugarPage(
	declaration: PointSemanticPageDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
	actionOutputs: Map<string, PointSemanticTypeExpression>,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	moduleName?: string,
): PointCoreFunctionDeclaration {
	const outputType: PointCoreTypeExpression = { kind: "typeRef", name: "Text", args: [] };
	const pageType: PointCoreTypeExpression = { kind: "typeRef", name: "Page", args: [] };
	const { params, bindings } = collectBindings(declaration.inputs, { name: "page", type: pageType });
	const ctx: DesugarContext = { records, callables, bindings, outputName: "page", outputType };
	const metadata = semanticDeclarationMetadata(declaration);
	let dataLoad: PointSemanticDataLoad | undefined;
	if (declaration.loadData) {
		dataLoad = buildDataLoad(
			declaration.loadData,
			callables,
			actionOutputs,
			declaration.whenLoadingRender,
			declaration.whenLoadingClassName,
			declaration.whenErrorRender,
			declaration.whenErrorClassName,
			declaration.whenEmptyRender,
			declaration.whenEmptyClassName,
			ctx,
		);
		ctx.bindings.set("data", "data");
		metadata.pageDataLoad = dataLoad;
	}
	const pageStreamSubscribe = buildPageStreamSubscribe(declaration, streamRoutes, ctx);
	if (pageStreamSubscribe) {
		ctx.bindings.set("messages", "messages");
		ctx.bindings.set("connected", "connected");
		metadata.pageStreamSubscribe = pageStreamSubscribe;
	}
	metadata.pageLayout = {
		layoutName: declaration.layout,
		layoutFunction: declaration.layout ? semanticFunctionName(declaration.layout, "layout", "layout") : undefined,
		title: desugarExpression(declaration.title, ctx),
		description: declaration.description ? desugarExpression(declaration.description, ctx) : undefined,
		main: desugarExpression(declaration.main, ctx),
		mainClassName: declaration.mainClassName,
		dataLoad,
		streamSubscribe: pageStreamSubscribe,
	};
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "page", "page"),
		params,
		returnType: outputType,
		body: [{ kind: "return", value: metadata.pageLayout.main, span: declaration.span }],
		semantic: metadata,
		span: declaration.span,
	};
}

function desugarMiddleware(
	declaration: PointSemanticMiddlewareDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const outputType: PointCoreTypeExpression = { kind: "typeRef", name: "Maybe", args: [{ kind: "typeRef", name: "Text", args: [] }] };
	const { params, bindings } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName: toIdentifier(declaration.output.name), outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, toIdentifier(declaration.output.name), "middleware"),
		params,
		returnType: outputType,
		body: desugarLabelBody(declaration.body, ctx),
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
		body: declaration.body.map((statement) => desugarRouteStatement(statement, ctx)),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarRouteStatement(statement: PointSemanticRouteStatement, ctx: DesugarContext): PointCoreStatement {
	if (statement.kind === "returnJson") {
		const args = [desugarExpression(statement.value, ctx)];
		if (statement.status) args.push(desugarExpression(statement.status, ctx));
		if (statement.headers) args.push(desugarExpression(statement.headers, ctx));
		return { kind: "return", value: { kind: "call", callee: "pointJsonResponse", args, span: statement.span }, span: statement.span };
	}
	return { kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span };
}

function desugarStreamRoute(
	declaration: PointSemanticStreamRouteDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration[] {
	return declaration.handlers.map((handler) => desugarStreamRouteHandler(declaration, handler, records, callables));
}

function inferStreamHandlerReturnType(
	declaration: PointSemanticStreamRouteDeclaration,
	handler: PointSemanticStreamRouteHandler,
): PointCoreTypeExpression {
	if (handler.mode === "streamFromAction") return { kind: "typeRef", name: "Void", args: [] };
	const value = handler.value;
	if (!value) return { kind: "typeRef", name: "Void", args: [] };
	if (value.kind === "literal" && value.value === null) return { kind: "typeRef", name: "Void", args: [] };
	if (value.kind === "literal" && typeof value.value === "string") return { kind: "typeRef", name: "Text", args: [] };
	if (value.kind === "name") return { kind: "typeRef", name: toPascalCase(declaration.messageType.name), args: [] };
	if (value.kind === "record") return { kind: "typeRef", name: toPascalCase(declaration.messageType.name), args: [] };
	return { kind: "typeRef", name: "Text", args: [] };
}

function desugarStreamRouteHandler(
	declaration: PointSemanticStreamRouteDeclaration,
	handler: PointSemanticStreamRouteHandler,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
): PointCoreFunctionDeclaration {
	const outputType = inferStreamHandlerReturnType(declaration, handler);
	const bindings = new Map<string, string>();
	const params: PointCoreParameter[] = [];
	if (handler.event === "message" && handler.inputLabel) {
		const name = toIdentifier(handler.inputLabel);
		bindings.set(handler.inputLabel, name);
		params.push({ name, type: { kind: "typeRef", name: toPascalCase(declaration.messageType.name), args: [] } });
	}
	const ctx: DesugarContext = {
		records,
		callables,
		bindings,
		outputName: "result",
		outputType,
	};
	if (handler.mode === "streamFromAction") {
		return {
			kind: "function",
			name: streamRouteHandlerName(declaration.name, handler.event),
			params,
			returnType: outputType,
			body: [{ kind: "return" }],
			semantic: { kind: "streamRoute", name: declaration.name, outputName: handler.event, effects: ["network"] },
			span: handler.span ?? declaration.span,
		};
	}
	return {
		kind: "function",
		name: streamRouteHandlerName(declaration.name, handler.event),
		params,
		returnType: outputType,
		body: [{ kind: "return", value: desugarExpression(handler.value!, ctx), span: handler.span }],
		semantic: { kind: "streamRoute", name: declaration.name, outputName: handler.event, effects: ["network"] },
		span: handler.span ?? declaration.span,
	};
}

function typeLabel(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(typeLabel).join(", ")}>`;
}

function desugarWorkflow(
	declaration: PointSemanticWorkflowDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "workflow", "workflow"),
		params,
		returnType: outputType,
		body: desugarWorkflowBody(declaration.body, ctx, policies, guards),
		semantic: semanticDeclarationMetadata(declaration),
		span: declaration.span,
	};
}

function desugarPipeline(
	declaration: PointSemanticPipelineDeclaration,
	records: Map<string, Map<string, string>>,
	callables: Map<string, string>,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
): PointCoreFunctionDeclaration {
	const { params, bindings, outputName, outputType } = collectBindings(declaration.inputs, declaration.output);
	const logParam = pipelineLogParamName();
	params.push({
		name: logParam,
		type: {
			kind: "typeRef",
			name: "Maybe",
			args: [{ kind: "typeRef", name: "Handler", args: [{ kind: "typeRef", name: "Void", args: [] }] }],
		},
		semanticName: logParam,
		span: declaration.span,
	});
	const ctx: DesugarContext = { records, callables, bindings, outputName, outputType };
	return {
		kind: "function",
		name: semanticFunctionName(declaration.name, "pipeline", "pipeline"),
		params,
		returnType: outputType,
		body: desugarPipelineBody(declaration.body, ctx, policies, guards, declaration.name),
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
			span: statement.span,
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
	if (type.name === "List" || type.name === "Maybe" || type.name === "Or" || type.name === "Handler") {
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

function desugarLabelBody(
	statements: PointSemanticLabelStatement[],
	ctx: DesugarContext,
	variantInput?: readonly [string, string],
): PointCoreStatement[] {
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
		if (statement.kind === "onVariantReturn" && variantInput) {
			const [, identifier] = variantInput;
			body.push({
				kind: "if",
				condition: {
					kind: "binary",
					operator: "==",
					left: {
						kind: "property",
						target: { kind: "identifier", name: identifier, span: statement.span },
						name: "kind",
						span: statement.span,
					},
					right: { kind: "literal", value: toPascalCase(statement.caseLabel), span: statement.span },
					span: statement.span,
				},
				thenBody: [
					{
						kind: "return",
						value: desugarOnVariantReturnValue(statement, ctx, identifier),
						span: statement.span,
					},
				],
				elseBody: [],
				span: statement.span,
			});
			continue;
		}
		body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
	}
	return body;
}

function desugarOnVariantReturnValue(
	statement: Extract<PointSemanticLabelStatement, { kind: "onVariantReturn" }>,
	ctx: DesugarContext,
	identifier: string,
): PointCoreExpression {
	const payloadFields = new Map<string, { base: string; field: string }>();
	for (const binding of statement.bindings) {
		payloadFields.set(binding, { base: identifier, field: toIdentifier(binding) });
	}
	return desugarExpression(statement.value, { ...ctx, payloadFields });
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
			thenBody: [{
				kind: "return",
				value: desugarExpression(statement.value, ctx),
				...(statement.className ? { className: statement.className } : {}),
				span: statement.span,
			}],
				elseBody: [],
				span: statement.span,
			});
			continue;
		}
		body.push({
			kind: "return",
			value: desugarExpression(statement.value, ctx),
			...(statement.className ? { className: statement.className } : {}),
			span: statement.span,
		});
	}
	return body;
}

function desugarWorkflowBody(
	statements: PointSemanticWorkflowStatement[],
	ctx: DesugarContext,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "step") {
			const name = toIdentifier(statement.name);
			ctx.bindings.set(statement.name, name);
			body.push(...desugarOrchestrationStep(statement, ctx, policies, guards));
			continue;
		}
		body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
	}
	return body;
}

function desugarPipelineBody(
	statements: PointSemanticPipelineStatement[],
	ctx: DesugarContext,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
	pipelineName: string,
): PointCoreStatement[] {
	const body: PointCoreStatement[] = [];
	for (const statement of statements) {
		if (statement.kind === "step") {
			const name = toIdentifier(statement.name);
			ctx.bindings.set(statement.name, name);
			body.push(...desugarPipelineStep(statement, ctx, policies, guards, pipelineName));
			continue;
		}
		body.push({ kind: "return", value: desugarExpression(statement.value, ctx), span: statement.span });
	}
	return body;
}

function desugarPipelineStep(
	statement: Extract<PointSemanticPipelineStatement, { kind: "step" }>,
	ctx: DesugarContext,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
	pipelineName: string,
): PointCoreStatement[] {
	const name = toIdentifier(statement.name);
	const body: PointCoreStatement[] = [];
	body.push(...pipelineLogPhase(pipelineName, statement.name, "start", statement.span));
	body.push(...desugarOrchestrationStep(statement, ctx, policies, guards));
	body.push(...pipelineLogStepResult(pipelineName, statement.name, name, statement.span));
	return body;
}

function desugarOrchestrationStep(
	statement:
		| Extract<PointSemanticWorkflowStatement, { kind: "step" }>
		| Extract<PointSemanticPipelineStatement, { kind: "step" }>,
	ctx: DesugarContext,
	policies: Map<string, PointSemanticPolicyDeclaration>,
	guards: Map<string, PointSemanticGuardDeclaration>,
): PointCoreStatement[] {
	const name = toIdentifier(statement.name);
	const options = statement.options;
	const hasOrchestrationExtensions = Boolean(
		options?.retryCount || options?.timeoutSeconds || options?.requiredPolicy || options?.onFailure,
	);
	if (!hasOrchestrationExtensions) {
		const needsMutableBinding = Boolean(options?.fileScopeGuard);
		const body = [
			mutableValue(name, ctx.outputType, desugarExpression(statement.value, ctx), needsMutableBinding, statement.span),
		];
		body.push(...guardPathCheckStatements(name, options?.fileScopeGuard, guards, statement.span));
		return body;
	}

	const body: PointCoreStatement[] = [];

	if (options?.requiredPolicy) {
		const policy = policies.get(options.requiredPolicy);
		if (policy) {
			const policyFn = semanticFunctionName(policy.name, "policy", "policy");
			const policyArgs = policy.inputs.map((input) => ({
				kind: "identifier" as const,
				name: resolveName(input.label, ctx.bindings),
				span: statement.span,
			}));
			body.push({
				kind: "if",
				condition: {
					kind: "binary",
					operator: "==",
					left: {
						kind: "call",
						callee: policyFn,
						args: policyArgs,
						span: statement.span,
					},
					right: { kind: "literal", value: false, span: statement.span },
					span: statement.span,
				},
				thenBody: [
					{
						kind: "return",
						value: workflowFailureValue(options, ctx, statement.span, `Policy ${options.requiredPolicy} denied`),
						span: statement.span,
					},
				],
				elseBody: [],
				span: statement.span,
			});
		}
	}

	const stepExpression = desugarExpression(statement.value, ctx);
	const stepValue = options?.timeoutSeconds
		? workflowTimedStepExpression(stepExpression, options.timeoutSeconds, statement.span)
		: stepExpression;
	const attempts = workflowAttemptIndices(options?.retryCount);
	const lastAttempt = attempts.at(-1) ?? 0;
	const needsRetryLoop = attempts.length > 1;

	if (needsRetryLoop) {
		body.push(mutableValue("__pointStepDone", { kind: "typeRef", name: "Bool", args: [] }, { kind: "literal", value: false, span: statement.span }, true, statement.span));
	}

	const errorBody: PointCoreStatement[] = needsRetryLoop
		? [
				{
					kind: "if",
					condition: {
						kind: "binary",
						operator: "==",
						left: { kind: "identifier", name: "__pointAttempt", span: statement.span },
						right: { kind: "literal", value: lastAttempt, span: statement.span },
						span: statement.span,
					},
					thenBody: [
						{
							kind: "return",
							value: workflowFailureValue(options, ctx, statement.span, undefined, { kind: "identifier", name, span: statement.span }),
							span: statement.span,
						},
					],
					elseBody: [],
					span: statement.span,
				},
			]
		: [
				{
					kind: "return",
					value: workflowFailureValue(options, ctx, statement.span, undefined, { kind: "identifier", name, span: statement.span }),
					span: statement.span,
				},
			];

	const assignStep: PointCoreStatement = {
		kind: "assignment",
		name,
		operator: "=",
		value: stepValue,
		span: statement.span,
	};

	const runStep: PointCoreStatement[] = [
		assignStep,
		...guardPathCheckStatements(name, options?.fileScopeGuard, guards, statement.span),
		{
			kind: "if",
			condition: {
				kind: "binary",
				operator: "==",
				left: {
					kind: "call",
					callee: "pointIsError",
					args: [{ kind: "identifier", name, span: statement.span }],
					span: statement.span,
				},
				right: { kind: "literal", value: false, span: statement.span },
				span: statement.span,
			},
			thenBody: needsRetryLoop
				? [{ kind: "assignment", name: "__pointStepDone", operator: "=", value: { kind: "literal", value: true, span: statement.span }, span: statement.span }]
				: [],
			elseBody: errorBody,
			span: statement.span,
		},
	];

	body.push(mutableValue(name, ctx.outputType, workflowStepInitializer(ctx.outputType, statement.span), true, statement.span));

	if (needsRetryLoop) {
		body.push({
			kind: "for",
			itemName: "__pointAttempt",
			iterable: { kind: "list", items: attempts.map((attempt) => ({ kind: "literal", value: attempt, span: statement.span })), span: statement.span },
			body: [
				{
					kind: "if",
					condition: {
						kind: "binary",
						operator: "==",
						left: { kind: "identifier", name: "__pointStepDone", span: statement.span },
						right: { kind: "literal", value: false, span: statement.span },
						span: statement.span,
					},
					thenBody: runStep,
					elseBody: [],
					span: statement.span,
				},
			],
			span: statement.span,
		});
	} else {
		body.push(...runStep);
	}

	return body;
}

function guardPathCheckStatements(
	bindingName: string,
	guardName: string | undefined,
	guards: Map<string, PointSemanticGuardDeclaration>,
	span?: PointSourceSpan,
): PointCoreStatement[] {
	if (!guardName) return [];
	const guard = guards.get(guardName);
	if (!guard) return [];
	const patternsConst = guardPatternsConstName(guard.name);
	return [
		{
			kind: "if",
			condition: {
				kind: "binary",
				operator: "and",
				left: {
					kind: "binary",
					operator: "==",
					left: {
						kind: "call",
						callee: "pointIsError",
						args: [{ kind: "identifier", name: bindingName, span }],
						span,
					},
					right: { kind: "literal", value: false, span },
					span,
				},
				right: {
					kind: "binary",
					operator: "==",
					left: {
						kind: "call",
						callee: "pointGuardPathAllowed",
						args: [
							{ kind: "identifier", name: bindingName, span },
							{ kind: "identifier", name: patternsConst, span },
						],
						span,
					},
					right: { kind: "literal", value: false, span },
					span,
				},
				span,
			},
			thenBody: [
				{
					kind: "assignment",
					name: bindingName,
					operator: "=",
					value: {
						kind: "call",
						callee: "Error",
						args: [{ kind: "literal", value: `Path outside guard ${guardName}`, span }],
						span,
					},
					span,
				},
			],
			elseBody: [],
			span,
		},
	];
}

function pipelineLogPhase(
	pipelineName: string,
	stepName: string,
	phase: "start" | "complete" | "failure",
	span?: PointSourceSpan,
): PointCoreStatement[] {
	return [
		{
			kind: "expression",
			value: pipelineEmitLogCall(pipelineName, stepName, phase, span),
			span,
		},
	];
}

function pipelineLogStepResult(
	pipelineName: string,
	stepName: string,
	bindingName: string,
	span?: PointSourceSpan,
): PointCoreStatement[] {
	return [
		{
			kind: "if",
			condition: {
				kind: "call",
				callee: "pointIsError",
				args: [{ kind: "identifier", name: bindingName, span }],
				span,
			},
			thenBody: [
				{
					kind: "expression",
					value: pipelineEmitLogCall(pipelineName, stepName, "failure", span, false, {
						kind: "identifier",
						name: bindingName,
						span,
					}),
					span,
				},
			],
			elseBody: [
				{
					kind: "expression",
					value: pipelineEmitLogCall(pipelineName, stepName, "complete", span, true),
					span,
				},
			],
			span,
		},
	];
}

function pipelineEmitLogCall(
	pipelineName: string,
	stepName: string,
	phase: "start" | "complete" | "failure",
	span?: PointSourceSpan,
	ok?: boolean | PointCoreExpression,
	error?: PointCoreExpression,
): PointCoreExpression {
	const logParam = pipelineLogParamName();
	const args: PointCoreExpression[] = [
		{ kind: "identifier", name: logParam, span },
		{ kind: "literal", value: pipelineName, span },
		{ kind: "literal", value: stepName, span },
		{ kind: "literal", value: phase, span },
	];
	if (ok !== undefined) {
		args.push(typeof ok === "boolean" ? { kind: "literal", value: ok, span } : ok);
	}
	if (error) args.push(error);
	return { kind: "call", callee: "pointPipelineEmitLog", args, span };
}

function workflowAttemptIndices(retryCount?: number): number[] {
	const total = Math.max(1, retryCount ?? 1);
	return Array.from({ length: total }, (_, index) => index);
}

function workflowTimedStepExpression(
	stepExpression: PointCoreExpression,
	timeoutSeconds: number,
	span?: PointSourceSpan,
): PointCoreExpression {
	const awaited = stepExpression.kind === "await" ? stepExpression.value : stepExpression;
	return {
		kind: "await",
		value: {
			kind: "call",
			callee: "pointWorkflowTimedStep",
			args: [awaited, { kind: "literal", value: timeoutSeconds * 1000, span }],
			span,
		},
		span,
	};
}

function workflowStepInitializer(outputType: PointCoreTypeExpression, span?: PointSourceSpan): PointCoreExpression {
	if (outputType.name === "Or" && outputType.args.some((arg) => arg.name === "Error")) {
		return {
			kind: "call",
			callee: "Error",
			args: [{ kind: "literal", value: "", span }],
			span,
		};
	}
	if (outputType.name === "Text") {
		return { kind: "literal", value: "", span };
	}
	return { kind: "literal", value: null, span };
}

function workflowFailureValue(
	options: PointSemanticWorkflowStepOptions | undefined,
	ctx: DesugarContext,
	span: PointSourceSpan | undefined,
	defaultMessage?: string,
	fallback?: PointCoreExpression,
): PointCoreExpression {
	if (options?.onFailure) return desugarExpression(options.onFailure, ctx);
	if (fallback) return fallback;
	return {
		kind: "call",
		callee: "Error",
		args: [{ kind: "literal", value: defaultMessage ?? "Workflow step failed", span }],
		span,
	};
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
	return { kind: "value", mutable, name, type, value, span };
}

function desugarExpression(expression: PointSemanticExpression, ctx: DesugarContext): PointCoreExpression {
	switch (expression.kind) {
		case "literal":
			return { kind: "literal", value: expression.value, span: expression.span };
		case "name": {
			const payload = ctx.payloadFields?.get(expression.label);
			if (payload) {
				return {
					kind: "property",
					target: { kind: "identifier", name: payload.base, span: expression.span },
					name: payload.field,
					span: expression.span,
				};
			}
			return { kind: "identifier", name: resolveName(expression.label, ctx.bindings), span: expression.span };
		}
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
		case "variant":
			return {
				kind: "variant",
				caseName: toPascalCase(expression.caseLabel),
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
