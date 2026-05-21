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
	PointSemanticActionStatement,
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
		case "view":
			return [
				`view ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatViewOutput(declaration.output),
				...declaration.body.map((statement) => `  ${formatViewStatement(statement)}`),
			];
		case "page":
			return [
				`page ${declaration.name}`,
				...formatInputs(declaration.inputs),
				`  title ${formatExpression(declaration.title)}`,
				...(declaration.description ? [`  description ${formatExpression(declaration.description)}`] : []),
				`  main render ${formatExpression(declaration.main)}`,
			];
		case "route":
			return [
				`route ${declaration.name}`,
				`  method ${declaration.method}`,
				`  path ${JSON.stringify(declaration.path)}`,
				...formatInputs(declaration.inputs).map((line) => `  ${line.trimStart()}`),
				...formatOutput(declaration.output, declaration.kind).map((line) => `  ${line.trimStart()}`),
				...declaration.body.map((statement) => `  ${formatRouteStatement(statement)}`),
			];
		case "workflow":
			return [
				`workflow ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatWorkflowStatement(statement)}`),
			];
		case "command":
			return [
				`command ${declaration.name}`,
				...formatInputs(declaration.inputs),
				...formatOutput(declaration.output, declaration.kind),
				...declaration.body.map((statement) => `  ${formatCommandStatement(statement)}`),
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
		if (kind === "calculation" || kind === "rule" || kind === "workflow") return [];
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
	return `otherwise return ${formatExpression(statement.value)}`;
}

function formatActionStatement(statement: PointSemanticActionStatement): string {
	return `return ${formatExpression(statement.value)}`;
}

function formatPolicyStatement(statement: PointSemanticPolicyStatement): string {
	if (statement.kind === "deny") return `deny ${formatExpression(statement.condition)}`;
	if (statement.kind === "require") return `require ${formatExpression(statement.condition)}`;
	return `allow ${formatExpression(statement.condition)}`;
}

function formatViewStatement(statement: PointSemanticViewStatement): string {
	if (statement.kind === "whenRender") return `when ${formatExpression(statement.condition)} render ${formatExpression(statement.value)}`;
	return `render ${formatExpression(statement.value)}`;
}

function formatRouteStatement(statement: PointSemanticRouteStatement): string {
	return `return ${formatExpression(statement.value)}`;
}

function formatWorkflowStatement(statement: PointSemanticWorkflowStatement): string {
	if (statement.kind === "step") return `step ${statement.name} is ${formatExpression(statement.value)}`;
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
	return `Error ${JSON.stringify(expression.message)}`;
}

function formatType(type: PointSemanticTypeExpression): string {
	if (type.name === "Or") return type.args.map(formatType).join(" or ");
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatType).join(", ")}>`;
}
