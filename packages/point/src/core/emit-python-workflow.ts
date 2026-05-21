import type { PointCoreExpression, PointCoreProgram } from "./ast.ts";
import { programNeedsWorkflowTimeout } from "./emit-workflow.ts";

export function emitPythonWorkflowHelpers(program: PointCoreProgram): string[] {
	const lines = [
		"def pointIsError(value) -> bool:",
		'    return isinstance(value, dict) and isinstance(value.get("message"), str)',
		"",
	];
	if (programNeedsWorkflowTimeout(program)) {
		lines.push(
			"async def pointWorkflowTimedStep(run, ms: int):",
			"    import asyncio",
			"    try:",
			"        return await asyncio.wait_for(run(), ms / 1000)",
			"    except asyncio.TimeoutError:",
			'        return {"message": "Workflow step timed out"}',
			"",
		);
	}
	return lines;
}

export function emitPythonWorkflowTimedStepCall(expression: Extract<PointCoreExpression, { kind: "call" }>): string {
	const run = expression.args[0];
	const ms = expression.args[1];
	if (!run || !ms) return "pointWorkflowTimedStep(lambda: None, 0)";
	return `pointWorkflowTimedStep(lambda: ${emitPythonWorkflowRun(run)}, ${emitPythonWorkflowExpr(ms)})`;
}

function emitPythonWorkflowRun(expression: PointCoreExpression): string {
	if (expression.kind === "await") return emitPythonWorkflowRun(expression.value);
	return emitPythonWorkflowExpr(expression);
}

function emitPythonWorkflowExpr(expression: PointCoreExpression): string {
	if (expression.kind === "literal") return JSON.stringify(expression.value);
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "property") return `${emitPythonWorkflowExpr(expression.target)}[${JSON.stringify(expression.name)}]`;
	if (expression.kind === "call") {
		if (expression.callee === "Error") {
			return `{"message": ${expression.args[0] ? emitPythonWorkflowExpr(expression.args[0]) : '""'}}`;
		}
		return `${expression.callee}(${expression.args.map(emitPythonWorkflowExpr).join(", ")})`;
	}
	if (expression.kind === "binary") {
		const operator = expression.operator === "and" ? "and" : expression.operator === "or" ? "or" : expression.operator;
		return `(${emitPythonWorkflowExpr(expression.left)} ${operator} ${emitPythonWorkflowExpr(expression.right)})`;
	}
	if (expression.kind === "list") return `[${expression.items.map(emitPythonWorkflowExpr).join(", ")}]`;
	if (expression.kind === "record") {
		return `{${expression.fields.map((field) => `"${field.name}": ${emitPythonWorkflowExpr(field.value)}`).join(", ")}}`;
	}
	return "None";
}
