import type { PointCoreExpression, PointCoreProgram } from "./ast.ts";

function declarationHasOrchestrationExtensions(
	declaration: { body: Array<{ kind: string; options?: { retryCount?: number; timeoutSeconds?: number; requiredPolicy?: string; fileScopeGuard?: string; onFailure?: unknown } }> },
): boolean {
	return declaration.body.some((statement) => {
		if (statement.kind !== "step" || !statement.options) return false;
		const options = statement.options;
		return Boolean(
			options.retryCount ||
				options.timeoutSeconds ||
				options.requiredPolicy ||
				options.fileScopeGuard ||
				options.onFailure,
		);
	});
}

export function programHasWorkflowExtensions(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some(
		(declaration) => declaration.kind === "workflow" && declarationHasOrchestrationExtensions(declaration),
	);
}

export function programHasOrchestrationExtensions(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some(
		(declaration) =>
			(declaration.kind === "workflow" || declaration.kind === "pipeline") &&
			declarationHasOrchestrationExtensions(declaration),
	);
}

export function programNeedsWorkflowTimeout(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some((declaration) =>
		declaration.kind === "workflow" || declaration.kind === "pipeline"
			? declaration.body.some((statement) => statement.kind === "step" && Boolean(statement.options?.timeoutSeconds))
			: false,
	);
}

export function emitPointWorkflowHelpers(program: PointCoreProgram): string[] {
	const lines = [
		"function pointIsError(value: unknown): value is { message: string } {",
		'  return typeof value === "object" && value !== null && "message" in value && typeof (value as { message?: unknown }).message === "string";',
		"}",
		"",
	];
	if (programNeedsWorkflowTimeout(program)) {
		const hasSleep = program.declarations.some(
			(declaration) => declaration.kind === "external" && declaration.name === "sleepMilliseconds",
		);
		if (!hasSleep) {
			lines.unshift('import { sleep as sleepMilliseconds } from "@hatchingpoint/point/std/time";', "");
		}
		lines.push(
			"async function pointWorkflowTimedStep<T>(run: () => Promise<T>, ms: number): Promise<T | { message: string }> {",
			"  return await Promise.race([",
			"    run(),",
			"    (async () => {",
			"      await sleepMilliseconds(ms);",
			'      return { message: "Workflow step timed out" };',
			"    })(),",
			"  ]);",
			"}",
			"",
		);
	}
	return lines;
}

export function emitPointWorkflowTimedStepCall(expression: Extract<PointCoreExpression, { kind: "call" }>): string {
	const run = expression.args[0];
	const ms = expression.args[1];
	if (!run || !ms) return "pointWorkflowTimedStep(async () => undefined, 0)";
	return `pointWorkflowTimedStep(async () => { return await ${emitWorkflowRun(run)}; }, ${emitWorkflowExpr(ms)})`;
}

function emitWorkflowRun(expression: PointCoreExpression): string {
	if (expression.kind === "await") return emitWorkflowRun(expression.value);
	return emitWorkflowExpr(expression);
}

function emitWorkflowExpr(expression: PointCoreExpression): string {
	if (expression.kind === "literal") return JSON.stringify(expression.value);
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "property") return `${emitWorkflowExpr(expression.target)}.${expression.name}`;
	if (expression.kind === "call") {
		if (expression.callee === "Error") {
			return `{ message: ${expression.args[0] ? emitWorkflowExpr(expression.args[0]) : '""'} }`;
		}
		return `${expression.callee}(${expression.args.map(emitWorkflowExpr).join(", ")})`;
	}
	if (expression.kind === "binary") {
		const op = expression.operator === "and" ? "&&" : expression.operator === "or" ? "||" : expression.operator;
		return `(${emitWorkflowExpr(expression.left)} ${op} ${emitWorkflowExpr(expression.right)})`;
	}
	if (expression.kind === "list") return `[${expression.items.map(emitWorkflowExpr).join(", ")}]`;
	if (expression.kind === "record") {
		return `{ ${expression.fields.map((field) => `${field.name}: ${emitWorkflowExpr(field.value)}`).join(", ")} }`;
	}
	return "undefined";
}
