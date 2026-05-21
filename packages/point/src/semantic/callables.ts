const CALLABLE_KEYWORDS = [
	"calculation",
	"rule",
	"label",
	"action",
	"view",
	"page",
	"route",
	"workflow",
	"command",
] as const;

export function collectSemanticCallables(source: string): string[] {
	const callables = new Set<string>();
	const lines = source.split(/\r?\n/);
	let index = 0;
	while (index < lines.length) {
		const trimmed = (lines[index] ?? "").trim();
		if (trimmed.startsWith("external ")) {
			const body = collectBody(lines, index + 1);
			for (const line of body.lines) {
				const match = line.match(/^(.+)\(/);
				if (match) callables.add(match[1]?.trim() ?? "");
			}
			index = body.next;
			continue;
		}
		for (const keyword of CALLABLE_KEYWORDS) {
			if (trimmed.startsWith(`${keyword} `)) {
				callables.add(trimmed.slice(keyword.length + 1).trim());
			}
		}
		index += 1;
	}
	return [...callables];
}

function collectBody(lines: string[], start: number): { lines: string[]; next: number } {
	const body: string[] = [];
	let index = start;
	for (; index < lines.length; index += 1) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed) continue;
		if (isTopLevel(trimmed)) break;
		body.push(trimmed);
	}
	return { lines: body, next: index };
}

function isTopLevel(line: string): boolean {
	return /^(module|use|record|calculation|rule|label|external|action|policy|view|page|route|workflow|command)\s+/.test(line);
}
