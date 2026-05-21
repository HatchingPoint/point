export function isSemanticPointSyntax(source: string): boolean {
	return source
		.split(/\r?\n/)
		.some((line) => /^(use|record|calculation|rule|label|external|action|policy|view|page|route|workflow|command)\s+/.test(line.trim()));
}

export function assertSemanticPointSource(source: string) {
	const oldStyleTopLevel = /^(import|type|let|var|fn)\s+/;
	const lines = source.split(/\r?\n/);
	let hasSemanticDeclaration = false;

	for (const [index, line] of lines.entries()) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("//")) continue;
		if (/^(record|calculation|rule|label|external|action|policy|view|page|route|workflow|command)\s+/.test(trimmed)) hasSemanticDeclaration = true;
		if (oldStyleTopLevel.test(trimmed)) {
			throw new Error(
				`Point source uses internal core syntax at ${index + 1}:1. Use record, calculation, rule, or label instead.`,
			);
		}
	}

	if (!hasSemanticDeclaration) {
		throw new Error("Point source must contain at least one semantic declaration: record, calculation, rule, or label.");
	}
}
