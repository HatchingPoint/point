import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PointCoreProgram } from "../../src/core/ast.ts";
import type { PointSemanticViewToggleTheme } from "../../src/core/ast.ts";
import { findThemeDeclaration, themePresetClassNames, themeToggleEnabled } from "../../src/core/ui-style.ts";

export const POINT_THEME_MODE_KEY = "point-theme-mode";

export type SsrThemeShell = {
	className: string;
	toggleEnabled: boolean;
};

let cachedPointUiCss: string | undefined;

export function resolveSsrThemeShell(program: PointCoreProgram): SsrThemeShell | undefined {
	const theme = findThemeDeclaration(program.semanticSource?.declarations ?? []);
	if (!theme) return undefined;
	return {
		className: themePresetClassNames(theme),
		toggleEnabled: themeToggleEnabled(theme),
	};
}

export function programUsesThemeToggle(program: PointCoreProgram): boolean {
	return program.declarations.some((declaration) => declaration.kind === "function" && declaration.semantic?.viewToggleTheme);
}

export function escapeThemeAttribute(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderViewToggleThemeHtml(spec?: PointSemanticViewToggleTheme): string {
	if (!spec) return "";
	const style = spec.style?.length ? ` point-style-${spec.style.join(" point-style-")}` : "";
	return `<button type="button" class="point-theme-toggle${style}" data-point-theme-toggle aria-label="Switch to dark theme">Dark</button>`;
}

export function wrapThemeShell(body: string, shell: SsrThemeShell): string {
	const attrs = shell.toggleEnabled
		? ` class="${escapeThemeAttribute(shell.className)}" data-point-theme-root data-point-theme="light"`
		: ` class="${escapeThemeAttribute(shell.className)}"`;
	return `<div${attrs}>${body}</div>`;
}

export function pageNeedsThemeClient(shell: SsrThemeShell | undefined, html: string): boolean {
	if (shell?.toggleEnabled) return true;
	return html.includes("data-point-theme-toggle");
}

export function renderPointThemeClientSnippet(): string {
	return [
		`const THEME_KEY=${JSON.stringify(POINT_THEME_MODE_KEY)};`,
		"function initialThemeMode(){try{const stored=localStorage.getItem(THEME_KEY);if(stored===\"light\"||stored===\"dark\")return stored}catch{}return window.matchMedia(\"(prefers-color-scheme: dark)\").matches?\"dark\":\"light\"}",
		"function applyThemeMode(mode){document.querySelectorAll(\"[data-point-theme-root]\").forEach(function(root){root.setAttribute(\"data-point-theme\",mode)});document.querySelectorAll(\"[data-point-theme-toggle]\").forEach(function(button){button.textContent=mode===\"light\"?\"Dark\":\"Light\";button.setAttribute(\"aria-label\",mode===\"light\"?\"Switch to dark theme\":\"Switch to light theme\")})}",
		"applyThemeMode(initialThemeMode());",
		"document.querySelectorAll(\"[data-point-theme-toggle]\").forEach(function(button){button.addEventListener(\"click\",function(){const root=document.querySelector(\"[data-point-theme-root]\");const current=root instanceof HTMLElement?root.getAttribute(\"data-point-theme\")||\"light\":\"light\";const next=current===\"light\"?\"dark\":\"light\";try{localStorage.setItem(THEME_KEY,next)}catch{}applyThemeMode(next)})});",
	].join("");
}

export function readPointUiCss(): string {
	if (cachedPointUiCss !== undefined) return cachedPointUiCss;
	const cssPath = join(dirname(fileURLToPath(import.meta.url)), "../../ui/point-ui.css");
	cachedPointUiCss = readFileSync(cssPath, "utf8");
	return cachedPointUiCss;
}

export function servePointUiCss(): Response {
	return new Response(readPointUiCss(), {
		headers: { "content-type": "text/css; charset=utf-8", "cache-control": "public, max-age=3600" },
	});
}
