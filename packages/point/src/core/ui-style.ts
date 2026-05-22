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
] as const;

export type PointStyleModifier = (typeof POINT_STYLE_MODIFIERS)[number];

const POINT_STYLE_MODIFIER_SET = new Set<string>(POINT_STYLE_MODIFIERS);

export function isPointStyleModifier(token: string): token is PointStyleModifier {
	return POINT_STYLE_MODIFIER_SET.has(token);
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
