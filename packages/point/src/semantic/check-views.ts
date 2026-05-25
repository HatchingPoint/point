import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import { POINT_STYLE_MODIFIERS, isPointStyleModifier } from "../core/ui-style.ts";
import { resolveViewStreamSubscribeStatements } from "./view-stream-subscribe-resolve.ts";

export function checkSemanticViews(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const actionOutputTypes = new Map<string, string>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "action") {
			actionOutputTypes.set(declaration.name, formatTypeLabel(declaration.output.type));
		}
	}

	for (const declaration of program.declarations) {
		if (declaration.kind !== "view") continue;
		const paramTypes = new Map<string, string>();
		for (const input of declaration.inputs) {
			paramTypes.set(input.label, formatTypeLabel(input.type));
		}
		const loadStatement = declaration.body.find(
			(statement): statement is Extract<PointSemanticViewStatement, { kind: "loadData" | "onMountCall" }> =>
				statement.kind === "loadData" || statement.kind === "onMountCall",
		);
		const fetchStatement = declaration.body.find(
			(statement): statement is Extract<PointSemanticViewStatement, { kind: "loadFetch" }> =>
				statement.kind === "loadFetch",
		);
		const resolvedSubscribe = resolveViewStreamSubscribeStatements(declaration);
		const subscribeStatement =
			resolvedSubscribe.subscribeRoute ?? resolvedSubscribe.subscribePath ?? undefined;
		if (loadStatement) {
			const outputType = actionOutputTypes.get(loadStatement.action);
			if (outputType) paramTypes.set("data", outputType);
		}
		if (fetchStatement) {
			paramTypes.set("data", fetchStatement.itemType);
		}
		if (subscribeStatement) {
			const routeName = subscribeStatement.kind === "streamSubscribeRoute" ? subscribeStatement.routeName : undefined;
			const path = subscribeStatement.kind === "streamSubscribePath" ? subscribeStatement.path : undefined;
			const messageType = resolveStreamMessageType(program, routeName, path);
			if (messageType) paramTypes.set("messages", `List<${messageType}>`);
		}
		diagnostics.push(...checkViewDeclaration(moduleName, declaration, paramTypes));
	}

	return diagnostics;
}

function checkViewDeclaration(
	moduleName: string,
	declaration: PointSemanticViewDeclaration,
	paramTypes: Map<string, string>,
): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const bindStatements = collectBindStatements(declaration.body);

	for (const statement of bindStatements) {
		if (statement.target.kind !== "property" || statement.target.target.kind !== "name") {
			const suggestedTarget = suggestBindTarget(declaration, statement);
			diagnostics.push(
				viewDiagnostic(
					"invalid-view-bind-target",
					`View ${declaration.name} bind target must be input.field`,
					moduleName,
					declaration.name,
					suggestedTarget
						? `Use bind field "${statement.label}" to ${suggestedTarget}.`
						: `Use bind field "Label" to record.field or bind checkbox "Label" to record.field.`,
					statement.span,
					suggestedTarget ? { expected: suggestedTarget } : undefined,
				),
			);
		}
	}

	if (bindStatements.length > 0) {
		const hasHandler = declaration.inputs.some((input) => input.type.name === "Handler");
		const hasOnChange = declaration.body.some((statement) => statement.kind === "onChangeCall");
		if (!hasHandler && !hasOnChange) {
			diagnostics.push(
				viewDiagnostic(
					"missing-view-handler",
					`View ${declaration.name} form bindings require Handler input or on change call`,
					moduleName,
					declaration.name,
					`Add input on change: Handler RecordName or on change call on change.`,
					declaration.span,
				),
			);
		}
	}

	for (const statement of declaration.body) {
		if (statement.kind === "eachRender") {
			const iterableType = resolveExpressionType(statement.iterable, paramTypes);
			if (!iterableType.startsWith("List<")) {
				diagnostics.push(
					viewDiagnostic(
						"invalid-each-iterable",
						`View ${declaration.name} each ${statement.item} in ... requires a List input`,
						moduleName,
						declaration.name,
						`Pass a List input to each, e.g. each item in items render item.title.`,
						statement.span,
					),
				);
			}
			paramTypes.set(statement.item, iterableType.slice("List<".length, -1));
		}
		if (statement.kind === "table" || statement.kind === "datagrid") {
			const iterableType = resolveExpressionType(statement.iterable, paramTypes);
			if (!iterableType.startsWith("List<")) {
				diagnostics.push(
					viewDiagnostic(
						"invalid-table-iterable",
						`View ${declaration.name} table ${statement.item} in ... requires a List input`,
						moduleName,
						declaration.name,
						`Pass a List input to table, e.g. table item in data columns name, title.`,
						statement.span,
					),
				);
			}
			if (statement.linkColumn && !statement.columns.includes(statement.linkColumn)) {
				diagnostics.push(
					viewDiagnostic(
						"invalid-table-link-column",
						`View ${declaration.name} ${statement.kind} link column must appear in columns list`,
						moduleName,
						declaration.name,
						`Add ${statement.linkColumn} to the columns list.`,
						statement.span,
						{ expected: [...statement.columns, statement.linkColumn] },
					),
				);
			}
			if (statement.kind === "datagrid" && !statement.columns.includes(statement.sortBy)) {
				diagnostics.push(
					viewDiagnostic(
						"invalid-datagrid-sort-column",
						`View ${declaration.name} datagrid sort by column must appear in columns list`,
						moduleName,
						declaration.name,
						`Add ${statement.sortBy} to the columns list or fix sort by.`,
						statement.span,
						{ expected: statement.columns },
					),
				);
			}
			if (statement.kind === "datagrid" && statement.filterBy && !statement.columns.includes(statement.filterBy)) {
				diagnostics.push(
					viewDiagnostic(
						"invalid-datagrid-filter-column",
						`View ${declaration.name} datagrid filter by column must appear in columns list`,
						moduleName,
						declaration.name,
						`Add ${statement.filterBy} to the columns list or fix filter by.`,
						statement.span,
						{ expected: statement.columns },
					),
				);
			}
			paramTypes.set(statement.item, iterableType.startsWith("List<") ? iterableType.slice("List<".length, -1) : "Unknown");
		}
		if (statement.kind === "modal" && statement.when?.kind === "name") {
			const whenType = resolveExpressionType(statement.when, paramTypes);
			if (whenType !== "Unknown" && whenType !== "Bool") {
				diagnostics.push(
					viewDiagnostic(
						"invalid-modal-when",
						`View ${declaration.name} modal when condition must be Bool`,
						moduleName,
						declaration.name,
						`Use a boolean input in modal when, e.g. modal "Title" when show dialog render "..."`,
						statement.span,
					),
				);
			}
		}
		if (statement.kind === "tabs" && statement.tabs.length < 2) {
			diagnostics.push(
				viewDiagnostic(
					"invalid-view-tabs",
					`View ${declaration.name} tabs requires at least two tab lines`,
					moduleName,
					declaration.name,
					`Add tab "Label" render ... lines after tabs.`,
					statement.span,
				),
			);
		}
		diagnostics.push(...checkStatementStyleModifiers(moduleName, declaration.name, statement));
	}

	return diagnostics;
}

