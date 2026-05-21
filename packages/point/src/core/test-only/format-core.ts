import type {
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreFunctionDeclaration,
	PointCoreParameter,
	PointCoreProgram,
	PointCoreStatement,
	PointCoreTypeDeclaration,
	PointCoreValueDeclaration,
} from "../ast.ts";

/** Debug/test helper: pretty-print core AST as legacy core text. Not used in production. */
export function formatPointCore(program: PointCoreProgram): string {
	const lines: string[] = [];
	if (program.module) {
		lines.push(`module ${program.module}`, "");
	}
	program.declarations.forEach((declaration, index) => {
		if (index > 0) lines.push("");
		lines.push(...formatDeclaration(declaration));
	});
	return `${lines.join("\n")}\n`;
}

function formatDeclaration(declaration: PointCoreDeclaration): string[] {
	if (declaration.kind === "import") {
		return [`import { ${declaration.names.join(", ")} } from ${JSON.stringify(declaration.from)}`];
	}
	if (declaration.kind === "external") {
		const imported = declaration.importName ? ` as ${declaration.importName}` : "";
		return [
			`external fn ${declaration.name}(${declaration.params.map(formatParam).join(", ")}): ${formatTypeExpression(declaration.returnType)} from ${JSON.stringify(declaration.from)}${imported}`,
		];
	}
	if (declaration.kind === "value") return [formatValue(declaration)];
	if (declaration.kind === "type") return formatType(declaration);
	return formatFunction(declaration);
}

function formatType(declaration: PointCoreTypeDeclaration): string[] {
	return [
		`type ${declaration.name} {`,
		...declaration.fields.map((field) => `  ${formatParam(field)}`),
		"}",
	];
}

function formatFunction(declaration: PointCoreFunctionDeclaration): string[] {
	return [
		`fn ${declaration.name}(${declaration.params.map(formatParam).join(", ")}): ${formatTypeExpression(declaration.returnType)} {`,
		...indentLines(declaration.body.flatMap((statement) => formatStatementLines(statement))),
		"}",
	];
}

function formatStatementLines(statement: PointCoreStatement): string[] {
	if (statement.kind === "return") {
		return [statement.value ? `return ${formatExpression(statement.value)}` : "return"];
	}
	if (statement.kind === "value") return [formatValue(statement)];
	if (statement.kind === "assignment") return [`${statement.name} ${statement.operator} ${formatExpression(statement.value)}`];
	if (statement.kind === "if") return formatIf(statement);
	if (statement.kind === "for") {
		return [
			`for ${statement.itemName} in ${formatExpression(statement.iterable)} {`,
			...indentLines(statement.body.flatMap((child) => formatStatementLines(child))),
			"}",
		];
	}
	return [formatExpression(statement.value)];
}

function formatIf(statement: Extract<PointCoreStatement, { kind: "if" }>): string[] {
	const lines = [
		`if ${formatExpression(statement.condition)} {`,
		...indentLines(statement.thenBody.flatMap((child) => formatStatementLines(child))),
		"}",
	];
	if (statement.elseBody.length > 0) {
		lines.push(
			"else {",
			...indentLines(statement.elseBody.flatMap((child) => formatStatementLines(child))),
			"}",
		);
	}
	return lines;
}

function formatValue(declaration: PointCoreValueDeclaration): string {
	return `${declaration.mutable ? "var" : "let"} ${declaration.name}: ${formatTypeExpression(declaration.type)} = ${formatExpression(declaration.value)}`;
}

function formatParam(param: PointCoreParameter): string {
	return `${param.name}: ${formatTypeExpression(param.type)}`;
}

function formatExpression(expression: PointCoreExpression): string {
	if (expression.kind === "literal") return JSON.stringify(expression.value);
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "list") return `[${expression.items.map(formatExpression).join(", ")}]`;
	if (expression.kind === "record") {
		return `{ ${expression.fields.map((field) => `${field.name}: ${formatExpression(field.value)}`).join(", ")} }`;
	}
	if (expression.kind === "await") return `await ${formatExpression(expression.value)}`;
	if (expression.kind === "property") return `${formatExpression(expression.target)}.${expression.name}`;
	if (expression.kind === "binary") {
		return `${formatExpression(expression.left)} ${expression.operator} ${formatExpression(expression.right)}`;
	}
	return `${expression.callee}(${expression.args.map(formatExpression).join(", ")})`;
}

function formatTypeExpression(type: PointCoreParameter["type"]): string {
	if (type.args.length === 0) return String(type.name);
	if (type.name === "Or") return type.args.map(formatTypeExpression).join(" or ");
	return `${type.name}<${type.args.map(formatTypeExpression).join(", ")}>`;
}

function indentLines(lines: string[]): string[] {
	return lines.map((line) => `  ${line}`);
}
