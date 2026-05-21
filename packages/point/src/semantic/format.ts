import type {
	PointSemanticBinding,
	PointSemanticCalculationStatement,
	PointSemanticCommandStatement,
	PointSemanticDeclaration,
	PointSemanticExpression,
	PointSemanticLabelStatement,
	PointSemanticMutationStatement,
	PointSemanticOutputBinding,
	PointSemanticPolicyStatement,
	PointSemanticProgram,
	PointSemanticRouteStatement,
	PointSemanticRuleStatement,
	PointSemanticTypeExpression,
	PointSemanticViewStatement,
	PointSemanticWorkflowStatement,
	PointSemanticPipelineStatement,
	PointSemanticActionStatement,
	PointSemanticServerDbStatement,
} from "./ast.ts";

export function formatSemanticProgram(program: PointSemanticProgram): string {
	const blocks: string[] = [];
	if (program.module) blocks.push(`module ${program.module}`);
	for (const use of program.uses) {
		blocks.push(use.from ? `use ${use.moduleName} from ${JSON.stringify(use.from)}` : `use ${use.moduleName}`);
	}
	for (const declaration of program.declarations) {
		blocks.push(formatDeclaration(declaration).join("\n"));
	}
	return `${blocks.join("\n\n")}\n`;
}

function formatDeclaration(declaration: PointSemanticDeclaration): string[] {
	switch (declaration.kind) {
		case "record":
			return [`record ${declaration.name}`, ...declaration.fields.map((field) => `  ${field.label}: ${formatType(field.type)}`)];
		case "variant":
			return [
				`variant ${declaration.name}`,
				...declaration.cases.flatMap((variantCase) =>
					variantCase.fields.length === 0
						? [`  ${variantCase.label}`]
						: [
								`  ${variantCase.label} with ${variantCase.fields
									.map((field) => `${field.label}: ${formatType(field.type)}`)
									.join(" and ")}`,
							],
				),
			];
		case "external":
			return [
				`external ${declaration.name}`,
				...declaration.functions.map(
					(fn) =>
						`  ${fn.label}(${fn.params.map(formatBinding).join(", ")}): ${formatType(fn.returnType)} from ${JSON.stringify(fn.from)}${fn.importAs ? ` as ${fn.importAs}` : ""}`,
				),
			];
		case "calculation":
			return [
				`calculation ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatCalculationStatement(statement)}`),
			];
		case "rule":
			return [
				`rule ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.flatMap((statement) => formatRuleStatement(statement)),
			];
		case "label":
			return [
				`label ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatLabelStatement(statement)}`),
			];
		case "action":
			return [
				`action ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...(declaration.touches.length > 0 ? [`  touches ${declaration.touches.join(", ")}`] : []),
				...declaration.body.map((statement) => `  ${formatActionStatement(statement)}`),
			];
		case "policy":
			return [
				`policy ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...declaration.body.map((statement) => `  ${formatPolicyStatement(statement)}`),
			];
		case "guard":
			return [`guard ${declaration.name}`, ...declaration.patterns.map((pattern) => `  allow ${JSON.stringify(pattern)}`)];
		case "view":
			return [
				`view ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatViewOutput(declaration.output),
				...declaration.body.map((statement) => `  ${formatViewStatement(statement)}`),
			];
		case "layout":
			return [
				`layout ${declaration.name}`,
				...declaration.slots.map((slot) => `  slot ${slot.name} render ${formatExpression(slot.content)}`),
			];
		case "navigation":
			return [
				`navigation ${declaration.name}`,
				...declaration.routes.map((route) => `  path ${JSON.stringify(route.path)} page ${route.pageName}`),
				...(declaration.bootstrapRouter ? ["  bootstrap router"] : []),
			];
		case "page":
			return [
				`page ${declaration.name}`,
				...(declaration.layout ? [`  layout ${declaration.layout}`] : []),
				...formatInputs(declaration.inputs),
				...(declaration.loadData ? [`  load data from action ${declaration.loadData}`] : []),
				...(declaration.streamSubscribePath ? [`  subscribe to ${JSON.stringify(declaration.streamSubscribePath)}`] : []),
				...(declaration.streamSubscribeRoute ? [`  subscribe to stream ${declaration.streamSubscribeRoute}`] : []),
				...(declaration.onMessageCall ? [`  on message call ${declaration.onMessageCall}`] : []),
				...(declaration.whenConnectingRender
					? [
							declaration.whenConnectingClassName
								? `  when connecting render class "${declaration.whenConnectingClassName}" ${formatExpression(declaration.whenConnectingRender)}`
								: `  when connecting render ${formatExpression(declaration.whenConnectingRender)}`,
						]
					: []),
				...(declaration.whenDisconnectedRender
					? [
							declaration.whenDisconnectedClassName
								? `  when disconnected render class "${declaration.whenDisconnectedClassName}" ${formatExpression(declaration.whenDisconnectedRender)}`
								: `  when disconnected render ${formatExpression(declaration.whenDisconnectedRender)}`,
						]
					: []),
				...(declaration.whenLoadingRender
					? [
							declaration.whenLoadingClassName
								? `  when loading render class "${declaration.whenLoadingClassName}" ${formatExpression(declaration.whenLoadingRender)}`
								: `  when loading render ${formatExpression(declaration.whenLoadingRender)}`,
						]
					: []),
				...(declaration.whenErrorRender
					? [
							declaration.whenErrorClassName
								? `  when error render class "${declaration.whenErrorClassName}" ${formatExpression(declaration.whenErrorRender)}`
								: `  when error render ${formatExpression(declaration.whenErrorRender)}`,
						]
					: []),
				...(declaration.whenEmptyRender
					? [
							declaration.whenEmptyClassName
								? `  when empty render class "${declaration.whenEmptyClassName}" ${formatExpression(declaration.whenEmptyRender)}`
								: `  when empty render ${formatExpression(declaration.whenEmptyRender)}`,
						]
					: []),
				`  title ${formatExpression(declaration.title)}`,
				...(declaration.description ? [`  description ${formatExpression(declaration.description)}`] : []),
				declaration.mainClassName
					? `  main render class "${declaration.mainClassName}" ${formatExpression(declaration.main)}`
					: `  main render ${formatExpression(declaration.main)}`,
			];
		case "middleware":
			return [
				`middleware ${declaration.name}`,
				...formatInputs(declaration.inputs).map((line) => `  ${line.trimStart()}`),
				...formatOutput(declaration.output, declaration.kind).map((line) => `  ${line.trimStart()}`),
				...declaration.body.map((statement) => `  ${formatLabelStatement(statement)}`),
			];
		case "route":
			return [
				`route ${declaration.name}`,
				`  method ${declaration.method}`,
				`  path ${JSON.stringify(declaration.path)}`,
				...declaration.before.map((name) => `  before ${name}`),
				...formatInputs(declaration.inputs).map((line) => `  ${line.trimStart()}`),
				...formatOutput(declaration.output, declaration.kind).map((line) => `  ${line.trimStart()}`),
				...declaration.body.map((statement) => `  ${formatRouteStatement(statement)}`),
			];
		case "streamRoute":
			return [
				`stream route ${declaration.name}`,
				`  path ${JSON.stringify(declaration.path)}`,
				`  message ${formatType(declaration.messageType)}`,
				...declaration.handlers.map((handler) => `  ${formatStreamRouteHandler(handler)}`),
			];
		case "workflow":
			return [
				`workflow ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatWorkflowStatement(statement)}`),
			];
		case "pipeline":
			return [
				`pipeline ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatPipelineStatement(statement)}`),
			];
		case "session":
			return [
				`session ${declaration.name}`,
				`  message ${declaration.messageRecordName}`,
				`  messages ${formatBinding(declaration.messagesField)}`,
				`  stream response from action ${declaration.streamActionName}`,
			];
		case "command":
			return [
				`command ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatCommandStatement(statement)}`),
			];
		case "schedule":
			return [
				`schedule ${declaration.name}`,
				`  every ${declaration.interval.amount} ${declaration.interval.unit}`,
				`  call ${declaration.actionName}`,
			];
		case "prompt":
			return [
				`prompt ${declaration.name}`,
				`  version ${declaration.version}`,
				`  input ${declaration.recordName}`,
				`  template ${declaration.template.includes(" ") ? `"${declaration.template}"` : declaration.template}`,
			];
	}
}

