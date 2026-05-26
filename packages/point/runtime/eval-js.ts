import type { PointCoreProgram } from "../src/core/ast.ts";
import { emitPointCoreJavaScript } from "../src/core/emit-javascript.ts";
import { isPureLogicProgram } from "../src/core/emit-python.ts";

/** Pure logic with no imports or externals can run in-memory without a temp module file. */
export function canBundleRunInMemory(program: PointCoreProgram): boolean {
	if (!isPureLogicProgram(program)) return false;
	if (program.declarations.some((declaration) => declaration.kind === "import" || declaration.kind === "external")) return false;
	if (program.semanticSource?.uses?.length) return false;
	const emitted = emitPointCoreJavaScript(program);
	if (/^\s*import\s/m.test(emitted)) return false;
	return !hasUnresolvedCallTargets(emitted);
}

const BUILTIN_CALL_TARGETS = new Set([
	"Array",
	"Boolean",
	"JSON",
	"Math",
	"Number",
	"Object",
	"Promise",
	"String",
	"console",
	"fetch",
	"parseInt",
	"parseFloat",
]);

const NON_CALL_KEYWORDS = new Set([
	"async",
	"await",
	"catch",
	"delete",
	"export",
	"for",
	"function",
	"if",
	"import",
	"instanceof",
	"new",
	"return",
	"switch",
	"throw",
	"typeof",
	"void",
	"while",
	"with",
	"yield",
]);

function hasUnresolvedCallTargets(source: string): boolean {
	const defined = new Set<string>();
	for (const match of source.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) defined.add(match[1]!);
	for (const match of source.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
		const name = match[1]!;
		if (NON_CALL_KEYWORDS.has(name) || BUILTIN_CALL_TARGETS.has(name) || defined.has(name)) continue;
		return true;
	}
	return false;
}

export function bundleJavaScriptForEval(source: string): { body: string; exports: string[] } {
	const exports: string[] = [];
	const bodyLines: string[] = [];
	for (const line of source.split(/\r?\n/)) {
		if (/^\s*import\s/.test(line)) continue;
		const fnMatch = line.match(/^export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/);
		if (fnMatch) {
			exports.push(fnMatch[2]!);
			bodyLines.push(line.replace(/^export\s+/, ""));
			continue;
		}
		const bindingMatch = line.match(/^export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)/);
		if (bindingMatch) {
			exports.push(bindingMatch[2]!);
			bodyLines.push(line.replace(/^export\s+/, ""));
			continue;
		}
		bodyLines.push(line);
	}
	return { body: bodyLines.join("\n"), exports };
}

export async function executeBundledEntry(program: PointCoreProgram, entryName: string): Promise<unknown> {
	const { body, exports } = bundleJavaScriptForEval(emitPointCoreJavaScript(program));
	if (!exports.includes(entryName)) throw new Error(`Entrypoint ${entryName} was not emitted.`);
	const factory = new Function(`"use strict";\n${body}\nreturn { ${exports.join(", ")} };`);
	const mod = factory() as Record<string, unknown>;
	const entry = mod[entryName];
	if (typeof entry !== "function") throw new Error(`Entrypoint ${entryName} was not a function.`);
	return await (entry as () => unknown)();
}
