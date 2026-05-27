import type { PointCoreExpression, PointCoreFunctionDeclaration, PointCoreProgram, PointCoreStatement } from "../../src/core/ast.ts";
import { checkPointCore } from "../../src/core/check.ts";
import type { PointSemanticNavigationDeclaration, PointSemanticPageDeclaration } from "../../src/semantic/ast.ts";
import { interpretCoreProgramEntry, type PointRuntimeValue } from "../interpreter/index.ts";
import { renderViewSemanticExtras, type SsrRenderFrame } from "./view-extras.ts";
import { wrapSsrHtmlDocument } from "./document.ts";
import { extractLiveRegionInnerHtml, POINT_REFRESH_HEADER, POINT_REFRESH_HEADER_VALUE, wrapLiveRegionHtml } from "./refresh-ssr.ts";
import { buildSseSubscribeConfig, renderSseSubscribeRegion } from "./sse-ssr.ts";
import { buildWsSubscribeConfig, renderWsSubscribeRegion } from "./ws-ssr.ts";

type HtmlValue = { readonly __pointHtml: true; readonly html: string };
type SsrValue = PointRuntimeValue | HtmlValue;

type RenderFrame = {
	locals: Map<string, SsrValue>;
	currentPath: string;
};

type StatementResult = { returned: true; value: SsrValue; className?: string; style?: string[] } | { returned: false };

export type PointSsrRenderable = {
	readonly name: string;
	readonly functionName: string;
	readonly kind: "view" | "page" | "layout";
};

export function pointSsrRenderables(program: PointCoreProgram): PointSsrRenderable[] {
	return program.declarations
		.filter((declaration): declaration is PointCoreFunctionDeclaration => declaration.kind === "function")
		.filter((declaration) => declaration.semantic?.kind === "view" || declaration.semantic?.kind === "page" || declaration.semantic?.kind === "layout")
		.map((declaration) => ({
			name: declaration.semantic?.name ?? declaration.name,
			functionName: declaration.name,
			kind: declaration.semantic!.kind as "view" | "page" | "layout",
		}));
}

export function renderPointViewToHtml(program: PointCoreProgram, viewName: string, args: PointRuntimeValue[] = []): string {
	assertChecked(program);
	const fn = findRenderable(program, "view", viewName);
	return renderFunctionToHtml(program, fn, args).html;
}

export function renderPointPageToHtml(program: PointCoreProgram, pageName: string, args: PointRuntimeValue[] = []): string {
	assertChecked(program);
	const fn = findRenderable(program, "page", pageName);
	return renderFunctionToHtml(program, fn, args).html;
}

export function renderPointSsrEntryToHtml(program: PointCoreProgram, entryName: string, args: PointRuntimeValue[] = []): string {
	assertChecked(program);
	const fn = findRenderable(program, undefined, entryName);
	return renderFunctionToHtml(program, fn, args).html;
}