function checkStatementStyleModifiers(
	moduleName: string,
	viewName: string,
	statement: PointSemanticViewStatement,
): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const styleSources: Array<{ style?: string[]; span?: PointSourceSpan; label: string }> = [];
	if ("style" in statement && statement.style) {
		styleSources.push({ style: statement.style, span: statement.span, label: statement.kind });
	}
	if (statement.kind === "form" && statement.style) {
		styleSources.push({ style: statement.style, span: statement.span, label: "form" });
	}
	if (statement.kind === "tabs") {
		for (const tab of statement.tabs) {
			if (tab.style) styleSources.push({ style: tab.style, span: tab.span, label: `tab ${tab.label}` });
		}
	}
	for (const source of styleSources) {
		for (const modifier of source.style ?? []) {
			if (isPointStyleModifier(modifier)) continue;
			diagnostics.push(
				viewDiagnostic(
					"unknown-view-style",
					`View ${viewName} ${source.label} uses unknown style modifier "${modifier}"`,
					moduleName,
					viewName,
					`Use one of: ${POINT_STYLE_MODIFIERS.join(", ")}.`,
					source.span,
				),
			);
		}
	}
	return diagnostics;
}

function collectBindStatements(statements: PointSemanticViewStatement[]) {
	return statements.flatMap((statement) => {
		if (statement.kind === "bindCheckbox" || statement.kind === "bindField") return [statement];
		if (statement.kind === "form") {
			return statement.bindings.filter(
				(binding): binding is Extract<PointSemanticViewBindStatement, { kind: "bindField" | "bindCheckbox" }> =>
					binding.kind === "bindField" || binding.kind === "bindCheckbox",
			);
		}
		return [];
	});
}

function resolveExpressionType(expression: { kind: string; label?: string }, paramTypes: Map<string, string>): string {
	if (expression.kind === "name" && expression.label) {
		return paramTypes.get(expression.label) ?? "Unknown";
	}
	return "Unknown";
}

function formatTypeLabel(type: { name: string; args: Array<{ name: string; args: unknown[] }> }): string {
	if (type.name === "List" && type.args[0]) return `List<${formatTypeLabel(type.args[0] as { name: string; args: unknown[] })}>`;
	const listWithSpace = type.name.match(/^List\s+(.+)$/);
	if (listWithSpace) return `List<${listWithSpace[1]!.replaceAll(" ", "")}>`;
	if (type.name === "Maybe" && type.args[0]) return `Maybe<${formatTypeLabel(type.args[0] as { name: string; args: unknown[] })}>`;
	if (type.name === "Handler" && type.args[0]) return `Handler ${formatTypeLabel(type.args[0] as { name: string; args: unknown[] })}`;
	const primitives = new Set(["Text", "Int", "Float", "Bool", "Void", "Maybe", "Or", "Error", "Page", "Handler", "List"]);
	if (primitives.has(type.name)) return type.name;
	return type.name.replaceAll(" ", "");
}

function resolveStreamMessageType(program: PointSemanticProgram, routeName?: string, path?: string): string | undefined {
	for (const declaration of program.declarations) {
		if (declaration.kind !== "streamRoute") continue;
		if (routeName && declaration.name === routeName) return formatTypeLabel(declaration.messageType);
		if (path && declaration.path === path) return formatTypeLabel(declaration.messageType);
	}
	return undefined;
}

function suggestBindTarget(
	declaration: PointSemanticViewDeclaration,
	statement: Extract<PointSemanticViewStatement, { kind: "bindField" | "bindCheckbox" }>,
): string | undefined {
	const recordInput = declaration.inputs.find((input) => input.type.name !== "Handler");
	if (!recordInput) return undefined;
	return `${recordInput.label}.${statement.label.toLowerCase()}`;
}

function viewDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	viewName: string,
	repair: string,
	span?: PointSourceSpan,
	metadata?: Pick<PointCoreDiagnostic, "expected" | "actual" | "relatedRefs">,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `view.${viewName}`,
		ref: `point://semantic/${moduleName}/view.${viewName}`,
		severity: "error",
		span: span ?? null,
		repair,
		...metadata,
	};
}