function formatInputs(inputs: PointSemanticBinding[]): string[] {
	return inputs.map((input) => `  input ${formatBinding(input)}`);
}

function formatBinding(binding: PointSemanticBinding): string {
	return `${binding.label}: ${formatType(binding.type)}`;
}

function formatOutput(output: PointSemanticOutputBinding, kind: PointSemanticDeclaration["kind"]): string[] {
	if (kind === "label" && output.name === "result") return [`  output ${formatType(output.type)}`];
	if (kind === "policy") return [];
	if (kind === "view" && output.name === "page" && output.type.name === "Page") return [];
	if (output.type.name === "Void" && output.name === "result") {
		if (kind === "action" || kind === "command") return ["  output Void"];
		if (kind === "calculation" || kind === "rule" || kind === "workflow" || kind === "pipeline") return [];
	}
	return [`  output ${output.name}: ${formatType(output.type)}`];
}

function formatViewOutput(output: PointSemanticOutputBinding): string[] {
	if (output.name === "page" && output.type.name === "Page") return [];
	return formatOutput(output, "view");
}

function formatCalculationStatement(statement: PointSemanticCalculationStatement): string {
	if (statement.kind === "assignIs") return `${statement.name} is ${formatExpression(statement.value)}`;
	if (statement.kind === "startsAt") return `${statement.name} starts at ${formatExpression(statement.value)}`;
	if (statement.kind === "startsAs") return `${statement.name} starts as ${formatExpression(statement.value)}`;
	if (statement.kind === "forEach") {
		return [`for each ${statement.item} in ${formatExpression(statement.iterable)}`, ...statement.body.map((mutation) => `  ${formatMutation(mutation)}`)].join(
			"\n",
		);
	}
	if (statement.kind === "return") return `return ${formatExpression(statement.value)}`;
	return formatMutation(statement);
}

