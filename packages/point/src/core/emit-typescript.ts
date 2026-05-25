import type {
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreFunctionDeclaration,
	PointCoreParameter,
	PointCorePrimitiveType,
	PointCoreProgram,
	PointCoreStatement,
	PointCoreTypeDeclaration,
	PointCoreTypeExpression,
	PointCoreValueDeclaration,
	PointSemanticPageLayout,
	PointSemanticLayoutSpec,
	PointSemanticViewFieldBinding,
	PointSemanticFormSubmitSpec,
	PointSemanticViewControls,
	PointSemanticViewNavigation,
	PointSemanticViewEachSpec,
	PointSemanticViewButtonSpec,
	PointSemanticViewTableSpec,
	PointSemanticViewChartSpec,
	PointSemanticViewModalSpec,
	PointSemanticViewTabsSpec,
	PointSemanticViewToggleTheme,
	PointSemanticDataLoad,
	PointSourceSpan,
} from "./ast.ts";
import type {
	PointSemanticMiddlewareDeclaration,
	PointSemanticNavigationDeclaration,
	PointSemanticPageDeclaration,
	PointSemanticRouteDeclaration,
	PointSemanticScheduleDeclaration,
	PointSemanticStreamRouteDeclaration,
} from "../semantic/ast.ts";
import { emitRouteServerRuntime, pathSegmentNames, toPathSegment } from "./emit-routes.ts";
import { emitScheduleRuntime, emitScheduleRunCommand, isScheduleRunCommand } from "./emit-schedules.ts";
import { emitClientNavigationRuntime, navigationPathParamInputs } from "./emit-navigation.ts";
import {
	emitDataLoadGuardLines,
	emitPointIsEmptyDataHelper,
	emitViewContentFromBody,
	emitViewRenderFragment,
	wrapBodyWithDataLoad,
} from "./emit-data-load.ts";
import { resolveViewWrapperClassName, findThemeDeclaration, themePresetClassNames, themeToggleEnabled } from "./ui-style.ts";
import { emitPointThemeModeHelpers, emitThemeShellOpen, emitThemeShellClose } from "./emit-theme-mode.ts";
import { wrapBodyWithStreamSubscribe } from "./emit-stream-subscribe.ts";
import { wrapBodyWithTerminalStreamSubscribe } from "./emit-terminal.ts";
import {
	emitPipelineStepEventTypes,
	emitPointPipelineHelpers,
	pipelineEventTypeName,
	pipelineLogParamName,
	programHasPipelines,
} from "./emit-pipeline.ts";
import {
	emitPointSessionHelpers,
	emitSessionRuntime,
	emitSessionStepEventTypes,
	programHasSessions,
} from "./emit-session.ts";
import { emitPointWorkflowHelpers, emitPointWorkflowTimedStepCall, programHasOrchestrationExtensions } from "./emit-workflow.ts";
import { emitPointGuardHelpers, programHasGuards, programUsesGuardChecks } from "./emit-guard.ts";
import { toIdentifier, toPascalCase } from "../semantic/naming.ts";
import { tagEmittedLine } from "./source-map.ts";

const BINARY_OPERATORS: Record<string, string> = {
	and: "&&",
	or: "||",
};

