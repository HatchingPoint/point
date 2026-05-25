import { normalizeUseModuleName, parseCapabilityNamesFromLine, isCapabilitiesLine } from "../core/capabilities.ts";
import { resolveUseDependencyInputPath } from "../core/module-resolve.ts";

const CALLABLE_KEYWORDS = [
	"calculation",
	"rule",
	"label",
	"action",
	"view",
	"layout",
	"page",
	"middleware",
	"route",
	"workflow",
	"pipeline",
	"command",
] as const;

const USE_DECLARATION = /^use\s+([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*)(?:\s+from\s+"([^"]+)")?$/;

export interface CollectSemanticCallablesOptions {
	resolveUseSource?: (use: { moduleName: string; from?: string }, fromInputPath?: string) => string | null | undefined;
	inputPath?: string;
	cwd?: string;
	visited?: Set<string>;
}

export function collectSemanticCallables(source: string, options?: CollectSemanticCallablesOptions): string[] {
	const callables = new Set(collectSemanticCallablesFromSource(source));
	const resolveUseSource = options?.resolveUseSource;
	if (!resolveUseSource) return [...callables];
	const visited = options?.visited ?? new Set<string>();
	const inputPath = options?.inputPath;
	const cwd = options?.cwd ?? process.cwd();
	for (const use of scanUseDeclarations(source)) {
		const dependencyInputPath = resolveUseDependencyInputPath(use, inputPath, cwd);
		const key = dependencyInputPath ?? `${inputPath ?? ""}:${use.from ?? use.moduleName}`;
		if (visited.has(key)) continue;
		visited.add(key);
		const dependencySource = resolveUseSource(use, inputPath);
		if (!dependencySource) continue;
		for (const callable of collectSemanticCallables(dependencySource, {
			resolveUseSource,
			visited,
			inputPath: dependencyInputPath,
			cwd,
		})) {
			callables.add(callable);
		}
	}
	return [...callables];
}

function collectSemanticCallablesFromSource(source: string): string[] {
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

export function scanUseDeclarations(source: string): Array<{ moduleName: string; from?: string }> {
	const uses: Array<{ moduleName: string; from?: string }> = [];
	for (const line of source.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (isCapabilitiesLine(trimmed)) {
			for (const name of parseCapabilityNamesFromLine(trimmed)) {
				uses.push({ moduleName: normalizeUseModuleName(name) });
			}
			continue;
		}
		const match = trimmed.match(USE_DECLARATION);
		if (!match) continue;
		const from = match[2];
		const moduleName = normalizeUseModuleName(match[1] ?? "", from);
		uses.push({ moduleName, from });
	}
	return uses;
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
	return /^(module|use|record|variant|calculation|rule|label|external|action|policy|guard|view|layout|navigation|page|middleware|stream route|sse route|route|workflow|pipeline|session|command|schedule)\s+/.test(line);
}
