export function toPascalCase(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join("");
}

export function toIdentifier(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word, index) => (index === 0 ? word.toLowerCase() : toPascalCase(word))).join("");
}

export function guardPatternsConstName(guardName: string): string {
	return `${toIdentifier(guardName)}GuardPatterns`;
}

export function semanticFunctionName(
	label: string,
	outputName: string,
	kind: "calculation" | "rule" | "label" | "action" | "policy" | "view" | "layout" | "page" | "middleware" | "route" | "streamRoute" | "workflow" | "pipeline" | "session" | "command",
): string {
	const base = toIdentifier(label);
	const suffix =
		kind === "label"
			? "Label"
			: kind === "policy"
				? "Policy"
				: kind === "view"
					? "View"
					: kind === "layout"
						? "Layout"
					: kind === "page"
						? "Page"
						: kind === "route"
							? "Route"
							: kind === "streamRoute"
								? "StreamRoute"
							: kind === "middleware"
								? "Middleware"
								: kind === "workflow"
							? "Workflow"
							: kind === "pipeline"
								? "Pipeline"
							: kind === "session"
								? "Session"
							: kind === "command"
								? "Command"
								: toPascalCase(outputName);
	if (!suffix) return base;
	return base.toLowerCase().endsWith(suffix.toLowerCase()) ? base : `${base}${suffix}`;
}

export function streamRouteHandlerName(routeName: string, event: "connect" | "message" | "disconnect"): string {
	const base = semanticFunctionName(routeName, "stream", "streamRoute");
	if (event === "connect") return `${base}Connect`;
	if (event === "message") return `${base}Message`;
	return `${base}Disconnect`;
}

export function sseRouteHandlerName(routeName: string, event: "connect" | "disconnect"): string {
	const base = semanticFunctionName(routeName, "sse", "sseRoute");
	if (event === "connect") return `${base}Connect`;
	return `${base}Disconnect`;
}