/** Emit TypeScript from a core AST program. Production path: parsePointSource → check → emit. */
export function emitPointCoreTypeScript(program: PointCoreProgram, sourcePath?: string): string {
	const routes = program.semanticSource?.declarations.filter((declaration): declaration is PointSemanticRouteDeclaration => declaration.kind === "route") ?? [];
	const streamRoutes =
		program.semanticSource?.declarations.filter((declaration): declaration is PointSemanticStreamRouteDeclaration => declaration.kind === "streamRoute") ?? [];
	const navigations =
		program.semanticSource?.declarations.filter((declaration): declaration is PointSemanticNavigationDeclaration => declaration.kind === "navigation") ?? [];
	const routeServeCommand = program.declarations.find((declaration) => declaration.kind === "function" && isRouteServeCommand(declaration));
	const schedules =
		program.semanticSource?.declarations.filter((declaration): declaration is PointSemanticScheduleDeclaration => declaration.kind === "schedule") ?? [];
	const scheduleRunCommand = program.declarations.find((declaration) => declaration.kind === "function" && isScheduleRunCommand(declaration));
	const actionFnByName = buildActionFnMap(program);
	const pages = buildPageMap(program.semanticSource?.declarations ?? []);
	const lines: string[] = [];
	const needsNavigationLinks = programHasNavigationLinks(program);
	const needsDataLoad = programHasDataLoad(program);
	const needsStreamSubscribe = programHasStreamSubscribe(program);
	const needsViewTabs = programHasViewTabs(program);
	const needsOrchestrationHelpers = programHasOrchestrationExtensions(program);
	const needsPipelineHelpers = programHasPipelines(program);
	const needsSessionHelpers = programHasSessions(program);
	const needsGuardHelpers = programUsesGuardChecks(program) || programHasGuards(program);
	const needsNavigationState = navigations.some((navigation) => navigationNeedsPageState(navigation, pages));
	const themeDeclaration = findThemeDeclaration(program.semanticSource?.declarations ?? []);
	const themeClassName = themeDeclaration ? themePresetClassNames(themeDeclaration) : "point-app";
	const themeToggle = themeToggleEnabled(themeDeclaration);
	const hasBootstrapNavigation = navigations.some((navigation) => navigation.bootstrapRouter);
	const themeLayoutShell = themeToggle && !hasBootstrapNavigation;
	const needsPointThemeToggle = program.declarations.some(
		(declaration) => declaration.kind === "function" && Boolean(declaration.semantic?.viewToggleTheme),
	);
	const needsFormSubmit = programHasFormSubmit(program);
	const needsAuthClient = programNeedsAuthClient(program);
	const needsFormNavigate = programNeedsFormNavigate(program);
	const needsViewButtons = programHasViewButtons(program);
	const needsViewButtonNavigate = programNeedsViewButtonNavigate(program);
	lines.push("// Generated by Point. Do not edit directly.");
	if (program.module) lines.push(`// Point module: ${program.module}`);
	if (needsDataLoad || needsStreamSubscribe || needsViewTabs || needsNavigationState || themeToggle || needsPointThemeToggle || needsFormSubmit || needsViewButtons) {
		lines.push('import * as React from "react";');
	}
	if (navigations.length > 0 || needsNavigationLinks || needsFormNavigate || needsViewButtonNavigate) {
		const routerImports = ["createBrowserRouter", "NavLink", "RouterProvider", "useParams"];
		if (needsFormNavigate || needsViewButtonNavigate) routerImports.push("useNavigate");
		lines.push(`import { ${routerImports.join(", ")} } from "react-router-dom";`);
	}
	if (needsDataLoad) {
		lines.push(...emitPointIsEmptyDataHelper());
	}
	if (needsAuthClient) {
		lines.push(...emitPointAuthClientHelpers());
	}
	if (needsViewTabs) {
		lines.push(...emitPointViewTabsHelper());
	}
	if (needsOrchestrationHelpers) {
		lines.push(...emitPointWorkflowHelpers(program));
	} else if (needsPipelineHelpers || needsGuardHelpers) {
		lines.push(
			"function pointIsError(value: unknown): value is { message: string } {",
			'  return typeof value === "object" && value !== null && "message" in value && typeof (value as { message?: unknown }).message === "string";',
			"}",
			"",
		);
	}
	if (needsGuardHelpers) {
		lines.push(...emitPointGuardHelpers(program));
	}
	if (needsPipelineHelpers) {
		lines.push(...emitPointPipelineHelpers());
		lines.push(...emitPipelineStepEventTypes(program));
	}
	if (needsSessionHelpers) {
		if (!needsPipelineHelpers) {
			lines.push(
				"function pointIsError(value: unknown): value is { message: string } {",
				'  return typeof value === "object" && value !== null && "message" in value && typeof (value as { message?: unknown }).message === "string";',
				"}",
				"",
			);
		}
		lines.push(...emitPointSessionHelpers());
		lines.push(...emitSessionStepEventTypes(program));
		lines.push(...emitSessionRuntime(program));
	}
	if (themeToggle || needsPointThemeToggle) {
		lines.push(...emitPointThemeModeHelpers());
	}
	lines.push("");
	for (const declaration of program.declarations) {
		if (declaration.kind === "function" && declaration.semantic?.kind === "command" && (routes.length > 0 || streamRoutes.length > 0) && isRouteServeCommand(declaration)) {
			lines.push(...emitRouteServeCommand(declaration), "");
			continue;
		}
		if (declaration.kind === "function" && declaration.semantic?.kind === "command" && schedules.length > 0 && isScheduleRunCommand(declaration)) {
			lines.push(...emitScheduleRunCommand(declaration), "");
			continue;
		}
		lines.push(...emitDeclaration(declaration, program, sourcePath, themeClassName, themeLayoutShell), "");
	}
	if (routes.length > 0 || streamRoutes.length > 0) {
		const middlewareByName = buildMiddlewareMap(program.semanticSource?.declarations ?? []);
		const records = buildRecordFieldMap(program.semanticSource?.declarations ?? []);
		lines.push(...emitRouteServerRuntime(routes, streamRoutes, middlewareByName, records, actionFnByName), "");
	}
	if (schedules.length > 0) {
		lines.push(...emitScheduleRuntime(schedules, actionFnByName), "");
	}
	if (navigations.length > 0 || needsNavigationLinks) {
		lines.push(
			"export function pointNavigationLink(label: string, to: string): JSX.Element {",
			'  return <NavLink to={to} className={({ isActive }) => isActive ? "point-link point-link-active" : "point-link"} end={to === "/"}>{label}</NavLink>;',
			"}",
			"",
		);
	}
	if (navigations.length > 0) {
		const records = buildRecordFieldMap(program.semanticSource?.declarations ?? []);
		for (const navigation of navigations) {
			lines.push(...emitClientNavigationRuntime(navigation, pages, records, themeClassName, themeToggle), "");
		}
	}
	return `${trimTrailingBlankLines(lines).join("\n")}\n`;
}

function emitDeclaration(
	declaration: PointCoreDeclaration,
	program: PointCoreProgram,
	sourcePath?: string,
	themeClassName = "point-app",
	themeLayoutShell = false,
): string[] {
	if (declaration.kind === "import") {
		return [`import { ${declaration.names.join(", ")} } from ${JSON.stringify(declaration.from)};`];
	}
	if (declaration.kind === "external") {
		const imported = declaration.importName ? `${declaration.importName} as ${declaration.name}` : declaration.name;
		return [`import { ${imported} } from ${JSON.stringify(declaration.from)};`];
	}
	if (declaration.kind === "type") return emitType(declaration);
	if (declaration.kind === "value") return [emitValue(declaration, true)];
	return emitFunction(declaration, program, sourcePath, themeClassName, themeLayoutShell);
}

function emitType(declaration: PointCoreTypeDeclaration): string[] {
	if (declaration.variantCases) {
		const members = declaration.variantCases.map((variantCase) => {
			const payload = variantCase.fields.map((field) => `${field.name}: ${emitTypeExpression(field.type)}`).join("; ");
			return payload.length > 0
				? `{ kind: ${JSON.stringify(variantCase.name)}; ${payload} }`
				: `{ kind: ${JSON.stringify(variantCase.name)} }`;
		});
		return [`export type ${declaration.name} = ${members.join(" | ")};`];
	}
	return [
		`export interface ${declaration.name} {`,
		...declaration.fields.map((field) => `  ${field.name}: ${emitTypeExpression(field.type)};`),
		"}",
	];
}

