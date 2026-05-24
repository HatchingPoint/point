import type {
	PointCoreProgram,
} from "./ast.ts";
import { desugarSemanticProgram } from "../semantic/desugar.ts";
import type { PointSemanticDeclaration } from "../semantic/ast.ts";
import { collectSemanticCallables, scanUseDeclarations } from "../semantic/callables.ts";
import { parseSemanticSource, type ParseSemanticSourceOptions } from "../semantic/parse.ts";
import { assertSemanticPointSource } from "./semantic-source.ts";
import {
	createUseSourceResolver,
	resolveUseDependencyInputPath,
	type UseReference,
} from "./module-resolve.ts";
import { dedupeSemanticDeclarations, filterDeclarationsReferencedIn } from "./use-merge.ts";

export { isSemanticPointSyntax } from "./semantic-source.ts";
export { createUseSourceResolver } from "./module-resolve.ts";

export interface ParsePointSourceOptions {
	cwd?: string;
	input?: string;
}

function normalizeParseOptions(cwdOrOptions: string | ParsePointSourceOptions = process.cwd()): Required<ParsePointSourceOptions> {
	if (typeof cwdOrOptions === "string") return { cwd: cwdOrOptions, input: "" };
	return { cwd: cwdOrOptions.cwd ?? process.cwd(), input: cwdOrOptions.input ?? "" };
}

export function createUseSourceResolverForInput(cwd: string, input?: string) {
	return createUseSourceResolver(cwd, input || undefined);
}

export function parseSemanticSourceWithUses(source: string, cwd = process.cwd(), input?: string) {
	const resolveUseSource = createUseSourceResolver(cwd, input || undefined);
	return parseSemanticSource(source, { resolveUseSource, inputPath: input || undefined });
}

function collectDependencyDeclarations(
	source: string,
	cwd: string,
	input: string | undefined,
	resolveUseSource: ReturnType<typeof createUseSourceResolver>,
	visited = new Set<string>(),
	fromInputPath?: string,
): PointSemanticDeclaration[] {
	const collected: PointSemanticDeclaration[] = [];
	for (const use of scanUseDeclarations(source)) {
		const key = `${fromInputPath ?? input ?? ""}:${use.from ?? use.moduleName}`;
		if (visited.has(key)) continue;
		visited.add(key);
		const dependencySource = resolveUseSource(use, fromInputPath ?? input);
		if (!dependencySource) continue;
		const dependencyInputPath = resolveUseDependencyInputPath(use, fromInputPath ?? input, cwd);
		const nested = collectDependencyDeclarations(dependencySource, cwd, dependencyInputPath, resolveUseSource, visited, dependencyInputPath);
		const dependencyProgram = parseSemanticSource(dependencySource, { resolveUseSource, inputPath: dependencyInputPath, cwd });
		const availableForThisDep = [...nested, ...dependencyProgram.declarations];
		collected.push(...filterDeclarationsReferencedIn(source, availableForThisDep));
	}
	return dedupeSemanticDeclarations(collected);
}

export function parsePointSource(source: string, cwdOrOptions: string | ParsePointSourceOptions = process.cwd()): PointCoreProgram {
	assertSemanticPointSource(source);
	const { cwd, input } = normalizeParseOptions(cwdOrOptions);
	const resolveUseSource = createUseSourceResolver(cwd, input || undefined);
	const semantic = parseSemanticSource(source, { resolveUseSource, inputPath: input || undefined, cwd });
	const program = desugarSemanticProgram(semantic, {
		dependencyDeclarations: collectDependencyDeclarations(source, cwd, input || undefined, resolveUseSource),
	});
	return {
		...program,
		semanticCallables: collectSemanticCallables(source, {
			resolveUseSource: (use, fromInputPath) => resolveUseSource(use, fromInputPath ?? (input || undefined)),
			inputPath: input || undefined,
			cwd,
		}).sort(),
	};
}

export function semanticCallablesForSource(source: string, options?: ParsePointSourceOptions): string[] {
	const { cwd, input } = normalizeParseOptions(options ?? {});
	const resolveUseSource = createUseSourceResolver(cwd, input || undefined);
	return collectSemanticCallables(source, {
		resolveUseSource: (use, fromInputPath) => resolveUseSource(use, fromInputPath ?? (input || undefined)),
		inputPath: input || undefined,
		cwd,
	});
}
