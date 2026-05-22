import type { PointCoreExpression, PointCoreStatement, PointSemanticDataLoad } from "./ast.ts";
import { resolveViewWrapperClassName } from "./ui-style.ts";

function escapeJsxText(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeJsxAttribute(value: string): string {
	return value.replaceAll('"', "&quot;");
}

function emitExpression(expression: PointCoreExpression): string {
	if (expression.kind === "literal") {
		if (typeof expression.value === "string") return JSON.stringify(expression.value);
		return String(expression.value);
	}
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "binary") {
		const op = expression.operator === "and" ? "&&" : expression.operator === "or" ? "||" : expression.operator;
		return `(${emitExpression(expression.left)} ${op} ${emitExpression(expression.right)})`;
	}
	if (expression.kind === "property") return `${emitExpression(expression.target)}.${expression.name}`;
	if (expression.kind === "call") {
		return `${expression.callee}(${expression.args.map(emitExpression).join(", ")})`;
	}
	if (expression.kind === "list") return `[${expression.items.map(emitExpression).join(", ")}]`;
	if (expression.kind === "record") {
		return `{ ${expression.fields.map((field) => `${field.name}: ${emitExpression(field.value)}`).join(", ")} }`;
	}
	return "null";
}

export function emitViewRenderFragment(expression: PointCoreExpression, className?: string, style?: string[]): string {
	const wrapperClassName = resolveViewWrapperClassName(className, style);
	if (!wrapperClassName) {
		if (expression.kind === "literal" && typeof expression.value === "string") {
			return `<>${escapeJsxText(expression.value)}</>`;
		}
		return `<>{${emitExpression(expression)}}</>`;
	}
	if (expression.kind === "literal" && typeof expression.value === "string") {
		return `<div className="${escapeJsxAttribute(wrapperClassName)}">${escapeJsxText(expression.value)}</div>`;
	}
	return `<div className="${escapeJsxAttribute(wrapperClassName)}">{${emitExpression(expression)}}</div>`;
}

function emitStateReturn(expression: PointCoreExpression | undefined, className?: string, style?: string[]): string[] | null {
	if (!expression) return null;
	return [`return ${emitViewRenderFragment(expression, className, style)};`];
}

export function emitDataLoadHookLines(spec: PointSemanticDataLoad, paramNames: string[]): string[] {
	const deps = paramNames.length > 0 ? `[${paramNames.join(", ")}]` : "[]";
	if (spec.source === "fetch") {
		const tsType = spec.fetchTsType ?? "unknown[]";
		const url = JSON.stringify(spec.fetchUrl ?? "/");
		const jsonField = JSON.stringify(spec.fetchJsonField ?? "data");
		return [
			`const [${spec.bindingName}, set${capitalize(spec.bindingName)}] = React.useState<${tsType} | undefined>(undefined);`,
			"const [loading, setLoading] = React.useState(true);",
			"const [error, setError] = React.useState<unknown>(null);",
			"React.useEffect(() => {",
			"  let cancelled = false;",
			"  (async () => {",
			"    setLoading(true);",
			"    setError(null);",
			"    try {",
			`      const response = await fetch(${url});`,
			"      if (!response.ok) throw new Error(`HTTP ${response.status}`);",
			"      const body = await response.json();",
			`      const result = body[${jsonField}];`,
			`      if (!cancelled) set${capitalize(spec.bindingName)}(result);`,
			"    } catch (err) {",
			"      if (!cancelled) setError(err);",
			"    } finally {",
			"      if (!cancelled) setLoading(false);",
			"    }",
			"  })();",
			"  return () => { cancelled = true; };",
			`}, ${deps});`,
		];
	}
	return [
		`const [${spec.bindingName}, set${capitalize(spec.bindingName)}] = React.useState<Awaited<ReturnType<typeof ${spec.actionFunction}>> | undefined>(undefined);`,
		"const [loading, setLoading] = React.useState(true);",
		"const [error, setError] = React.useState<unknown>(null);",
		"React.useEffect(() => {",
		"  let cancelled = false;",
		"  (async () => {",
		"    setLoading(true);",
		"    setError(null);",
		"    try {",
		`      const result = await ${spec.actionFunction}();`,
		`      if (!cancelled) set${capitalize(spec.bindingName)}(result);`,
		"    } catch (err) {",
		"      if (!cancelled) setError(err);",
		"    } finally {",
		"      if (!cancelled) setLoading(false);",
		"    }",
		"  })();",
		"  return () => { cancelled = true; };",
		`}, ${deps});`,
	];
}

export function emitDataLoadGuardLines(spec: PointSemanticDataLoad): string[] {
	const lines: string[] = [];
	const loadingReturn = emitStateReturn(spec.loading, spec.loadingClassName, spec.loadingStyle);
	if (loadingReturn) lines.push("if (loading) {", ...indent(loadingReturn), "}");
	const errorReturn = emitStateReturn(spec.error, spec.errorClassName, spec.errorStyle);
	if (errorReturn) lines.push("if (error) {", ...indent(errorReturn), "}");
	const emptyReturn = emitStateReturn(spec.empty, spec.emptyClassName, spec.emptyStyle);
	if (emptyReturn) {
		lines.push(`if (pointIsEmptyData(${spec.bindingName})) {`, ...indent(emptyReturn), "}");
	}
	return lines;
}

export function wrapBodyWithDataLoad(bodyLines: string[], spec: PointSemanticDataLoad, paramNames: string[]): string[] {
	return [...emitDataLoadHookLines(spec, paramNames), ...emitDataLoadGuardLines(spec), ...bodyLines];
}

export function emitPointIsEmptyDataHelper(): string[] {
	return [
		"function pointIsEmptyData(value: unknown): boolean {",
		"  if (value === undefined || value === null) return true;",
		"  if (Array.isArray(value)) return value.length === 0;",
		"  if (typeof value === \"string\") return value.length === 0;",
		"  return false;",
		"}",
		"",
	];
}

export function emitViewContentFromBody(body: PointCoreStatement[]): string {
	let expression = "null";
	for (let index = body.length - 1; index >= 0; index -= 1) {
		const statement = body[index];
		if (!statement) continue;
		if (statement.kind === "return" && statement.value) {
			expression = emitViewRenderFragment(statement.value, statement.className, statement.style);
			continue;
		}
		if (statement.kind === "if" && statement.thenBody.length === 1 && statement.thenBody[0]?.kind === "return" && statement.thenBody[0].value) {
			const thenReturn = statement.thenBody[0];
			const thenValue = emitViewRenderFragment(thenReturn.value, thenReturn.className, thenReturn.style);
			const cond =
				statement.condition.kind === "binary" || statement.condition.kind === "identifier"
					? emitExpression(statement.condition)
					: emitExpression(statement.condition);
			expression = `${cond} ? ${thenValue} : ${expression}`;
		}
	}
	return expression;
}

function capitalize(label: string): string {
	return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
}

function indent(lines: string[]): string[] {
	return lines.map((line) => `  ${line}`);
}
