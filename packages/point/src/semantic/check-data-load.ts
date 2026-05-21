import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSemanticActionDeclaration, PointSemanticExpression, PointSemanticProgram, PointSemanticViewStatement } from "./ast.ts";
import { semanticFunctionName } from "./naming.ts";

function semanticRefFor(moduleName: string, path: string): string {
	return `point://semantic/${moduleName}/${path}`;
}

function expressionCallsAction(expression: PointSemanticExpression, actionName: string, functionName: string): boolean {
	if (expression.kind === "await") return expressionCallsAction(expression.value, actionName, functionName);
	if (expression.kind !== "call") return false;
	return expression.callee === actionName || expression.callee === functionName;
}

function statementUsesUnawaitedAction(
	statement: PointSemanticViewStatement,
	actionName: string,
	functionName: string,
): boolean {
	if (statement.kind !== "render" && statement.kind !== "whenRender") return false;
	const check = (expression: PointSemanticExpression): boolean => {
		if (expression.kind === "call" && (expression.callee === actionName || expression.callee === functionName)) return true;
		if (expression.kind === "await" && expression.value.kind === "call") {
			const callee = expression.value.callee;
			return callee === actionName || callee === functionName;
		}
		if (expression.kind === "binary") return check(expression.left) || check(expression.right);
		if (expression.kind === "property") return check(expression.target);
		if (expression.kind === "list") return expression.items.some(check);
		if (expression.kind === "record") return expression.fields.some((field) => check(field.value));
		return false;
	};
	if (statement.kind === "render") return check(statement.value);
	return check(statement.condition) || check(statement.value);
}

export function checkSemanticDataLoad(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const moduleName = program.module ?? "anonymous";
	const actions = new Map<string, PointSemanticActionDeclaration>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "action") actions.set(declaration.name, declaration);
	}

	const diagnostics: PointCoreDiagnostic[] = [];
	for (const declaration of program.declarations) {
		if (declaration.kind === "view") {
			const loadStatement = declaration.body.find(
				(statement): statement is Extract<PointSemanticViewStatement, { kind: "loadData" | "onMountCall" }> =>
					statement.kind === "loadData" || statement.kind === "onMountCall",
			);
			if (!loadStatement) continue;
			const actionName = loadStatement.action;
			const path = `view.${declaration.name}`;
			const ref = semanticRefFor(moduleName, path);
			const action = actions.get(actionName);
			if (!action) {
				diagnostics.push({
					code: "unknown-load-action",
					message: `View ${declaration.name} loads unknown action ${actionName}`,
					path,
					ref,
					severity: "error",
					span: loadStatement.span ?? declaration.span ?? null,
					repair: `Declare action ${actionName} or fix the load data from action name.`,
					relatedRefs: [semanticRefFor(moduleName, path)],
				});
				continue;
			}
			const functionName = semanticFunctionName(actionName, action.output.name, "action");
			for (const statement of declaration.body) {
				if (!statementUsesUnawaitedAction(statement, actionName, functionName)) continue;
				diagnostics.push({
					code: "missing-await",
					message: `Action ${actionName} must be awaited in view ${declaration.name}; use the data binding from load data from action`,
					path: `${path}.render`,
					ref,
					severity: "error",
					span: statement.span ?? declaration.span ?? null,
					expected: `await ${actionName}(...) or reference data`,
					actual: `${actionName}(...)`,
					repair: `Use the data binding from load data from action ${actionName} instead of calling the action directly.`,
					relatedRefs: [semanticRefFor(moduleName, `action.${actionName}`), ref],
				});
			}
		}
		if (declaration.kind === "page" && declaration.loadData) {
			const actionName = declaration.loadData;
			const path = `page.${declaration.name}`;
			const ref = semanticRefFor(moduleName, path);
			const action = actions.get(actionName);
			if (!action) {
				diagnostics.push({
					code: "unknown-load-action",
					message: `Page ${declaration.name} loads unknown action ${actionName}`,
					path,
					ref,
					severity: "error",
					span: declaration.span ?? null,
					repair: `Declare action ${actionName} or fix the load data from action name.`,
					relatedRefs: [ref],
				});
				continue;
			}
			const functionName = semanticFunctionName(actionName, action.output.name, "action");
			if (expressionCallsAction(declaration.main, actionName, functionName)) {
				diagnostics.push({
					code: "missing-await",
					message: `Action ${actionName} must be awaited on page ${declaration.name}; use the data binding from load data from action`,
					path: `${path}.main`,
					ref,
					severity: "error",
					span: declaration.span ?? null,
					expected: `await ${actionName}(...) or reference data`,
					actual: `${actionName}(...)`,
					repair: `Pass data to main render instead of calling ${actionName}() directly.`,
					relatedRefs: [semanticRefFor(moduleName, `action.${actionName}`), ref],
				});
			}
		}
	}
	return diagnostics;
}
