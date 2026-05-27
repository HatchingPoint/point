import type {
	PointCoreExpression,
	PointCoreFunctionDeclaration,
	PointCoreProgram,
	PointSemanticDataLoad,
	PointSemanticViewButtonSpec,
	PointSemanticViewChartSpec,
	PointSemanticViewControls,
	PointSemanticViewFieldBinding,
	PointSemanticViewModalSpec,
	PointSemanticViewTableSpec,
	PointSemanticViewTabsSpec,
} from "../../src/core/ast.ts";
import { interpretCoreProgramEntry, type PointRuntimeValue } from "../interpreter/index.ts";
import { serializePointFormSubmitConfig } from "./form-client.ts";

export type SsrRenderFrame = {
	locals: Map<string, unknown>;
	currentPath: string;
};

export type SsrRenderHelpers = {
	evaluateExpression: (expression: PointCoreExpression) => unknown;
	renderExpression: (expression: PointCoreExpression) => string;
};

function escapeHtml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
	return escapeHtml(value).replaceAll('"', "&quot;");
}

function wrap(tag: string, content: string, className: string): string {
	const classAttr = className ? ` class="${escapeAttribute(className)}"` : "";
	return `<${tag}${classAttr}>${content}</${tag}>`;
}

function columnLabel(column: string): string {
	return column.charAt(0).toUpperCase() + column.slice(1);
}

function toRecordRows(value: unknown): Record<string, PointRuntimeValue>[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item)) as Record<string, PointRuntimeValue>[];
}

function sortRows(rows: Record<string, PointRuntimeValue>[], sortBy: string): Record<string, PointRuntimeValue>[] {
	return [...rows].sort((left, right) => String(left[sortBy] ?? "").localeCompare(String(right[sortBy] ?? "")));
}

function filterRows(
	rows: Record<string, PointRuntimeValue>[],
	spec: PointSemanticViewTableSpec,
	filterText: string,
): Record<string, PointRuntimeValue>[] {
	if (!spec.filterBy || !filterText.trim()) return rows;
	const needle = filterText.trim().toLowerCase();
	return rows.filter((row) => String(row[spec.filterBy!] ?? "").toLowerCase().includes(needle));
}

function evaluateBindingValue(helpers: SsrRenderHelpers, binding: PointSemanticViewFieldBinding): PointRuntimeValue {
	const value = helpers.evaluateExpression(binding.target);
	if (value === null || typeof value === "object" && "__pointHtml" in (value as object)) return null;
	return value as PointRuntimeValue;
}

