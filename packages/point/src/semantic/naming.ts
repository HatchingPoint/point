export function toPascalCase(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join("");
}

export function toIdentifier(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word, index) => (index === 0 ? word.toLowerCase() : toPascalCase(word))).join("");
}

export function semanticFunctionName(
	label: string,
	outputName: string,
	kind: "calculation" | "rule" | "label" | "action" | "policy" | "view" | "page" | "route" | "workflow" | "command",
): string {
	const base = toIdentifier(label);
	const suffix =
		kind === "label"
			? "Label"
			: kind === "policy"
				? "Policy"
				: kind === "view"
					? "View"
					: kind === "page"
						? "Page"
						: kind === "route"
						? "Route"
						: kind === "workflow"
							? "Workflow"
							: kind === "command"
								? "Command"
								: toPascalCase(outputName);
	if (!suffix) return base;
	return base.toLowerCase().endsWith(suffix.toLowerCase()) ? base : `${base}${suffix}`;
}