export async function renderPointRuntimePage(program: PointCoreProgram, request: Request): Promise<Response | null> {
	assertChecked(program);
	const url = new URL(request.url);
	if (request.method.toUpperCase() === "GET") {
		const match = matchNavigationPage(program, url.pathname);
		if (match) {
			const page = findSemanticPage(program, match.pageName);
			const args = page.inputs.map((input) => match.params.get(input.label) ?? url.searchParams.get(input.label) ?? null);
			const pageFn = findRenderable(program, "page", page.name);
			const body = renderFunctionToHtml(program, pageFn, args, new Map(), url.pathname).html;
			if (request.headers.get(POINT_REFRESH_HEADER) === POINT_REFRESH_HEADER_VALUE) {
				const fragment = extractLiveRegionInnerHtml(body);
				if (fragment) {
					return new Response(fragment, {
						status: 200,
						headers: { "content-type": "text/html; charset=utf-8" },
					});
				}
			}
			return new Response(wrapSsrHtmlDocument(body, program), {
				status: 200,
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		}
	}
	if (url.pathname !== "/" || !hasExperimentReadinessSurface(program)) return null;
	if (request.method !== "GET" && request.method !== "POST") return null;

	const signals = request.method === "POST" ? await readinessSignalsFromRequest(request) : defaultReadinessSignals(false);
	const result = evaluateReadiness(program, signals);
	return new Response(renderReadinessPage(signals, result), { headers: { "content-type": "text/html; charset=utf-8" } });
}

function renderFunctionToHtml(
	program: PointCoreProgram,
	fn: PointCoreFunctionDeclaration,
	args: PointRuntimeValue[],
	slotOverrides: Map<string, string> = new Map(),
	currentPath = "",
): HtmlValue {
	if (fn.semantic?.kind === "page" && fn.semantic.pageLayout) return html(renderPage(program, fn, args, currentPath));
	if (fn.semantic?.kind === "layout" && fn.semantic.layoutSpec) return html(renderLayout(program, fn, slotOverrides, currentPath));

	const frame = createFrame(fn, args, currentPath);
	if (fn.semantic?.kind === "view") {
		const helpers = createSsrHelpers(program, frame);
		const itemIdentifier = fn.semantic.viewTable?.itemIdentifier;
		const evaluateForRow = itemIdentifier
			? (row: Record<string, PointRuntimeValue>, expression: PointCoreExpression) =>
					evaluateExpression(program, createRowFrame(frame, itemIdentifier, row), expression)
			: undefined;
		const extras = renderViewSemanticExtras(program, fn, frame as SsrRenderFrame, helpers, evaluateForRow);
		const streamSubscribe = fn.semantic.viewStreamSubscribe;
		if (streamSubscribe?.transport === "sse") {
			frame.locals.set(streamSubscribe.bindingName, []);
		}
		if (streamSubscribe?.transport === "websocket") {
			frame.locals.set(streamSubscribe.bindingName, []);
		}
		const result = executeStatements(program, frame, fn.body);
		const body = result.returned ? renderValue(result.value) : "";
		const navigation = renderViewNavigation(fn.semantic.viewNavigation?.links ?? [], currentPath);
		let content = `${navigation}${extras}${body}`;
		if (streamSubscribe?.transport === "sse") {
			const eachSpec = fn.semantic.viewEach?.[0];
			const connectingHtml = streamSubscribe.connecting ? helpers.renderExpression(streamSubscribe.connecting) : undefined;
			const disconnectedHtml = streamSubscribe.disconnected ? helpers.renderExpression(streamSubscribe.disconnected) : undefined;
			const errorHtml = streamSubscribe.error ? helpers.renderExpression(streamSubscribe.error) : undefined;
			const config = buildSseSubscribeConfig(streamSubscribe, eachSpec, connectingHtml, disconnectedHtml, errorHtml);
			content = `${navigation}${renderSseSubscribeRegion(config, "")}${body}`;
		}
		if (streamSubscribe?.transport === "websocket") {
			const eachSpec = fn.semantic.viewEach?.[0];
			const connectingHtml = streamSubscribe.connecting ? helpers.renderExpression(streamSubscribe.connecting) : undefined;
			const disconnectedHtml = streamSubscribe.disconnected ? helpers.renderExpression(streamSubscribe.disconnected) : undefined;
			const errorHtml = streamSubscribe.error ? helpers.renderExpression(streamSubscribe.error) : undefined;
			const config = buildWsSubscribeConfig(streamSubscribe, eachSpec, connectingHtml, disconnectedHtml, errorHtml);
			content = `${navigation}${renderWsSubscribeRegion(config)}${body}`;
		}
		if (fn.semantic.viewDataLoad?.refreshIntervalMs) {
			content = wrapLiveRegionHtml(content, fn.semantic.viewDataLoad, currentPath);
		}
		return html(
			wrap(
				"div",
				content,
				classTokens("point-view-render", result.returned ? result.className : undefined, result.returned ? result.style : undefined),
			),
		);
	}

	const result = executeStatements(program, frame, fn.body);
	const value = result.returned ? result.value : null;
	const rendered = renderValue(value);
	return html(rendered);
}

function createSsrHelpers(program: PointCoreProgram, frame: RenderFrame) {
	return {
		evaluateExpression: (expression: PointCoreExpression) => evaluateExpression(program, frame, expression),
		renderExpression: (expression: PointCoreExpression) => renderExpression(program, frame, expression),
	};
}

function createRowFrame(frame: RenderFrame, itemIdentifier: string, row: Record<string, PointRuntimeValue>): RenderFrame {
	return { locals: new Map([...frame.locals.entries(), [itemIdentifier, row]]), currentPath: frame.currentPath };
}

function renderPage(program: PointCoreProgram, fn: PointCoreFunctionDeclaration, args: PointRuntimeValue[], currentPath: string): string {
	const layout = fn.semantic?.pageLayout;
	if (!layout) return renderFunctionToHtml(program, fn, args, new Map(), currentPath).html;
	const frame = createFrame(fn, args, currentPath);
	const title = renderText(evaluateExpression(program, frame, layout.title));
	const description = layout.description ? `<p class="point-page-description">${renderText(evaluateExpression(program, frame, layout.description))}</p>` : "";
	const main = renderExpression(program, frame, layout.main);
	const mainClass = classTokens("point-page-main", layout.mainClassName, layout.mainStyle);
	const pageContent = [
		`<header class="point-page-header"><h1>${title}</h1>${description}</header>`,
		wrap("section", main, mainClass),
	].join("");

	if (layout.layoutFunction) {
		const layoutFn = findFunction(program, layout.layoutFunction);
		return renderFunctionToHtml(program, layoutFn, [], new Map([["main", pageContent]]), currentPath).html;
	}
	return wrap("main", pageContent, "point-page");
}

function renderLayout(program: PointCoreProgram, fn: PointCoreFunctionDeclaration, slotOverrides: Map<string, string>, currentPath: string): string {
	const spec = fn.semantic?.layoutSpec;
	if (!spec) return "";
	const frame = createFrame(fn, [], currentPath);
	const slots = spec.slots
		.map((slot) => {
			const content = slotOverrides.get(slot.name) ?? renderExpression(program, frame, slot.content);
			return wrap("section", content, classTokens(`point-layout-slot point-layout-slot-${toHtmlToken(slot.name)}`, undefined, slot.style));
		})
		.join("");
	return wrap("div", slots, "point-layout");
}

function executeStatements(program: PointCoreProgram, frame: RenderFrame, statements: PointCoreStatement[]): StatementResult {
	for (const statement of statements) {
		if (statement.kind === "return") {
			return { returned: true, value: statement.value ? evaluateExpression(program, frame, statement.value) : null, className: statement.className, style: statement.style };
		}
		if (statement.kind === "value") {
			frame.locals.set(statement.name, evaluateExpression(program, frame, statement.value));
			continue;
		}
		if (statement.kind === "assignment") {
			frame.locals.set(statement.name, assignValue(frame.locals.get(statement.name) ?? null, evaluateExpression(program, frame, statement.value), statement.operator));
			continue;
		}
		if (statement.kind === "if") {
			const branch = truthy(evaluateExpression(program, frame, statement.condition)) ? statement.thenBody : statement.elseBody;
			const result = executeStatements(program, frame, branch);
			if (result.returned) return result;
			continue;
		}
		if (statement.kind === "expression") {
			evaluateExpression(program, frame, statement.value);
			continue;
		}
	}
	return { returned: false };
}

function evaluateExpression(program: PointCoreProgram, frame: RenderFrame, expression: PointCoreExpression): SsrValue {
	if (expression.kind === "literal") return expression.value;
	if (expression.kind === "identifier") return frame.locals.get(expression.name) ?? null;
	if (expression.kind === "list") return expression.items.map((item) => toRuntimeValue(evaluateExpression(program, frame, item)));
	if (expression.kind === "record") {
		const record: Record<string, PointRuntimeValue> = {};
		for (const field of expression.fields) record[field.name] = toRuntimeValue(evaluateExpression(program, frame, field.value));
		return record;
	}
	if (expression.kind === "property") {
		const target = evaluateExpression(program, frame, expression.target);
		if (target === null || isHtml(target) || typeof target !== "object" || Array.isArray(target)) return null;
		return target[expression.name] ?? null;
	}
	if (expression.kind === "await") return evaluateExpression(program, frame, expression.value);
	if (expression.kind === "binary") return evaluateBinary(evaluateExpression(program, frame, expression.left), evaluateExpression(program, frame, expression.right), expression.operator);
	if (expression.kind === "call") {
		const args = expression.args.map((arg) => toRuntimeValue(evaluateExpression(program, frame, arg)));
		const fn = findFunction(program, expression.callee);
		if (fn.semantic?.kind === "view" || fn.semantic?.kind === "page" || fn.semantic?.kind === "layout") return renderFunctionToHtml(program, fn, args, new Map(), frame.currentPath);
		return interpretCoreProgramEntry(program, expression.callee, args);
	}
	return null;
}

function evaluateBinary(left: SsrValue, right: SsrValue, operator: string): PointRuntimeValue {
	const leftValue = toRuntimeValue(left);
	const rightValue = toRuntimeValue(right);
	if (operator === "==") return leftValue === rightValue;
	if (operator === "!=") return leftValue !== rightValue;
	if (operator === "and") return truthy(left) && truthy(right);
	if (operator === "or") return truthy(left) || truthy(right);
	if (operator === "+") {
		if (typeof leftValue === "number" && typeof rightValue === "number") return leftValue + rightValue;
		return `${String(leftValue)}${String(rightValue)}`;
	}
	if (typeof leftValue !== "number" || typeof rightValue !== "number") return null;
	if (operator === "-") return leftValue - rightValue;
	if (operator === "*") return leftValue * rightValue;
	if (operator === "/") return leftValue / rightValue;
	if (operator === "<") return leftValue < rightValue;
	if (operator === "<=") return leftValue <= rightValue;
	if (operator === ">") return leftValue > rightValue;
	if (operator === ">=") return leftValue >= rightValue;
	return null;
}

function createFrame(fn: PointCoreFunctionDeclaration, args: PointRuntimeValue[], currentPath: string): RenderFrame {
	if (args.length !== fn.params.length) throw new Error(`SSR function ${fn.name} expected ${fn.params.length} argument(s), got ${args.length}.`);
	return { locals: new Map(fn.params.map((param, index) => [param.name, args[index] ?? null])), currentPath };
}

function findRenderable(program: PointCoreProgram, kind: "view" | "page" | "layout" | undefined, name: string): PointCoreFunctionDeclaration {
	const fn = program.declarations.find(
		(declaration): declaration is PointCoreFunctionDeclaration =>
			declaration.kind === "function" &&
			(kind === undefined || declaration.semantic?.kind === kind) &&
			(declaration.name === name || declaration.semantic?.name === name),
	);
	if (!fn) throw new Error(`SSR renderable not found: ${name}`);
	return fn;
}

function findFunction(program: PointCoreProgram, name: string): PointCoreFunctionDeclaration {
	const fn = program.declarations.find((declaration): declaration is PointCoreFunctionDeclaration => declaration.kind === "function" && declaration.name === name);
	if (!fn) throw new Error(`SSR function not found: ${name}`);
	return fn;
}

function matchNavigationPage(program: PointCoreProgram, pathname: string): { pageName: string; params: Map<string, string> } | null {
	const navigations =
		program.semanticSource?.declarations.filter((declaration): declaration is PointSemanticNavigationDeclaration => declaration.kind === "navigation") ?? [];
	for (const navigation of navigations) {
		for (const route of navigation.routes) {
			const match = pathPattern(route.path).exec(trimTrailingSlash(pathname));
			if (!match) continue;
			const params = new Map<string, string>();
			for (const [index, name] of pathParamNames(route.path).entries()) params.set(name, decodeURIComponent(match[index + 1] ?? ""));
			return { pageName: route.pageName, params };
		}
	}
	return null;
}

function findSemanticPage(program: PointCoreProgram, pageName: string): PointSemanticPageDeclaration {
	const page = program.semanticSource?.declarations.find(
		(declaration): declaration is PointSemanticPageDeclaration => declaration.kind === "page" && declaration.name === pageName,
	);
	if (!page) throw new Error(`SSR page declaration not found: ${pageName}`);
	return page;
}

function assertChecked(program: PointCoreProgram): void {
	const diagnostics = checkPointCore(program);
	if (diagnostics.length > 0) throw new Error(`Cannot render unchecked program: ${diagnostics.length} diagnostic(s).`);
}

function renderExpression(program: PointCoreProgram, frame: RenderFrame, expression: PointCoreExpression): string {
	return renderValue(evaluateExpression(program, frame, expression));
}

function renderValue(value: SsrValue): string {
	if (isHtml(value)) return value.html;
	if (Array.isArray(value)) return value.map((item) => renderValue(item)).join("");
	return renderText(value);
}

function renderText(value: SsrValue): string {
	if (isHtml(value)) return value.html;
	if (value === null) return "";
	if (typeof value === "object") return escapeHtml(JSON.stringify(value));
	return escapeHtml(String(value));
}

function toRuntimeValue(value: SsrValue): PointRuntimeValue {
	if (isHtml(value)) return value.html;
	return value;
}

function assignValue(current: SsrValue, next: SsrValue, operator: "=" | "+=" | "-="): SsrValue {
	if (operator === "=") return next;
	const currentValue = toRuntimeValue(current);
	const nextValue = toRuntimeValue(next);
	if (typeof currentValue !== "number" || typeof nextValue !== "number") return next;
	return operator === "+=" ? currentValue + nextValue : currentValue - nextValue;
}

function truthy(value: SsrValue): boolean {
	if (isHtml(value)) return value.html.length > 0;
	return Boolean(value);
}

function html(value: string): HtmlValue {
	return { __pointHtml: true, html: value };
}

function isHtml(value: SsrValue): value is HtmlValue {
	return value !== null && typeof value === "object" && "__pointHtml" in value;
}

function wrap(tag: string, content: string, className: string): string {
	const classAttr = className ? ` class="${escapeAttribute(className)}"` : "";
	return `<${tag}${classAttr}>${content}</${tag}>`;
}

function renderViewNavigation(links: readonly { label: string; path: string }[], currentPath: string): string {
	if (links.length === 0) return "";
	const renderedLinks = links
		.map((link) => {
			const className = classTokens("point-link", currentPath && normalizePath(link.path) === normalizePath(currentPath) ? "point-link-active" : undefined);
			return `<a class="${escapeAttribute(className)}" href="${escapeAttribute(link.path)}">${escapeHtml(link.label)}</a>`;
		})
		.join("");
	return `<nav class="point-nav" aria-label="Primary">${renderedLinks}</nav>`;
}

function classTokens(base: string, className?: string, style?: string[]): string {
	return [base, className, ...(style ?? [])].filter(Boolean).join(" ");
}

function toHtmlToken(value: string): string {
	return value.trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9_-]/g, "").toLowerCase();
}