export function renderViewTableHtml(
	helpers: SsrRenderHelpers,
	spec: PointSemanticViewTableSpec,
	options: { filterText?: string; evaluateForRow?: (row: Record<string, PointRuntimeValue>, expression: PointCoreExpression) => unknown } = {},
): string {
	const filterText = options.filterText ?? "";
	const rawRows = toRecordRows(helpers.evaluateExpression(spec.iterable));
	let rows = rawRows;
	if (spec.sortBy) rows = sortRows(rows, spec.sortBy);
	rows = filterRows(rows, spec, filterText);
	if (spec.pageSize) rows = rows.slice(0, spec.pageSize);

	const tableClass = spec.sortBy ? "point-table point-datagrid" : "point-table";
	const headers = spec.columns
		.map((column) => `<th scope="col">${escapeHtml(columnLabel(column))}</th>`)
		.join("");
	const body = rows
		.map((row, index) => {
			const cells = spec.columns
				.map((column) => {
					const value = String(row[column] ?? "");
					if (spec.linkColumn === column && spec.linkPath) {
						const hrefValue = options.evaluateForRow
							? options.evaluateForRow(row, spec.linkPath)
							: evaluateRowExpression(helpers, spec.itemIdentifier, row, spec.linkPath);
						const href = escapeAttribute(String(hrefValue ?? ""));
						return `<td><a class="point-link" href="${href}">${escapeHtml(value)}</a></td>`;
					}
					return `<td>${escapeHtml(value)}</td>`;
				})
				.join("");
			return `<tr>${cells}</tr>`;
		})
		.join("");

	const filterField =
		spec.filterLocal && spec.filterBy
			? `<label class="point-datagrid-filter"><span>Filter ${escapeHtml(columnLabel(spec.filterBy))}</span><input class="point-input" type="search" name="filter" value="${escapeAttribute(filterText)}" placeholder="Type to filter..." /></label>`
			: "";
	const table = `<table class="${escapeAttribute(tableClass)}"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
	const pagination =
		spec.pageSize && rawRows.length > spec.pageSize
			? `<div class="point-datagrid-pagination"><span class="point-datagrid-page-label">Showing ${Math.min(spec.pageSize, rows.length)} of ${rawRows.length}</span></div>`
			: "";

	if (filterField || pagination) return `<div class="point-datagrid-wrap">${filterField}${table}${pagination}</div>`;
	return table;
}

function evaluateRowExpression(
	helpers: SsrRenderHelpers,
	itemIdentifier: string,
	row: Record<string, PointRuntimeValue>,
	expression: PointCoreExpression,
): unknown {
	if (expression.kind === "identifier" && expression.name === itemIdentifier) return row;
	if (expression.kind === "property" && expression.target.kind === "identifier" && expression.target.name === itemIdentifier) {
		return row[expression.name] ?? null;
	}
	return helpers.evaluateExpression(expression);
}

function renderFormField(helpers: SsrRenderHelpers, binding: PointSemanticViewFieldBinding): string {
	const value = evaluateBindingValue(helpers, binding);
	const label = escapeHtml(binding.label);
	const name = escapeAttribute(binding.fieldName);
	const fieldAttr = ` data-point-field="${name}"`;
	if (binding.inputKind === "checkbox") {
		const checked = value === true ? " checked" : "";
		return `<label class="point-form-field"><input type="checkbox" name="${name}" value="true"${fieldAttr}${checked} aria-label="${name}" />${label}</label>`;
	}
	if (binding.inputKind === "textarea") {
		const text = value === null ? "" : escapeHtml(String(value));
		return `<label class="point-form-field"><span>${label}</span><textarea class="point-textarea" name="${name}"${fieldAttr}>${text}</textarea></label>`;
	}
	if (binding.inputKind === "select" && binding.options) {
		const options = helpers.evaluateExpression(binding.options);
		const selected = value === null ? "" : String(value);
		const optionTags = Array.isArray(options)
			? options
					.map((option) => {
						const optionValue = escapeAttribute(String(option));
						const selectedAttr = optionValue === selected ? " selected" : "";
						return `<option value="${optionValue}"${selectedAttr}>${escapeHtml(String(option))}</option>`;
					})
					.join("")
			: "";
		return `<label class="point-form-field"><span>${label}</span><select class="point-select" name="${name}"${fieldAttr}>${optionTags}</select></label>`;
	}
	const text = value === null ? "" : escapeAttribute(String(value));
	return `<label class="point-form-field"><span>${label}</span><input class="point-input" type="text" name="${name}" value="${text}"${fieldAttr} /></label>`;
}

export function renderViewControlsHtml(helpers: SsrRenderHelpers, controls: PointSemanticViewControls): string {
	const fields = controls.fields.map((binding) => renderFormField(helpers, binding)).join("");
	const formClass = controls.style?.length ? `point-form point-style-${controls.style.join(" point-style-")}` : "point-form";
	const submit = controls.submit
		? `<button type="submit" class="point-button point-form-submit">${escapeHtml(controls.submit.label)}</button>`
		: "";
	const submitConfig = serializePointFormSubmitConfig(controls);
	const submitAttr = submitConfig ? ` data-point-form-submit="${escapeAttribute(JSON.stringify(submitConfig))}"` : "";
	const formOpen = controls.submit
		? `<form class="${escapeAttribute(formClass)}"${submitAttr}>`
		: `<div class="${escapeAttribute(formClass)}">`;
	const formClose = controls.submit ? "</form>" : "</div>";
	const toastHints =
		controls.successToast || controls.errorToast
			? `<div class="point-toast-hints" hidden data-success-toast="${escapeAttribute(controls.successToast ?? "")}" data-error-toast="${escapeAttribute(controls.errorToast ?? "")}"></div>`
			: "";
	return `${formOpen}${fields}${submit}${toastHints}${formClose}`;
}

function truthyValue(value: unknown): boolean {
	if (value === null || value === false) return false;
	if (typeof value === "string") return value.length > 0;
	if (typeof value === "number") return value !== 0;
	return true;
}

function styleClassTokens(base: string, style?: string[]): string {
	return style?.length ? `${base} point-style-${style.join(" point-style-")}` : base;
}

export function renderViewButtonsHtml(buttons: PointSemanticViewButtonSpec[]): string {
	return buttons
		.map((button) => {
			const style = button.style?.length ? ` point-style-${button.style.join(" point-style-")}` : "";
			const config =
				button.clearAuth || button.navigateTo
					? { ...(button.clearAuth ? { clearAuth: true } : {}), ...(button.navigateTo ? { navigateTo: button.navigateTo } : {}) }
					: undefined;
			const attr = config ? ` data-point-view-button="${escapeAttribute(JSON.stringify(config))}"` : "";
			return `<button type="button" class="point-button point-view-button${style}"${attr}>${escapeHtml(button.label)}</button>`;
		})
		.join("");
}

export function renderViewChartHtml(helpers: SsrRenderHelpers, spec: PointSemanticViewChartSpec): string {
	const rows = toRecordRows(helpers.evaluateExpression(spec.iterable));
	const className = styleClassTokens("point-chart point-chart-bar", spec.style);
	const bars = rows
		.map((row) => {
			const value = Number(row[spec.valueField] ?? 0);
			const height = Math.max(4, Math.min(100, value));
			const label = String(row[spec.labelField] ?? "");
			return `<div class="point-chart-bar-item"><div class="point-chart-bar-value" style="height:${height}%" title="${escapeAttribute(label)}"></div><span class="point-chart-bar-label">${escapeHtml(label)}</span></div>`;
		})
		.join("");
	return `<div class="${escapeAttribute(className)}" role="img" aria-label="Bar chart">${bars}</div>`;
}

export function renderViewTabsHtml(helpers: SsrRenderHelpers, spec: PointSemanticViewTabsSpec): string {
	const tabButtons = spec.tabs
		.map((tab, index) => {
			const activeClass = index === 0 ? " point-tab-active" : "";
			const selected = index === 0 ? ' aria-selected="true"' : ' aria-selected="false"';
			return `<button type="button" role="tab" class="point-tab${activeClass}"${selected} data-point-tab="${index}">${escapeHtml(tab.label)}</button>`;
		})
		.join("");
	const panels = spec.tabs
		.map((tab, index) => {
			const content = helpers.renderExpression(tab.content);
			const activeClass = index === 0 ? " point-tabpanel-active" : "";
			const hidden = index === 0 ? "" : " hidden";
			return `<div class="point-tabpanel${activeClass}" role="tabpanel" data-point-tabpanel="${index}"${hidden}>${content}</div>`;
		})
		.join("");
	return `<div class="point-tabs" data-point-tabs><div class="point-tabs-list" role="tablist" aria-label="Tabs">${tabButtons}</div>${panels}</div>`;
}

export function renderViewModalHtml(helpers: SsrRenderHelpers, spec: PointSemanticViewModalSpec): string {
	if (spec.when && !truthyValue(helpers.evaluateExpression(spec.when))) return "";
	const titleId = `point-modal-${spec.title.toLowerCase().replaceAll(/\s+/g, "-")}`;
	const body = helpers.renderExpression(spec.content);
	return `<div class="point-modal-overlay" role="presentation"><div class="point-modal" role="dialog" aria-modal="true" aria-labelledby="${escapeAttribute(titleId)}"><h2 id="${escapeAttribute(titleId)}">${escapeHtml(spec.title)}</h2><div class="point-modal-body">${body}</div></div></div>`;
}

type ViewDataLoadResult = { kind: "ready" } | { kind: "loading"; html: string } | { kind: "error"; html: string } | { kind: "empty"; html: string };

export function prepareViewDataLoad(
	program: PointCoreProgram,
	frame: SsrRenderFrame,
	spec: PointSemanticDataLoad,
	helpers: SsrRenderHelpers,
): ViewDataLoadResult {
	if (spec.actionFunction) {
		try {
			const loaded = interpretCoreProgramEntry(program, spec.actionFunction, []);
			frame.locals.set(spec.bindingName, loaded);
			if (loaded === null) {
				if (spec.empty) return { kind: "empty", html: helpers.renderExpression(spec.empty) };
				return { kind: "ready" };
			}
			if (typeof loaded === "object" && !Array.isArray(loaded) && "message" in loaded) {
				if (spec.error) return { kind: "error", html: helpers.renderExpression(spec.error) };
				return { kind: "error", html: escapeHtml(String((loaded as { message?: unknown }).message ?? "Error")) };
			}
			if (Array.isArray(loaded) && loaded.length === 0 && spec.empty) {
				return { kind: "empty", html: helpers.renderExpression(spec.empty) };
			}
			return { kind: "ready" };
		} catch {
			if (spec.error) return { kind: "error", html: helpers.renderExpression(spec.error) };
			return { kind: "error", html: "Could not load data" };
		}
	}
	if (spec.loading) return { kind: "loading", html: helpers.renderExpression(spec.loading) };
	return { kind: "ready" };
}

export function renderViewSemanticExtras(
	program: PointCoreProgram,
	fn: PointCoreFunctionDeclaration,
	frame: SsrRenderFrame,
	helpers: SsrRenderHelpers,
	evaluateForRow?: (row: Record<string, PointRuntimeValue>, expression: PointCoreExpression) => unknown,
): string {
	const parts: string[] = [];
	if (fn.semantic?.viewDataLoad) {
		const load = prepareViewDataLoad(program, frame, fn.semantic.viewDataLoad, helpers);
		if (load.kind !== "ready") {
			parts.push(load.html);
			return parts.join("");
		}
	}
	if (fn.semantic?.viewButtons?.length) parts.push(renderViewButtonsHtml(fn.semantic.viewButtons));
	if (fn.semantic?.viewControls) parts.push(renderViewControlsHtml(helpers, fn.semantic.viewControls));
	if (fn.semantic?.viewTable) parts.push(renderViewTableHtml(helpers, fn.semantic.viewTable, { evaluateForRow }));
	if (fn.semantic?.viewChart) parts.push(renderViewChartHtml(helpers, fn.semantic.viewChart));
	if (fn.semantic?.viewTabs) parts.push(renderViewTabsHtml(helpers, fn.semantic.viewTabs));
	if (fn.semantic?.viewModal) parts.push(renderViewModalHtml(helpers, fn.semantic.viewModal));
	return parts.join("");
}