function emitFunction(
	declaration: PointCoreFunctionDeclaration,
	program: PointCoreProgram,
	sourcePath?: string,
	themeClassName = "point-app",
	themeLayoutShell = false,
): string[] {
	const isStreamAction = declaration.semantic?.isStreamAction === true;
	const asyncPrefix = isStreamAction
		? "async function* "
		: declaration.semantic?.kind === "action" ||
				declaration.semantic?.kind === "workflow" ||
				declaration.semantic?.kind === "pipeline" ||
				declaration.semantic?.kind === "command" ||
				declaration.semantic?.kind === "route"
			? "async "
			: "";
	const returnType = isStreamAction
		? `AsyncGenerator<${emitTypeExpression(declaration.returnType)}>`
		: declaration.semantic?.kind === "action" ||
				declaration.semantic?.kind === "workflow" ||
				declaration.semantic?.kind === "pipeline" ||
				declaration.semantic?.kind === "command"
			? `Promise<${emitTypeExpression(declaration.returnType)}>`
			: declaration.semantic?.kind === "view" || declaration.semantic?.kind === "page" || declaration.semantic?.kind === "layout"
				? "JSX.Element"
				: declaration.semantic?.kind === "route"
					? "Promise<Response | string>"
				: emitTypeExpression(declaration.returnType);
	const viewControls = declaration.semantic?.viewControls;
	const viewNavigation = declaration.semantic?.viewNavigation;
	const viewEach = declaration.semantic?.viewEach;
	const viewButtons = declaration.semantic?.viewButtons;
	const viewTable = declaration.semantic?.viewTable;
	const viewChart = declaration.semantic?.viewChart;
	const viewModal = declaration.semantic?.viewModal;
	const viewTabs = declaration.semantic?.viewTabs;
	const viewToggleTheme = declaration.semantic?.viewToggleTheme;
	const viewDataLoad = declaration.semantic?.viewDataLoad;
	const pageDataLoad = declaration.semantic?.pageDataLoad;
	const viewStreamSubscribe = declaration.semantic?.viewStreamSubscribe;
	const pageStreamSubscribe = declaration.semantic?.pageStreamSubscribe;
	const layoutSpec = declaration.semantic?.layoutSpec;
	const dataLoad = viewDataLoad ?? pageDataLoad;
	const streamSubscribe = viewStreamSubscribe ?? pageStreamSubscribe;
	const viewHasExtras = Boolean(
		viewControls || viewNavigation || viewEach?.length || viewButtons?.length || viewTable || viewChart || viewModal || viewTabs || viewToggleTheme,
	);
	let bodyLines =
		declaration.semantic?.kind === "layout" && layoutSpec
			? emitLayoutBody(declaration.name, layoutSpec, themeClassName, themeLayoutShell)
			: declaration.semantic?.kind === "page" && declaration.semantic.pageLayout
			? emitPageBody(declaration.semantic.pageLayout)
			: declaration.semantic?.kind === "view" && viewHasExtras
				? emitViewWithExtrasBody(declaration.body, {
						controls: viewControls,
						navigation: viewNavigation,
						each: viewEach,
						buttons: viewButtons,
						table: viewTable,
						chart: viewChart,
						modal: viewModal,
						tabs: viewTabs,
						toggleTheme: viewToggleTheme,
					})
				: declaration.semantic?.kind === "view" && (viewDataLoad || viewStreamSubscribe)
					? emitViewDataLoadBody(declaration.body)
					: declaration.semantic?.kind === "view" &&
						  declaration.body.filter((statement) => statement.kind === "return").length > 1 &&
						  !declaration.body.some(
								(statement) =>
									statement.kind === "if" &&
									statement.thenBody.some((thenStatement) => thenStatement.kind === "return" && thenStatement.value),
						  )
						? [`return (`, `  <>`, `    ${emitViewContentFromBody(declaration.body)}`, `  </>`, `);`]
						: declaration.body.flatMap((statement) => emitStatement(statement, declaration.semantic?.kind));
	if (dataLoad) {
		bodyLines = wrapBodyWithDataLoad(bodyLines, dataLoad, declaration.params.map((param) => param.name));
	}
	if (streamSubscribe?.terminal) {
		bodyLines = wrapBodyWithTerminalStreamSubscribe(streamSubscribe, declaration.params.map((param) => param.name));
	} else if (streamSubscribe) {
		bodyLines = wrapBodyWithStreamSubscribe(bodyLines, streamSubscribe, declaration.params.map((param) => param.name));
	}
	if (viewControls?.submit) {
		bodyLines = [...emitFormSubmitPreamble(viewControls), ...bodyLines];
	} else if (viewButtons?.some((button) => button.navigateTo)) {
		bodyLines = ["const navigate = useNavigate();", ...bodyLines];
	}
	if (viewTable?.sortBy) {
		bodyLines = [
			`const [sortColumn, setSortColumn] = React.useState(${JSON.stringify(viewTable.sortBy)});`,
			'const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");',
			...bodyLines,
		];
	}
	return [
		...(declaration.semantic?.kind === "layout" && layoutSpec ? emitLayoutType(layoutSpec) : []),
		`export ${isStreamAction ? "async function* " : asyncPrefix ? "async function " : "function "}${declaration.name}(${emitFunctionParams(declaration)}): ${returnType} {`,
		...indentLines(bodyLines),
		"}",
	];
}

function emitFunctionParams(declaration: PointCoreFunctionDeclaration): string {
	if (declaration.semantic?.kind === "layout" && declaration.semantic.layoutSpec) {
		return `slots: ${toPascalCase(declaration.semantic.layoutSpec.name)}LayoutSlots = {}`;
	}
	if (declaration.semantic?.kind === "pipeline") {
		const logParam = pipelineLogParamName();
		const regular = declaration.params.filter((param) => param.name !== logParam);
		const eventType = pipelineEventTypeName(declaration.semantic.name);
		return [...regular.map(emitParam), `${logParam}?: PointPipelineLog<${eventType}> | null`].join(", ");
	}
	return declaration.params.map(emitParam).join(", ");
}

function emitLayoutType(spec: PointSemanticLayoutSpec): string[] {
	const fields = ["header", "sidebar", "main", "footer"].map((slot) => `${toIdentifier(slot)}?: JSX.Element`).join("; ");
	return [`export type ${toPascalCase(spec.name)}LayoutSlots = { ${fields} };`, ""];
}