function formatRuleStatement(statement: PointSemanticRuleStatement): string[] {
	if (statement.kind === "startsAt") return [`  ${statement.name} starts at ${formatExpression(statement.value)}`];
	if (statement.kind === "addWhen") return [`  add ${formatExpression(statement.amount)} when ${formatExpression(statement.condition)}`];
	if (statement.kind === "forEach") {
		return [
			`  for each ${statement.item} in ${formatExpression(statement.iterable)}`,
			...statement.body.map((mutation) => `  ${formatMutation(mutation)}`),
		];
	}
	if (statement.kind === "return") return [`  return ${formatExpression(statement.value)}`];
	return [`  ${formatMutation(statement)}`];
}

function formatLabelStatement(statement: PointSemanticLabelStatement): string {
	if (statement.kind === "whenReturn") return `when ${formatExpression(statement.condition)} return ${formatExpression(statement.value)}`;
	if (statement.kind === "onVariantReturn") {
		const payload = statement.bindings.length > 0 ? ` with ${statement.bindings.join(" and ")}` : "";
		return `on ${statement.caseLabel}${payload} return ${formatExpression(statement.value)}`;
	}
	return `otherwise return ${formatExpression(statement.value)}`;
}

function formatActionStatement(statement: PointSemanticActionStatement): string {
	if (statement.kind === "yield") return `yield ${formatExpression(statement.value)}`;
	return `return ${formatExpression(statement.value)}`;
}

function formatPolicyStatement(statement: PointSemanticPolicyStatement): string {
	if (statement.kind === "deny") return `deny ${formatExpression(statement.condition)}`;
	if (statement.kind === "require") return `require ${formatExpression(statement.condition)}`;
	return `allow ${formatExpression(statement.condition)}`;
}

function formatViewStatement(statement: PointSemanticViewStatement): string {
	if (statement.kind === "loadData") return `load data from action ${statement.action}`;
	if (statement.kind === "onMountCall") return `on mount call ${statement.action}`;
	if (statement.kind === "streamSubscribePath") return `subscribe to ${JSON.stringify(statement.path)}`;
	if (statement.kind === "streamSubscribeRoute") return `subscribe to stream ${statement.routeName}`;
	if (statement.kind === "onMessageCall") return `on message call ${statement.callback}`;
	if (statement.kind === "whenConnectingRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		return `when connecting render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "whenDisconnectedRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		return `when disconnected render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "whenLoadingRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		return `when loading render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "whenErrorRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		return `when error render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "whenEmptyRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		return `when empty render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "link") return `link "${statement.label}" to "${statement.path}"`;
	if (statement.kind === "navigate") return `navigate to "${statement.path}"`;
	if (statement.kind === "whenRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		return `when ${formatExpression(statement.condition)} render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "bindCheckbox") return `bind checkbox "${statement.label}" to ${formatExpression(statement.target)}`;
	if (statement.kind === "bindField") return `bind field "${statement.label}" to ${formatExpression(statement.target)}`;
	if (statement.kind === "form") {
		return ["form", ...statement.bindings.map((binding) => `  ${formatViewStatement(binding)}`)].join("\n");
	}
	if (statement.kind === "eachRender") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		if (statement.linkPath) {
			return `each ${statement.item} in ${formatExpression(statement.iterable)} render ${classPrefix}link ${formatExpression(statement.value)} to ${formatExpression(statement.linkPath)}`;
		}
		return `each ${statement.item} in ${formatExpression(statement.iterable)} render ${classPrefix}${formatExpression(statement.value)}`;
	}
	if (statement.kind === "modal") {
		const classPrefix = statement.className ? `class "${statement.className}" ` : "";
		const whenPrefix = statement.when ? `when ${formatExpression(statement.when)} ` : "";
		return `modal "${statement.title}" ${whenPrefix}render ${classPrefix}${formatExpression(statement.value)}`.replace("  ", " ");
	}
	if (statement.kind === "tabs") {
		return ["tabs", ...statement.tabs.map((tab) => `  tab "${tab.label}" render ${tab.className ? `class "${tab.className}" ` : ""}${formatExpression(tab.value)}`)].join("\n");
	}
	if (statement.kind === "onChangeCall") return `on change call ${statement.callback}`;
	if (statement.className) return `render class "${statement.className}" ${formatExpression(statement.value)}`;
	return `render ${formatExpression(statement.value)}`;
}

