import type { PointCoreProgram } from "./ast.ts";
import type { PointSemanticGuardDeclaration } from "../semantic/ast.ts";
import { guardPatternsConstName } from "../semantic/naming.ts";

export function programHasGuards(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some((declaration) => declaration.kind === "guard");
}

export function programUsesGuardChecks(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some((declaration) => {
		if (declaration.kind !== "pipeline" && declaration.kind !== "workflow") return false;
		return declaration.body.some(
			(statement) => statement.kind === "step" && Boolean(statement.options?.fileScopeGuard),
		);
	});
}

export function emitPointGuardHelpers(program: PointCoreProgram): string[] {
	const source = program.semanticSource;
	if (!source) return [];
	const guards = source.declarations.filter(
		(declaration): declaration is PointSemanticGuardDeclaration => declaration.kind === "guard",
	);
	if (guards.length === 0 && !programUsesGuardChecks(program)) return [];

	const lines: string[] = [];
	for (const guard of guards) {
		lines.push(`const ${guardPatternsConstName(guard.name)} = ${JSON.stringify(guard.patterns)} as const;`);
	}
	if (lines.length > 0) lines.push("");
	lines.push(...emitGuardRuntimeHelpers());
	return lines;
}

function emitGuardRuntimeHelpers(): string[] {
	return [
		"function pointGlobMatch(path: string, pattern: string): boolean {",
		'  const normalized = pattern.replace(/\\\\/g, "/");',
		'  if (normalized.endsWith("/**")) {',
		"    const prefix = normalized.slice(0, -3);",
		'    return path === prefix || path.startsWith(prefix + "/");',
		"  }",
		'  if (normalized.includes("*")) {',
		"    const regexSource = normalized",
		'      .replace(/[+?^${}()|[\\]\\\\]/g, "\\\\$&")',
		'      .replace(/\\*\\*/g, "§§")',
		'      .replace(/\\*/g, "[^/]*")',
		'      .replace(/§§/g, ".*");',
		"    return new RegExp(`^${regexSource}$`).test(path);",
		"  }",
		'  return path === normalized || path.startsWith(normalized + "/");',
		"}",
		"",
		"function pointGuardPathAllowed(path: unknown, patterns: readonly string[]): boolean {",
		'  if (typeof path !== "string") return false;',
		'  const normalized = path.replace(/\\\\/g, "/");',
		"  return patterns.some((pattern) => pointGlobMatch(normalized, pattern));",
		"}",
		"",
	];
}