function escapeHtml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
	return escapeHtml(value).replaceAll('"', "&quot;");
}

function pathPattern(path: string): RegExp {
	const source = trimTrailingSlash(path)
		.split("/")
		.filter(Boolean)
		.map((segment) => (segment.startsWith(":") ? "([^/]+)" : escapeRegExp(segment)))
		.join("/");
	return new RegExp(`^/${source}$`);
}

function pathParamNames(path: string): string[] {
	return trimTrailingSlash(path)
		.split("/")
		.filter((segment) => segment.startsWith(":"))
		.map((segment) => segment.slice(1));
}

function trimTrailingSlash(path: string): string {
	if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
	return path;
}

function normalizePath(path: string): string {
	return trimTrailingSlash(path || "/");
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type ReadinessResult = {
	score: number;
	label: string;
	tone: string;
};

const readinessSignalFields = [
	["hasBuildArtifact", "Has build artifact"],
	["hasPassingChecks", "Has passing checks"],
	["hasRollbackPlan", "Has rollback plan"],
	["hasOwnerApproval", "Has owner approval"],
] as const;

function hasExperimentReadinessSurface(program: PointCoreProgram): boolean {
	const names = new Set(program.declarations.filter((declaration) => declaration.kind === "function").map((declaration) => declaration.name));
	return names.has("deployReadinessScore") && names.has("readinessLabel") && names.has("readinessToneLabel");
}

async function readinessSignalsFromRequest(request: Request): Promise<Record<string, boolean>> {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
		return defaultReadinessSignals(false);
	}
	const form = await request.formData();
	const signals: Record<string, boolean> = {};
	for (const [name] of readinessSignalFields) signals[name] = form.has(name);
	return signals;
}