function formatRouteStatement(statement: PointSemanticRouteStatement): string {
	if (statement.kind === "returnJson") {
		const parts = ["json"];
		if (statement.status) parts.push("status", formatExpression(statement.status));
		if (statement.headers) parts.push("headers", formatExpression(statement.headers));
		parts.push(formatExpression(statement.value));
		return `return ${parts.join(" ")}`;
	}
	return `return ${formatExpression(statement.value)}`;
}

function formatStreamRouteHandler(handler: {
	event: string;
	inputLabel?: string;
	mode?: "return" | "streamFromAction";
	value?: PointSemanticExpression;
	actionName?: string;
}): string {
	if (handler.mode === "streamFromAction") {
		return `on ${handler.event} stream from action ${handler.actionName ?? ""}`;
	}
	if (handler.event === "message") {
		return `on message ${handler.inputLabel ?? "message"} return ${formatExpression(handler.value!)}`;
	}
	return `on ${handler.event} return ${formatExpression(handler.value!)}`;
}

function formatWorkflowStatement(statement: PointSemanticWorkflowStatement): string {
	return formatOrchestrationStatement(statement);
}

function formatPipelineStatement(statement: PointSemanticPipelineStatement): string {
	return formatOrchestrationStatement(statement);
}

function formatOrchestrationStatement(
	statement: PointSemanticWorkflowStatement | PointSemanticPipelineStatement,
): string {
	if (statement.kind === "step") {
		const lines = [`step ${statement.name} is ${formatExpression(statement.value)}`];
		if (statement.options?.retryCount) lines.push(`    retry ${statement.options.retryCount} times`);
		if (statement.options?.timeoutSeconds) lines.push(`    timeout after ${statement.options.timeoutSeconds} seconds`);
		if (statement.options?.requiredPolicy) lines.push(`    require policy ${statement.options.requiredPolicy}`);
		if (statement.options?.fileScopeGuard) lines.push(`    touches file scope ${statement.options.fileScopeGuard}`);
		if (statement.options?.onFailure) lines.push(`    on failure return ${formatExpression(statement.options.onFailure)}`);
		return lines.join("\n");
	}
	return `return ${formatExpression(statement.value)}`;
}

function formatCommandStatement(statement: PointSemanticCommandStatement): string {
	return `return ${formatExpression(statement.value)}`;
}

function formatMutation(statement: PointSemanticMutationStatement): string {
	if (statement.kind === "addTo") return `add ${formatExpression(statement.amount)} to ${statement.target}`;
	if (statement.kind === "subtractFrom") return `subtract ${formatExpression(statement.amount)} from ${statement.target}`;
	return `set ${statement.target} to ${formatExpression(statement.value)}`;
}

function formatExpression(expression: PointSemanticExpression): string {
	if (expression.kind === "literal") {
		if (expression.value === null) return "none";
		return JSON.stringify(expression.value);
	}
	if (expression.kind === "name") return expression.label;
	if (expression.kind === "property") return `${formatExpression(expression.target)}.${expression.label}`;
	if (expression.kind === "binary") return `${formatExpression(expression.left)} ${expression.operator} ${formatExpression(expression.right)}`;
	if (expression.kind === "call") return `${expression.callee}(${expression.args.map(formatExpression).join(", ")})`;
	if (expression.kind === "await") return `await ${formatExpression(expression.value)}`;
	if (expression.kind === "list") return `[${expression.items.map(formatExpression).join(", ")}]`;
	if (expression.kind === "record") {
		return `{ ${expression.fields.map((field) => `${field.label}: ${formatExpression(field.value)}`).join(", ")} }`;
	}
	if (expression.kind === "variant") {
		const payload =
			expression.fields.length > 0
				? ` with ${expression.fields.map((field) => `${field.label}: ${formatExpression(field.value)}`).join(" and ")}`
				: "";
		return `${expression.caseLabel}${payload}`;
	}
	return `Error ${JSON.stringify(expression.message)}`;
}

function formatType(type: PointSemanticTypeExpression): string {
	if (type.name === "Or") return type.args.map(formatType).join(" or ");
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatType).join(", ")}>`;
}