function emitLayoutBody(functionName: string, spec: PointSemanticLayoutSpec, themeClassName: string, themeLayoutShell: boolean): string[] {
	const slotSet = new Set(spec.slots.map((slot) => slot.name));
	const defaultFor = (slotName: string): string => {
		const slot = spec.slots.find((candidate) => candidate.name === slotName);
		return slot ? emitViewRenderFragment(slot.content, undefined, slot.style) : "<></>";
	};
	const rootClassName = `${themeClassName} point-layout point-layout-${toIdentifier(spec.name)}`;
	const lines = ["return (", emitThemeShellOpen(rootClassName, themeLayoutShell)];
	if (slotSet.has("header")) {
		lines.push(`    <header className="point-layout-header">{slots.header ?? ${defaultFor("header")}}</header>`);
	}
	if (slotSet.has("sidebar") || slotSet.has("main")) {
		lines.push(`    <div className="point-layout-body">`);
		if (slotSet.has("sidebar")) {
			lines.push(`      <aside className="point-layout-sidebar">{slots.sidebar ?? ${defaultFor("sidebar")}}</aside>`);
		}
		if (slotSet.has("main")) {
			lines.push(`      <section className="point-layout-main">{slots.main ?? ${defaultFor("main")}}</section>`);
		}
		lines.push(`    </div>`);
	}
	if (slotSet.has("footer")) {
		lines.push(`    <footer className="point-layout-footer">{slots.footer ?? ${defaultFor("footer")}}</footer>`);
	}
	lines.push(emitThemeShellClose(), ");");
	return lines;
}

function emitViewDataLoadBody(body: PointCoreStatement[]): string[] {
	if (body.some((statement) => statement.kind === "if")) {
		return body.flatMap((statement) => emitStatement(statement, "view"));
	}
	const content = emitViewContentFromBody(body);
	return [`return (`, `  <>`, `    {${content}}`, `  </>`, `);`];
}

interface ViewExtrasSpec {
	controls?: PointSemanticViewControls;
	navigation?: PointSemanticViewNavigation;
	each?: PointSemanticViewEachSpec[];
	buttons?: PointSemanticViewButtonSpec[];
	table?: PointSemanticViewTableSpec;
	chart?: PointSemanticViewChartSpec;
	modal?: PointSemanticViewModalSpec;
	tabs?: PointSemanticViewTabsSpec;
	toggleTheme?: PointSemanticViewToggleTheme;
}

function emitViewWithExtrasBody(body: PointCoreStatement[], extras: ViewExtrasSpec): string[] {
	const linkLines = extras.navigation?.links.map((link) => `{pointNavigationLink(${JSON.stringify(link.label)}, ${JSON.stringify(link.path)})}`) ?? [];
	const navLine =
		linkLines.length > 0
			? [`<nav className="point-nav" aria-label="Primary">${linkLines.join("")}</nav>`]
			: [];
	const formLines = extras.controls ? [emitFormControls(extras.controls)] : [];
	const eachLines = extras.each?.map((spec) => emitEachList(spec)) ?? [];
	const buttonLines = extras.buttons?.map((spec) => emitViewButton(spec)) ?? [];
	const tableLine = extras.table ? [emitViewTable(extras.table)] : [];
	const chartLine = extras.chart ? [emitViewChart(extras.chart)] : [];
	const tabsLine = extras.tabs ? [emitViewTabs(extras.tabs)] : [];
	const modalLine = extras.modal ? [emitModal(extras.modal)] : [];
	const toggleLine = extras.toggleTheme ? [emitThemeToggle(extras.toggleTheme)] : [];
	const contentJsx = emitViewContentExpression(body);
	const children = [...navLine, ...toggleLine, ...buttonLines, ...formLines, ...tableLine, ...chartLine, ...eachLines, ...tabsLine, ...modalLine, contentJsx];
	if (children.length === 1) {
		return [`return (`, `  <>`, `    ${children[0]}`, `  </>`, `);`];
	}
	return ["return (", "  <>", ...indentLines(children.map((child) => child)), "  </>", ");"];
}

function emitThemeToggle(spec: PointSemanticViewToggleTheme): string {
	const styleArg = spec.style?.length ? `[${spec.style.map((modifier) => JSON.stringify(modifier)).join(", ")}]` : "undefined";
	return `{pointThemeToggle(${styleArg})}`;
}

function emitViewButton(spec: PointSemanticViewButtonSpec): string {
	const styleArg = spec.style?.length ? ` point-style-${spec.style.join(" point-style-")}` : "";
	const actions: string[] = [];
	if (spec.clearAuth) actions.push("pointAuthClearToken()");
	if (spec.navigateTo) actions.push(`navigate(${JSON.stringify(spec.navigateTo)})`);
	const onClick = actions.length > 0 ? ` onClick={() => { ${actions.join("; ")}; }}` : "";
	return `<button type="button" className="point-button point-view-button${styleArg}"${onClick}>${escapeJsxText(spec.label)}</button>`;
}

function emitViewTable(spec: PointSemanticViewTableSpec): string {
	const item = spec.itemIdentifier;
	const tableClassName = resolveViewWrapperClassName(undefined, spec.style);
	const className = tableClassName
		? spec.sortBy
			? `point-table point-datagrid ${tableClassName}`
			: `point-table ${tableClassName}`
		: spec.sortBy
			? "point-table point-datagrid"
			: "point-table";
	const headers = spec.columns
		.map((column) => {
			if (spec.sortBy) {
				return `<th scope="col"><button type="button" className="point-datagrid-sort" onClick={() => { if (sortColumn === ${JSON.stringify(column)}) setSortDirection(sortDirection === "asc" ? "desc" : "asc"); else { setSortColumn(${JSON.stringify(column)}); setSortDirection("asc"); } }}>${escapeJsxText(column.charAt(0).toUpperCase() + column.slice(1))}</button></th>`;
			}
			return `<th scope="col">${escapeJsxText(column.charAt(0).toUpperCase() + column.slice(1))}</th>`;
		})
		.join("");
	const rowCells = spec.columns
		.map((column) => {
			const valueExpr = `${item}.${column}`;
			if (spec.linkColumn === column && spec.linkPath) {
				return `<td>{pointNavigationLink(String(${valueExpr}), String(${emitExpression(spec.linkPath)}))}</td>`;
			}
			return `<td>{String(${valueExpr})}</td>`;
		})
		.join("");
	const iterableExpr = spec.sortBy
		? `[...(${emitExpression(spec.iterable)} ?? [])].sort((left, right) => { const a = String(left[sortColumn] ?? ""); const b = String(right[sortColumn] ?? ""); const cmp = a.localeCompare(b); return sortDirection === "asc" ? cmp : -cmp; })`
		: `(${emitExpression(spec.iterable)} ?? [])`;
	return `<table className="${escapeJsxAttribute(className)}"><thead><tr>${headers}</tr></thead><tbody>{${iterableExpr}.map((${item}, index) => (<tr key={String(index)}>${rowCells}</tr>))}</tbody></table>`;
}