function defaultReadinessSignals(value: boolean): Record<string, boolean> {
	return Object.fromEntries(readinessSignalFields.map(([name]) => [name, value]));
}

function evaluateReadiness(program: PointCoreProgram, signals: Record<string, boolean>): ReadinessResult {
	const score = interpretCoreProgramEntry(program, "deployReadinessScore", [signals]);
	if (typeof score !== "number") throw new Error("deploy readiness did not return a numeric score.");
	const label = interpretCoreProgramEntry(program, "readinessLabel", [score]);
	const tone = interpretCoreProgramEntry(program, "readinessToneLabel", [score]);
	if (typeof label !== "string" || typeof tone !== "string") throw new Error("readiness labels did not return text.");
	return { score, label, tone };
}

function renderReadinessPage(signals: Record<string, boolean>, result: ReadinessResult): string {
	const controls = readinessSignalFields
		.map(
			([name, label]) =>
				`<label><input type="checkbox" name="${name}" value="true"${signals[name] ? " checked" : ""}> ${escapeHtml(label)}</label>`,
		)
		.join("");
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Point Deploy Readiness</title>
</head>
<body>
  <main>
    <h1>Point Deploy Readiness</h1>
    <form method="post" action="/">
      ${controls}
      <button type="submit">Check readiness</button>
    </form>
    <output name="readiness-result" data-score="${result.score}" data-label="${escapeAttribute(result.label)}" data-tone="${escapeAttribute(result.tone)}">
      ${result.score} ${escapeHtml(result.label)} ${escapeHtml(result.tone)}
    </output>
  </main>
</body>
</html>`;
}
