import type { PointCoreExpression, PointCoreStatement, PointSemanticDataLoad, PointSourceSpan } from "./ast.ts";
import { tagEmittedLine } from "./source-map.ts";
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

function emitStateReturn(
	expression: PointCoreExpression | undefined,
	className?: string,
	style?: string[],
	span?: PointSourceSpan,
): string[] | null {
	if (!expression) return null;
	return [tagEmittedLine(`return ${emitViewRenderFragment(expression, className, style)};`, span)];
}

export function emitDataLoadHookLines(spec: PointSemanticDataLoad, paramNames: string[]): string[] {
	const deps = paramNames.length > 0 ? `[${paramNames.join(", ")}]` : "[]";
	const setterName = capitalize(spec.bindingName);
	const refreshMs = spec.refreshIntervalMs !== undefined ? String(spec.refreshIntervalMs) : null;
	const effectCleanupLines =
		refreshMs !== null
			? [
					`  const intervalId = setInterval(() => { void load(false); }, ${refreshMs});`,
					"  return () => {",
					"    cancelled = true;",
					"    clearInterval(intervalId);",
					"  };",
				]
			: ["  return () => { cancelled = true; };"];

	if (spec.source === "fetch") {
		const tsType = spec.fetchTsType ?? "unknown[]";
		const url = JSON.stringify(spec.fetchUrl ?? "/");
		const jsonField = JSON.stringify(spec.fetchJsonField ?? "data");
		return [
			`const [${spec.bindingName}, set${setterName}] = React.useState<${tsType} | undefined>(undefined);`,
			"const [loading, setLoading] = React.useState(true);",
			"const [error, setError] = React.useState<unknown>(null);",
			"React.useEffect(() => {",
			"  let cancelled = false;",
			"  const load = async (initial: boolean) => {",
			"    if (initial) {",
			"      setLoading(true);",
			"      setError(null);",
			"    }",
			"    try {",
			`      const response = await fetch(${url});`,
			"      if (!response.ok) throw new Error(`HTTP ${response.status}`);",
			"      const body = await response.json();",
			`      const result = body[${jsonField}];`,
			`      if (!cancelled) set${setterName}(result);`,
			"    } catch (err) {",
			"      if (!cancelled) setError(err);",
			"    } finally {",
			"      if (initial && !cancelled) setLoading(false);",
			"    }",
			"  };",
			"  void load(true);",
			...effectCleanupLines,
			`}, ${deps});`,
		];
	}
	return [
		`const [${spec.bindingName}, set${setterName}] = React.useState<Awaited<ReturnType<typeof ${spec.actionFunction}>> | undefined>(undefined);`,
		"const [loading, setLoading] = React.useState(true);",
		"const [error, setError] = React.useState<unknown>(null);",
		"React.useEffect(() => {",
		"  let cancelled = false;",
		"  const load = async (initial: boolean) => {",
		"    if (initial) {",
		"      setLoading(true);",
		"      setError(null);",
		"    }",
		"    try {",
		`      const result = await ${spec.actionFunction}();`,
		`      if (!cancelled) set${setterName}(result);`,
		"    } catch (err) {",
		"      if (!cancelled) setError(err);",
		"    } finally {",
		"      if (initial && !cancelled) setLoading(false);",
		"    }",
		"  };",
		"  void load(true);",
		...effectCleanupLines,
		`}, ${deps});`,
	];
}

export function emitDataLoadGuardLines(spec: PointSemanticDataLoad): string[] {
	const lines: string[] = [];
	const loadingReturn = emitStateReturn(spec.loading, spec.loadingClassName, spec.loadingStyle, spec.loadingSpan);
	if (loadingReturn) lines.push(tagEmittedLine("if (loading) {", spec.loadingSpan), ...indent(loadingReturn), "}");
	const errorReturn = emitStateReturn(spec.error, spec.errorClassName, spec.errorStyle, spec.errorSpan);
	if (errorReturn) lines.push(tagEmittedLine("if (error) {", spec.errorSpan), ...indent(errorReturn), "}");
	const emptyReturn = emitStateReturn(spec.empty, spec.emptyClassName, spec.emptyStyle, spec.emptySpan);
	if (emptyReturn) {
		lines.push(
			tagEmittedLine(`if (pointIsEmptyData(${spec.bindingName})) {`, spec.emptySpan),
			...indent(emptyReturn),
			"}",
		);
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
	const directRenders = body.filter((statement) => statement.kind === "return" && statement.value);
	const hasConditionalRenders = body.some(
		(statement) =>
			statement.kind === "if" &&
			statement.thenBody.some((thenStatement) => thenStatement.kind === "return" && thenStatement.value),
	);
	if (!hasConditionalRenders && directRenders.length > 1) {
		const fragments = directRenders.map((statement) =>
			emitViewRenderFragment(statement.value!, statement.className, statement.style),
		);
		return `<>` + fragments.join("") + `</>`;
	}
	if (!hasConditionalRenders && directRenders.length === 1) {
		return emitViewRenderFragment(directRenders[0]!.value!, directRenders[0]!.className, directRenders[0]!.style);
	}
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