function emitViewChart(spec: PointSemanticViewChartSpec): string {
	const chartClassName = resolveViewWrapperClassName(undefined, spec.style);
	const className = chartClassName ? `point-chart point-chart-bar ${chartClassName}` : "point-chart point-chart-bar";
	const dataExpr = emitExpression(spec.iterable);
	const labelField = spec.labelField;
	const valueField = spec.valueField;
	return `<div className="${escapeJsxAttribute(className)}" role="img" aria-label="Bar chart">{(${dataExpr} ?? []).map((row, index) => { const value = Number(row.${valueField} ?? 0); const height = Math.max(4, Math.min(100, value)); return (<div key={String(index)} className="point-chart-bar-item"><div className="point-chart-bar-value" style={{ height: \`\${height}%\` }} title={String(row.${labelField})} /><span className="point-chart-bar-label">{String(row.${labelField})}</span></div>); })}</div>`;
}

function emitFormControls(controls: PointSemanticViewControls): string {
	const fields = controls.fields.map((binding) => emitFormField(binding, controls.changeCallback)).join("");
	const styleClasses = resolveViewWrapperClassName(undefined, controls.style);
	const formClassName = styleClasses ? `point-form ${styleClasses}` : "point-form";
	const submitButton = controls.submit
		? `<button type="submit" className="point-button point-form-submit" disabled={submitting}>{submitting ? "Submitting..." : ${JSON.stringify(controls.submit.label)}}</button>`
		: "";
	const errorBlock = controls.submit ? `{submitError ? <p className="point-form-error" role="alert">{submitError}</p> : null}` : "";
	const toastBlock =
		controls.successToast || controls.errorToast
			? `{toast ? <p className={\`point-toast \${toastKind === "success" ? "point-toast-success" : "point-toast-error"}\`} role="status">{toast}</p> : null}`
			: "";
	const onSubmit = controls.submit ? emitFormSubmitHandler(controls) : "(event) => event.preventDefault()";
	return `<form className="${escapeJsxAttribute(formClassName)}" onSubmit={${onSubmit}}>${fields}${errorBlock}${submitButton}${toastBlock}</form>`;
}

function emitFormSubmitPreamble(controls: PointSemanticViewControls): string[] {
	const submit = controls.submit;
	if (!submit) return [];
	const lines = [
		"const [submitting, setSubmitting] = React.useState(false);",
		"const [submitError, setSubmitError] = React.useState<string | null>(null);",
	];
	if (controls.successToast || controls.errorToast) {
		lines.push('const [toast, setToast] = React.useState<string | null>(null);');
		lines.push('const [toastKind, setToastKind] = React.useState<"success" | "error">("success");');
	}
	if (submit.navigateTo) {
		lines.push("const navigate = useNavigate();");
	}
	return lines;
}

function emitFormSubmitHandler(controls: PointSemanticViewControls): string {
	const submit = controls.submit!;
	const bodyParam = submit.bodyParam;
	const url = JSON.stringify(submit.url);
	const authHeader = submit.withAuth
		? `{ ...(pointAuthGetToken() ? { authorization: \`Bearer \${pointAuthGetToken()}\` } : {}) }`
		: "{}";
	const saveToken = submit.saveTokenField
		? `pointAuthSetToken(String((body as Record<string, unknown>).${submit.saveTokenField} ?? ""));`
		: "";
	const navigate = submit.navigateTo ? `navigate(${JSON.stringify(submit.navigateTo)});` : "";
	const successToast = controls.successToast ? JSON.stringify(controls.successToast) : "";
	const errorToast = controls.errorToast ? JSON.stringify(controls.errorToast) : "";
	const toastSuccess = successToast ? `setToastKind("success"); setToast(${successToast});` : "";
	const toastFailure = errorToast
		? `setToastKind("error"); setToast(${errorToast});`
		: 'setToastKind("error"); setToast(err instanceof Error ? err.message : "Submit failed");';
	return `async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    ${controls.successToast || controls.errorToast ? "setToast(null);" : ""}
    try {
      const response = await fetch(${url}, {
        method: "POST",
        headers: { "content-type": "application/json", ...${authHeader} },
        body: JSON.stringify(${bodyParam}),
      });
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
      const body = await response.json();
      ${saveToken}
      ${toastSuccess}
      ${navigate}
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
      ${toastFailure}
    } finally {
      setSubmitting(false);
    }
  }`;
}

function emitPointAuthClientHelpers(): string[] {
	return [
		'const POINT_AUTH_TOKEN_KEY = "point.auth.token";',
		"function pointAuthGetToken(): string {",
		'  if (typeof window === "undefined") return "";',
		"  return window.localStorage.getItem(POINT_AUTH_TOKEN_KEY) ?? \"\";",
		"}",
		"function pointAuthSetToken(token: string): void {",
		"  window.localStorage.setItem(POINT_AUTH_TOKEN_KEY, token);",
		"}",
		"function pointAuthClearToken(): void {",
		"  window.localStorage.removeItem(POINT_AUTH_TOKEN_KEY);",
		"}",
		"",
	];
}

