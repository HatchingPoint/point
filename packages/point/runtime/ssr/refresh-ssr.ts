import type { PointSemanticDataLoad } from "../../src/core/ast.ts";
import { escapeThemeAttribute } from "./theme-ssr.ts";

export const POINT_REFRESH_HEADER = "X-Point-Refresh";
export const POINT_REFRESH_HEADER_VALUE = "view";

export function serializePointRefreshConfig(refreshIntervalMs: number, path: string): string {
	return JSON.stringify({ intervalMs: refreshIntervalMs, path });
}

export function wrapLiveRegionHtml(content: string, spec: Pick<PointSemanticDataLoad, "refreshIntervalMs">, currentPath: string): string {
	if (!spec.refreshIntervalMs) return content;
	const config = serializePointRefreshConfig(spec.refreshIntervalMs, currentPath);
	return `<div class="point-live-region" data-point-refresh="${escapeThemeAttribute(config)}">${content}</div>`;
}

export function pageNeedsRefreshClient(html: string): boolean {
	return html.includes("data-point-refresh");
}

export function extractLiveRegionInnerHtml(html: string): string | null {
	const needle = '<div class="point-live-region"';
	const start = html.indexOf(needle);
	if (start < 0) return null;
	const openEnd = html.indexOf(">", start);
	if (openEnd < 0) return null;
	let depth = 1;
	let index = openEnd + 1;
	const innerStart = index;
	while (index < html.length && depth > 0) {
		if (html.startsWith("<div", index)) {
			depth += 1;
			index = html.indexOf(">", index);
			if (index < 0) return null;
			index += 1;
			continue;
		}
		if (html.startsWith("</div>", index)) {
			depth -= 1;
			if (depth === 0) return html.slice(innerStart, index);
			index += 6;
			continue;
		}
		index += 1;
	}
	return null;
}

export function renderPointRefreshClientSnippet(): string {
	return [
		`document.querySelectorAll("[data-point-refresh]").forEach(function(root){`,
		`let config;try{config=JSON.parse(root.getAttribute("data-point-refresh")||"{}")}catch{return}`,
		`if(!config.intervalMs)return;`,
		`setInterval(async function(){`,
		`try{`,
		`const response=await fetch(config.path||(location.pathname+location.search),{headers:{${JSON.stringify(POINT_REFRESH_HEADER)}:${JSON.stringify(POINT_REFRESH_HEADER_VALUE)}}});`,
		`if(!response.ok)return;`,
		`root.innerHTML=await response.text();`,
		`}catch{}}`,
		`,config.intervalMs);`,
		`});`,
	].join("");
}
