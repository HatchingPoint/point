import type { PointCoreDiagnostic } from "../core/check.ts";
import type {
	PointSemanticActionDeclaration,
	PointSemanticExpression,
	PointSemanticProgram,
	PointSemanticTypeExpression,
	PointSemanticViewDeclaration,
	PointSemanticViewStatement,
} from "./ast.ts";
import { semanticFunctionName } from "./naming.ts";

function semanticRefFor(moduleName: string, path: string): string {
	return `point://semantic/${moduleName}/${path}`;
}

function formatOutputType(type: PointSemanticTypeExpression): string {
	if (type.name === "Or") return type.args.map(formatOutputType).join(" or ");
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatOutputType).join(", ")}>`;
}

function loadDataRepairBlock(actionName: string, outputType: string): string {
	return [
		`load data from action ${actionName}`,
		`when loading render "Loading..."`,
		`when error render "Could not load"`,
		`render data  // data: ${outputType}`,
	].join("\n");
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

function viewCallsActionDirectly(
	declaration: PointSemanticViewDeclaration,
	actionName: string,
	functionName: string,
): PointSemanticViewStatement | null {
	for (const statement of declaration.body) {
		if (statementUsesUnawaitedAction(statement, actionName, functionName)) return statement;
	}
	return null;
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
			const refreshStatements = declaration.body.filter(
				(statement): statement is Extract<PointSemanticViewStatement, { kind: "refreshEvery" }> => statement.kind === "refreshEvery",
			);
			const hasActionOrMountLoad = declaration.body.some(
				(statement) => statement.kind === "loadData" || statement.kind === "onMountCall",
			);
			const hasFetchLoad = declaration.body.some((statement) => statement.kind === "loadFetch");
			const hasDataLoad = hasActionOrMountLoad || hasFetchLoad;
			if (refreshStatements.length > 1) {
				const path = `view.${declaration.name}`;
				const ref = semanticRefFor(moduleName, path);
				diagnostics.push({
					code: "duplicate-refresh-interval",
					message: `View ${declaration.name} declares more than one refresh interval; keep a single refresh every line`,
					path,
					ref,
					severity: "error",
					span: refreshStatements[1]?.span ?? declaration.span ?? null,
					expected: ["one refresh every line"],
					repair: `Remove extra refresh every lines so only one interval remains.`,
					relatedRefs: [ref],
				});
			}
			for (const refresh of refreshStatements) {
				if (refresh.count < 1 || !Number.isFinite(refresh.count)) {
					const path = `view.${declaration.name}`;
					const ref = semanticRefFor(moduleName, path);
					diagnostics.push({
						code: "invalid-refresh-interval",
						message: `View ${declaration.name} refresh interval must be a positive integer (1 or more)`,
						path,
						ref,
						severity: "error",
						span: refresh.span ?? declaration.span ?? null,
						expected: ["refresh every 30 seconds", "refresh every 1 minutes"],
						repair: `Use for example: refresh every 30 seconds or refresh every 1 minutes`,
						relatedRefs: [ref],
					});
				}
			}
			if (refreshStatements.length > 0 && !hasDataLoad) {
				const path = `view.${declaration.name}`;
				const ref = semanticRefFor(moduleName, path);
				const actionNames = [...actions.keys()].sort();
				diagnostics.push({
					code: "refresh-without-load",
					message: `View ${declaration.name} uses refresh every without load data from action, on mount call, or load data from fetch`,
					path,
					ref,
					severity: "error",
					span: refreshStatements[0]?.span ?? declaration.span ?? null,
					expected:
						actionNames.length > 0
							? actionNames.map((name) => `load data from action ${name}`)
							: ["load data from action <name>"],
					repair: `Add load data from action <name> (or on mount call, or load data from fetch GET ...) before refresh every.`,
					relatedRefs: [ref],
				});
			}
			const loadStatement = declaration.body.find(
				(statement): statement is Extract<PointSemanticViewStatement, { kind: "loadData" | "onMountCall" }> =>
					statement.kind === "loadData" || statement.kind === "onMountCall",
			);
			if (loadStatement) {
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
						expected: [...actions.keys()].sort(),
						actual: actionName,
						repair: `Declare action ${actionName} or fix the load data from action name.`,
						relatedRefs: [semanticRefFor(moduleName, path)],
					});
					continue;
				}
				const functionName = semanticFunctionName(actionName, action.output.name, "action");
				const outputType = formatOutputType(action.output.type);
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
						repair: `Use data from load data from action ${actionName} (type ${outputType}) instead of calling the action directly:\n${loadDataRepairBlock(actionName, outputType)}`,
						relatedRefs: [semanticRefFor(moduleName, `action.${actionName}`), ref],
					});
				}
				continue;
			}

			for (const action of actions.values()) {
				const functionName = semanticFunctionName(action.name, action.output.name, "action");
				const offending = viewCallsActionDirectly(declaration, action.name, functionName);
				if (!offending) continue;
				const path = `view.${declaration.name}`;
				const ref = semanticRefFor(moduleName, path);
				const outputType = formatOutputType(action.output.type);
				diagnostics.push({
					code: "missing-await",
					message: `Action ${action.name} must be awaited in view ${declaration.name}; use load data from action instead`,
					path: `${path}.render`,
					ref,
					severity: "error",
					span: offending.span ?? declaration.span ?? null,
					expected: `load data from action ${action.name}`,
					actual: `${action.name}(...)`,
					repair: `Replace the direct action call with:\n${loadDataRepairBlock(action.name, outputType)}`,
					relatedRefs: [semanticRefFor(moduleName, `action.${action.name}`), ref],
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
					expected: [...actions.keys()].sort(),
					actual: actionName,
					repair: `Declare action ${actionName} or fix the load data from action name.`,
					relatedRefs: [ref],
				});
				continue;
			}
			const functionName = semanticFunctionName(actionName, action.output.name, "action");
			const outputType = formatOutputType(action.output.type);
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
					repair: `Pass data to main render instead of calling ${actionName}() directly. Data type is ${outputType}.`,
					relatedRefs: [semanticRefFor(moduleName, `action.${actionName}`), ref],
				});
			}
		}
		if (declaration.kind === "page" && declaration.refreshEvery) {
			const path = `page.${declaration.name}`;
			const ref = semanticRefFor(moduleName, path);
			const { count } = declaration.refreshEvery;
			if (count < 1 || !Number.isFinite(count)) {
				diagnostics.push({
					code: "invalid-refresh-interval",
					message: `Page ${declaration.name} refresh interval must be a positive integer (1 or more)`,
					path,
					ref,
					severity: "error",
					span: declaration.span ?? null,
					repair: `Use for example: refresh every 30 seconds or refresh every 1 minutes`,
					relatedRefs: [ref],
				});
			}
			if (!declaration.loadData) {
				diagnostics.push({
					code: "refresh-without-load",
					message: `Page ${declaration.name} uses refresh every without load data from action or on mount call`,
					path,
					ref,
					severity: "error",
					span: declaration.span ?? null,
					repair: `Add load data from action <name> or on mount call <name> before refresh every.`,
					relatedRefs: [ref],
				});
			}
		}
	}
	return diagnostics;
}