function emitFormField(binding: PointSemanticViewFieldBinding, changeCallback: string): string {
	const value = emitExpression(binding.target);
	const label = escapeJsxText(binding.label);
	if (binding.inputKind === "checkbox") {
		return `<label className="point-form-field"><input type="checkbox" checked={${value}} onChange={(event) => ${changeCallback}({ ...${binding.recordParam}, ${binding.fieldName}: event.target.checked })} aria-label="${escapeJsxAttribute(binding.label)}" />${label}</label>`;
	}
	if (binding.inputKind === "textarea") {
		return `<label className="point-form-field"><span>${label}</span><textarea className="point-textarea" value={${value}} onChange={(event) => ${changeCallback}({ ...${binding.recordParam}, ${binding.fieldName}: event.target.value })} /></label>`;
	}
	if (binding.inputKind === "select" && binding.options) {
		const optionsExpr = emitExpression(binding.options);
		return `<label className="point-form-field"><span>${label}</span><select className="point-select" value={${value}} onChange={(event) => ${changeCallback}({ ...${binding.recordParam}, ${binding.fieldName}: event.target.value })}>{(${optionsExpr} ?? []).map((option, index) => (<option key={String(index)} value={String(option)}>{String(option)}</option>))}</select></label>`;
	}
	return `<label className="point-form-field"><span>${label}</span><input type="text" value={${value}} onChange={(event) => ${changeCallback}({ ...${binding.recordParam}, ${binding.fieldName}: event.target.value })} /></label>`;
}

function emitEachList(spec: PointSemanticViewEachSpec): string {
	const item = spec.itemIdentifier;
	const itemContent = emitEachItemContent(spec);
	const itemClassName = resolveViewWrapperClassName(spec.className, spec.style);
	const classAttr = itemClassName ? ` className="${escapeJsxAttribute(itemClassName)}"` : "";
	return `<ul className="point-list" role="list">{(${emitExpression(spec.iterable)} ?? []).map((${item}, index) => (<li key={String(index)}${classAttr} role="listitem">${itemContent}</li>))}</ul>`;
}

function emitEachItemContent(spec: PointSemanticViewEachSpec): string {
	if (spec.linkPath) {
		return `{pointNavigationLink(String(${emitExpression(spec.render)}), String(${emitExpression(spec.linkPath)}))}`;
	}
	if (spec.className || spec.style?.length) {
		return emitViewRenderFragment(spec.render, spec.className, spec.style);
	}
	if (spec.render.kind === "literal" && typeof spec.render.value === "string") {
		return escapeJsxText(spec.render.value);
	}
	return `{${emitExpression(spec.render)}}`;
}

function emitViewTabs(spec: PointSemanticViewTabsSpec): string {
	const entries = spec.tabs
		.map((tab) => `{ label: ${JSON.stringify(tab.label)}, content: ${emitViewRenderFragment(tab.content, tab.className, tab.style)} }`)
		.join(", ");
	return `{pointViewTabs([${entries}])}`;
}

function emitModal(spec: PointSemanticViewModalSpec): string {
	const titleId = `point-modal-${toIdentifier(spec.title)}`;
	const body = emitViewRenderFragment(spec.content, spec.className, spec.style);
	const dialog = `<div className="point-modal-overlay" role="presentation"><div className="point-modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}"><h2 id="${titleId}">${escapeJsxText(spec.title)}</h2><div className="point-modal-body">${body}</div></div></div>`;
	if (!spec.when) return dialog;
	return `{${emitCondition(spec.when)} ? (${dialog}) : null}`;
}

function emitPointViewTabsHelper(): string[] {
	return [
		"export function pointViewTabs(tabs: Array<{ label: string; content: JSX.Element }>): JSX.Element {",
		"  const [activeIndex, setActiveIndex] = React.useState(0);",
		"  const active = tabs[activeIndex] ?? tabs[0];",
		"  return (",
		'    <div className="point-tabs">',
		'      <div className="point-tabs-list" role="tablist" aria-label="Tabs">',
		"        {tabs.map((tab, index) => (",
		'          <button',
		'            key={tab.label}',
		'            type="button"',
		'            role="tab"',
		"            aria-selected={index === activeIndex}",
		'            aria-controls={`point-tabpanel-${index}`}',
		'            id={`point-tab-${index}`}',
		'            className={index === activeIndex ? "point-tab point-tab-active" : "point-tab"}',
		"            onClick={() => setActiveIndex(index)}",
		"          >",
		"            {tab.label}",
		"          </button>",
		"        ))}",
		"      </div>",
		"      {active ? (",
		'        <div className="point-tabpanel" role="tabpanel" id={`point-tabpanel-${activeIndex}`} aria-labelledby={`point-tab-${activeIndex}`}>',
		"          {active.content}",
		"        </div>",
		"      ) : null}",
		"    </div>",
		"  );",
		"}",
		"",
	];
}

function emitViewContentExpression(body: PointCoreStatement[]): string {
	return `{${emitViewContentFromBody(body)}}`;
}

function emitPageBody(layout: PointSemanticPageLayout): string[] {
	const title = emitJsxChild(layout.title);
	const descriptionBlock = layout.description
		? `\n        <p className="point-page-description">${emitJsxChild(layout.description)}</p>`
		: "";
	const standaloneDescriptionBlock = layout.description
		? `\n      <p className="point-page-description">${emitJsxChild(layout.description)}</p>`
		: "";
	const main = emitJsxChild(layout.main, true);
	const mainStyleClasses = resolveViewWrapperClassName(layout.mainClassName, layout.mainStyle);
	const mainClassName = mainStyleClasses ? `point-page-main ${mainStyleClasses}` : "point-page-main";
	const pageContent = [
		`      <>`,
		`        <header className="point-page-header">`,
		`          <h1>${title}</h1>${descriptionBlock}`,
		`        </header>`,
		`        <section className="${escapeJsxAttribute(mainClassName)}">${main}</section>`,
		`      </>`,
	];
	if (layout.layoutFunction) {
		return [`return ${layout.layoutFunction}({`, `  main: (`, ...pageContent, `  ),`, `});`];
	}
	return [
		`return (`,
		`  <main className="point-page">`,
		`    <header className="point-page-header">`,
		`      <h1>${title}</h1>${standaloneDescriptionBlock}`,
		`    </header>`,
		`    <section className="${escapeJsxAttribute(mainClassName)}">${main}</section>`,
		`  </main>`,
		`);`,
	];
}

