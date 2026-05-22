import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PointCoreProgram } from "./ast.ts";
import { desugarSemanticProgram } from "../semantic/desugar.ts";
import type { PointSemanticDeclaration } from "../semantic/ast.ts";
import { scanUseDeclarations } from "../semantic/callables.ts";
import { parseSemanticSource, type ParseSemanticSourceOptions } from "../semantic/parse.ts";
import { modulePathFromLock, readPointLockSync } from "./packages.ts";
import { assertSemanticPointSource } from "./semantic-source.ts";

export { isSemanticPointSyntax } from "./semantic-source.ts";

function createUseSourceResolver(cwd: string): NonNullable<ParseSemanticSourceOptions["resolveUseSource"]> {
	const lock = readPointLockSync(cwd);
	return (use) => {
		try {
			const from = use.from ?? modulePathFromLock(lock, use.moduleName, cwd);
			const path = resolve(cwd, from);
			if (!existsSync(path)) return null;
			return readFileSync(path, "utf8");
		} catch {
			return null;
		}
	};
}

function collectDependencyDeclarations(
	source: string,
	resolveUseSource: NonNullable<ParseSemanticSourceOptions["resolveUseSource"]>,
	visited = new Set<string>(),
): PointSemanticDeclaration[] {
	const collected: PointSemanticDeclaration[] = [];
	for (const use of scanUseDeclarations(source)) {
		const key = use.from ?? use.moduleName;
		if (visited.has(key)) continue;
		visited.add(key);
		const dependencySource = resolveUseSource(use);
		if (!dependencySource) continue;
		collected.push(...collectDependencyDeclarations(dependencySource, resolveUseSource, visited));
		collected.push(...parseSemanticSource(dependencySource, { resolveUseSource }).declarations);
	}
	return collected;
}

export function parsePointSource(source: string, cwd = process.cwd()): PointCoreProgram {
	assertSemanticPointSource(source);
	const resolveUseSource = createUseSourceResolver(cwd);
	const semantic = parseSemanticSource(source, { resolveUseSource });
	return desugarSemanticProgram(semantic, {
		dependencyDeclarations: collectDependencyDeclarations(source, resolveUseSource),
	});
}
