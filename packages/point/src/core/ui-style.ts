import type { PointSemanticThemeDeclaration } from "../semantic/ast.ts";

export const POINT_STYLE_MODIFIERS = [
	"emphasized",
	"muted",
	"danger",
	"success",
	"large",
	"small",
	"compact",
	"padded",
	"centered",
	"card",
	"stack",
	"badge",
	"panel",
	"spaced",
] as const;

export type PointStyleModifier = (typeof POINT_STYLE_MODIFIERS)[number];

export const POINT_THEME_ACCENTS = ["indigo", "emerald", "rose", "slate"] as const;
export const POINT_THEME_DENSITIES = ["compact", "comfortable"] as const;
export const POINT_THEME_RADII = ["soft", "medium", "sharp"] as const;

export type PointThemeAccent = (typeof POINT_THEME_ACCENTS)[number];
export type PointThemeDensity = (typeof POINT_THEME_DENSITIES)[number];
export type PointThemeRadius = (typeof POINT_THEME_RADII)[number];

const POINT_STYLE_MODIFIER_SET = new Set<string>(POINT_STYLE_MODIFIERS);
const POINT_THEME_ACCENT_SET = new Set<string>(POINT_THEME_ACCENTS);
const POINT_THEME_DENSITY_SET = new Set<string>(POINT_THEME_DENSITIES);
const POINT_THEME_RADIUS_SET = new Set<string>(POINT_THEME_RADII);

export function isPointStyleModifier(token: string): token is PointStyleModifier {
	return POINT_STYLE_MODIFIER_SET.has(token);
}

export function isPointThemeAccent(token: string): token is PointThemeAccent {
	return POINT_THEME_ACCENT_SET.has(token);
}

export function isPointThemeDensity(token: string): token is PointThemeDensity {
	return POINT_THEME_DENSITY_SET.has(token);
}

export function isPointThemeRadius(token: string): token is PointThemeRadius {
	return POINT_THEME_RADIUS_SET.has(token);
}

export function styleModifiersToClassNames(modifiers: readonly string[]): string[] {
	return modifiers.map((modifier) => `point-style-${modifier}`);
}

export function resolveViewWrapperClassName(className?: string, style?: readonly string[]): string | undefined {
	const parts = [...styleModifiersToClassNames(style ?? []), ...(className ? [className] : [])];
	return parts.length > 0 ? parts.join(" ") : undefined;
}

export function parseStylePrefix(rest: string): { style: string[]; remainder: string } {
	const style: string[] = [];
	let remaining = rest.trim();
	while (remaining) {
		const wordMatch = remaining.match(/^([a-z]+)(?:\s+|$)/);
		if (!wordMatch) break;
		const token = wordMatch[1] ?? "";
		if (!isPointStyleModifier(token)) break;
		style.push(token);
		remaining = remaining.slice(wordMatch[0].length).trimStart();
	}
	return { style, remainder: remaining };
}

export function formatStyleModifierList(modifiers: readonly string[]): string {
	return modifiers.join(", ");
}

export function themePresetClassNames(theme: PointSemanticThemeDeclaration): string {
	const parts = ["point-app"];
	if (theme.accent) parts.push(`point-theme-accent-${theme.accent}`);
	if (theme.density) parts.push(`point-theme-density-${theme.density}`);
	if (theme.radius) parts.push(`point-theme-radius-${theme.radius}`);
	return parts.join(" ");
}

export function findThemeDeclaration(
	declarations: Array<{ kind: string } & Partial<PointSemanticThemeDeclaration>>,
): PointSemanticThemeDeclaration | undefined {
	return declarations.find((declaration): declaration is PointSemanticThemeDeclaration => declaration.kind === "theme");
}

export function themeToggleEnabled(theme: PointSemanticThemeDeclaration | undefined): boolean {
	return theme?.toggle === true;
}