function emitJsxChild(expression: PointCoreExpression, allowComponent = false): string {
	if (expression.kind === "literal" && typeof expression.value === "string") {
		return escapeJsxText(expression.value);
	}
	if (allowComponent) {
		return `{${emitExpression(expression)}}`;
	}
	return `{${emitExpression(expression)}}`;
}

function emitStatement(statement: PointCoreStatement, semanticKind?: string): string[] {
	if (statement.kind === "yield") {
		return [statement.value ? `yield* ${emitExpression(statement.value)};` : "yield;"];
	}
	if (statement.kind === "return") {
		if (semanticKind === "view" && statement.value) {
			return [tagEmittedLine(`return ${emitViewRenderFragment(statement.value, statement.className, statement.style)};`, statementSpan(statement))];
		}
		return [statement.value ? `return ${emitExpression(statement.value)};` : "return;"];
	}
	if (statement.kind === "value") return [emitValue(statement, false)];
	if (statement.kind === "assignment") return [`${statement.name} ${statement.operator} ${emitExpression(statement.value)};`];
	if (statement.kind === "if") {
		const openLine = `if (${emitCondition(statement.condition)}) {`;
		const lines = [
			semanticKind === "view" ? tagEmittedLine(openLine, statement.span) : openLine,
			...indentLines(statement.thenBody.flatMap((child) => emitStatement(child, semanticKind))),
			"}",
		];
		if (statement.elseBody.length > 0) {
			lines.push(
				"else {",
				...indentLines(statement.elseBody.flatMap((child) => emitStatement(child, semanticKind))),
				"}",
			);
		}
		return lines;
	}
	if (statement.kind === "for") {
		return [
			`for (const ${statement.itemName} of ${emitExpression(statement.iterable)}) {`,
			...indentLines(statement.body.flatMap((child) => emitStatement(child, semanticKind))),
			"}",
		];
	}
	return [`${emitExpression(statement.value)};`];
}

function statementSpan(statement: PointCoreStatement): PointSourceSpan | undefined {
	if (statement.kind === "return") return statement.span ?? statement.value?.span;
	if (statement.kind === "expression") return statement.span ?? statement.value.span;
	return statement.span;
}

function escapeJsxText(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeJsxAttribute(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}

function emitValue(declaration: PointCoreValueDeclaration, exported: boolean): string {
	const prefix = exported ? "export " : "";
	const keyword = declaration.mutable ? "let" : "const";
	return `${prefix}${keyword} ${declaration.name}: ${emitTypeExpression(declaration.type)} = ${emitExpression(declaration.value)};`;
}

function emitParam(param: PointCoreParameter): string {
	return `${param.name}: ${emitParamType(param.type)}`;
}

function emitParamType(type: PointCoreTypeExpression): string {
	if (type.name === "Handler" && type.args.length === 1) {
		return `(value: ${emitTypeExpression(type.args[0]!)}) => void`;
	}
	return emitTypeExpression(type);
}

function emitTypeExpression(type: PointCoreTypeExpression): string {
	if (type.name === "Handler" && type.args.length === 1) {
		return `(value: ${emitTypeExpression(type.args[0]!)}) => void`;
	}
	if (type.name === "List") return `Array<${type.args[0] ? emitTypeExpression(type.args[0]) : "unknown"}>`;
	if (type.name === "Maybe") return `${type.args[0] ? emitTypeExpression(type.args[0]) : "unknown"} | null`;
	if (type.name === "Or") return type.args.map(emitTypeExpression).join(" | ");
	if (type.name === "Error") return "{ message: string }";
	if (type.name === "Instant") return "string";
	if (type.name === "Duration") return "number";
	if (isPrimitiveType(type.name)) return emitPrimitiveType(type.name);
	return type.name;
}

function emitPrimitiveType(type: PointCorePrimitiveType): string {
	if (type === "Text") return "string";
	if (type === "Int" || type === "Float") return "number";
	if (type === "Bool") return "boolean";
	return "void";
}

function emitExpression(expression: PointCoreExpression): string {
	if (expression.kind === "literal") return JSON.stringify(expression.value);
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "list") return `[${expression.items.map(emitExpression).join(", ")}]`;
	if (expression.kind === "record") {
		return `{ ${expression.fields.map((field) => `${field.name}: ${emitExpression(field.value)}`).join(", ")} }`;
	}
	if (expression.kind === "variant") {
		const payload = expression.fields.map((field) => `${field.name}: ${emitExpression(field.value)}`).join(", ");
		return payload.length > 0
			? `{ kind: ${JSON.stringify(expression.caseName)}, ${payload} }`
			: `{ kind: ${JSON.stringify(expression.caseName)} }`;
	}
	if (expression.kind === "await") return `await ${emitExpression(expression.value)}`;
	if (expression.kind === "property") return `${emitExpression(expression.target)}.${expression.name}`;
	if (expression.kind === "call") {
		if (expression.callee === "pointMapLookup") {
		const mapExpr = expression.args[0] ? emitExpression(expression.args[0]) : "{}";
		const keyExpr = expression.args[1] ? emitExpression(expression.args[1]) : '""';
		return `(${mapExpr}[String(${keyExpr})])`;
	}
	if (expression.callee === "pointMapLiteral") {
		const pairs: string[] = [];
		for (let index = 0; index < expression.args.length; index += 2) {
			const keyArg = expression.args[index];
			const valueArg = expression.args[index + 1];
			const key = keyArg?.kind === "literal" && typeof keyArg.value === "string" ? JSON.stringify(keyArg.value) : '""';
			pairs.push(`${key}: ${valueArg ? emitExpression(valueArg) : "undefined"}`);
		}
		return `{ ${pairs.join(", ")} }`;
	}
	if (expression.callee === "Error") return `{ message: ${expression.args[0] ? emitExpression(expression.args[0]) : JSON.stringify("")} }`;
		if (expression.callee === "pointWorkflowTimedStep") return emitPointWorkflowTimedStepCall(expression);
		return `${expression.callee}(${expression.args.map(emitExpression).join(", ")})`;
	}
	const operator = BINARY_OPERATORS[expression.operator] ?? expression.operator;
	return `(${emitExpression(expression.left)} ${operator} ${emitExpression(expression.right)})`;
}

function emitCondition(expression: PointCoreExpression): string {
	const emitted = emitExpression(expression);
	return emitted.startsWith("(") && emitted.endsWith(")") ? emitted.slice(1, -1) : emitted;
}

function isPrimitiveType(type: string): type is PointCorePrimitiveType {
	return type === "Text" || type === "Int" || type === "Float" || type === "Bool" || type === "Void";
}

function indentLines(lines: string[]): string[] {
	return lines.map((line) => `  ${line}`);
}

function trimTrailingBlankLines(lines: string[]): string[] {
	while (lines.at(-1) === "") lines.pop();
	return lines;
}

function isRouteServeCommand(declaration: PointCoreFunctionDeclaration): boolean {
	const name = declaration.semantic?.name ?? "";
	return name.toLowerCase().startsWith("serve ");
}

function buildActionFnMap(program: PointCoreProgram): Map<string, string> {
	const actionFnByName = new Map<string, string>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "function" && declaration.semantic?.kind === "action") {
			actionFnByName.set(declaration.semantic.name, declaration.name);
		}
	}
	return actionFnByName;
}

function buildMiddlewareMap(
	declarations: Array<{ kind: string; name?: string } & Partial<PointSemanticMiddlewareDeclaration>>,
): Map<string, PointSemanticMiddlewareDeclaration> {
	const middlewareByName = new Map<string, PointSemanticMiddlewareDeclaration>();
	for (const declaration of declarations) {
		if (declaration.kind === "middleware" && declaration.name) {
			middlewareByName.set(declaration.name, declaration as PointSemanticMiddlewareDeclaration);
		}
	}
	return middlewareByName;
}

function buildRecordFieldMap(
	declarations: Array<{ kind: string; name?: string; fields?: Array<{ label: string }> }>,
): Map<string, Map<string, string>> {
	const records = new Map<string, Map<string, string>>();
	for (const declaration of declarations) {
		if (declaration.kind !== "record" || !declaration.name || !declaration.fields) continue;
		const fields = new Map<string, string>();
		for (const field of declaration.fields) {
			fields.set(field.label, toIdentifier(field.label));
		}
		records.set(toPascalCase(declaration.name), fields);
	}
	return records;
}

function buildPageMap(declarations: Array<{ kind: string; name?: string } & Partial<PointSemanticPageDeclaration>>): Map<string, PointSemanticPageDeclaration> {
	const pages = new Map<string, PointSemanticPageDeclaration>();
	for (const declaration of declarations) {
		if (declaration.kind === "page" && declaration.name) {
			pages.set(declaration.name, declaration as PointSemanticPageDeclaration);
		}
	}
	return pages;
}

function programHasNavigationLinks(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => declaration.kind === "function" && declaration.semantic?.viewNavigation);
}

function programHasDataLoad(program: PointCoreProgram): boolean {
	return program.declarations.some(
		(declaration) => declaration.kind === "function" && (declaration.semantic?.viewDataLoad || declaration.semantic?.pageDataLoad),
	);
}

function programHasStreamSubscribe(program: PointCoreProgram): boolean {
	return program.declarations.some(
		(declaration) =>
			declaration.kind === "function" && (declaration.semantic?.viewStreamSubscribe || declaration.semantic?.pageStreamSubscribe),
	);
}

function programHasViewTabs(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => declaration.kind === "function" && declaration.semantic?.viewTabs);
}

function programHasFormSubmit(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => declaration.kind === "function" && Boolean(declaration.semantic?.viewControls?.submit));
}

function programNeedsAuthClient(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => {
		const submit = declaration.kind === "function" ? declaration.semantic?.viewControls?.submit : undefined;
		const buttons = declaration.kind === "function" ? declaration.semantic?.viewButtons : undefined;
		return Boolean(submit && (submit.withAuth || submit.saveTokenField)) || Boolean(buttons?.some((button) => button.clearAuth));
	});
}

function programNeedsFormNavigate(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => {
		const submit = declaration.kind === "function" ? declaration.semantic?.viewControls?.submit : undefined;
		return Boolean(submit?.navigateTo);
	});
}

function programHasViewButtons(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => declaration.kind === "function" && Boolean(declaration.semantic?.viewButtons?.length));
}

function programNeedsViewButtonNavigate(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => {
		const buttons = declaration.kind === "function" ? declaration.semantic?.viewButtons : undefined;
		return Boolean(buttons?.some((button) => button.navigateTo));
	});
}

function navigationNeedsPageState(
	navigation: PointSemanticNavigationDeclaration,
	pages: Map<string, PointSemanticPageDeclaration>,
): boolean {
	return navigation.routes.some((route) => {
		const page = pages.get(route.pageName);
		if (!page) return false;
		const pathParams = new Set(navigationPathParamInputs(route.path, page).map((input) => input.label));
		return page.inputs.some((input) => !pathParams.has(input.label));
	});
}

function emitRouteServeCommand(declaration: PointCoreFunctionDeclaration): string[] {
	const asyncPrefix = declaration.semantic?.kind === "command" ? "async " : "";
	return [
		`export ${asyncPrefix}function ${declaration.name}(${declaration.params.map(emitParam).join(", ")}): Promise<void> {`,
		"  const port = Number(process.env.PORT ?? 3456);",
		"  const server = Bun.serve({ port, fetch: createPointRouteFetchHandler() });",
		"  console.log(`Routes listening on http://localhost:${server.port}`);",
		"  await new Promise(() => {});",
		"}",
	];
}
