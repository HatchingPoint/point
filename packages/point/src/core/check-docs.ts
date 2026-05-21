import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { PointCoreDiagnostic } from "./check.ts";
import { checkPointCore } from "./check.ts";
import { createModuleGraphForFile, loadCoreFile, programWithDependencyDeclarations } from "./cli.ts";
import { parsePointSource } from "./parser.ts";
import { readPointLock } from "./packages.ts";

const DEFAULT_DOCS_DIR = "docs/site";
const POINT_FENCE = /```point\r?\n([\s\S]*?)```/g;
const POINT_FILE_REF = /\b(?:[\w.-]+\/)*[\w.-]+\.point\b/g;

export interface DocsCheckItemResult {
	kind: "snippet" | "file";
	source: string;
	label: string;
	line?: number;
	ok: boolean;
	diagnostics: PointCoreDiagnostic[];
}

export interface DocsCheckResult {
	ok: boolean;
	checked: number;
	items: DocsCheckItemResult[];
}

export async function discoverDocsSiteMarkdown(docsDir = DEFAULT_DOCS_DIR, cwd = process.cwd()): Promise<string[]> {
	const root = resolve(cwd, docsDir);
	const glob = new Bun.Glob("**/*.md");
	const files: string[] = [];
	for await (const file of glob.scan({ cwd: root, onlyFiles: true })) {
		files.push(`${docsDir}/${file.replaceAll("\\", "/")}`);
	}
	return files.sort((a, b) => a.localeCompare(b));
}

export function extractPointSnippets(markdown: string, source: string): Array<{ label: string; code: string; line: number }> {
	const snippets: Array<{ label: string; code: string; line: number }> = [];
	let index = 0;
	for (const match of markdown.matchAll(POINT_FENCE)) {
		index += 1;
		const code = match[1]?.replace(/\s+$/, "") ?? "";
		const line = markdown.slice(0, match.index ?? 0).split(/\r?\n/).length;
		snippets.push({ label: `${source} snippet ${index}`, code, line });
	}
	return snippets;
}

export function extractPointFileReferences(markdown: string, markdownPath: string, cwd = process.cwd()): string[] {
	const references = new Set<string>();
	for (const match of markdown.matchAll(POINT_FILE_REF)) {
		const candidate = match[0]!;
		if (candidate.endsWith(".point")) references.add(candidate.replaceAll("\\", "/"));
	}
	const resolved: string[] = [];
	for (const reference of references) {
		const absolute = resolvePointFileReference(reference, markdownPath, cwd);
		if (absolute) resolved.push(absolute);
	}
	return resolved.sort((a, b) => a.localeCompare(b));
}

function resolvePointFileReference(reference: string, markdownPath: string, cwd: string): string | null {
	const candidates = [
		resolve(cwd, reference),
		resolve(cwd, dirname(markdownPath), reference),
	];
	for (const candidate of candidates) {
		if (!existsSync(candidate)) continue;
		return candidate.replace(resolve(cwd), "").replace(/^[/\\]/, "").replaceAll("\\", "/");
	}
	return null;
}

async function checkPointFile(source: string, filePath: string, label: string, markdownSource: string): Promise<DocsCheckItemResult> {
	try {
		const cwd = process.cwd();
		if (/^\s*use\s+/m.test(source)) {
			const lock = await readPointLock(cwd);
			const coreFile = await loadCoreFile(filePath, lock, cwd);
			const graph = await createModuleGraphForFile(coreFile, lock, cwd);
			const diagnostics = checkPointCore(programWithDependencyDeclarations(coreFile, graph));
			return { kind: "file", source: markdownSource, label, ok: diagnostics.length === 0, diagnostics };
		}
		const program = parsePointSource(source);
		const diagnostics = checkPointCore(program);
		return { kind: "file", source: markdownSource, label, ok: diagnostics.length === 0, diagnostics };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			kind: "file",
			source: markdownSource,
			label,
			ok: false,
			diagnostics: [
				{
					code: "parse-error",
					message,
					path: label,
					ref: `point://docs/${label}`,
					severity: "error",
					span: null,
					repair: "Fix the Point syntax in this docs snippet or referenced file.",
				},
			],
		};
	}
}

function checkPointSource(source: string, label: string, kind: "snippet" | "file", markdownSource: string, line?: number): DocsCheckItemResult {
	try {
		const program = parsePointSource(source);
		const diagnostics = checkPointCore(program);
		return { kind, source: markdownSource, label, line, ok: diagnostics.length === 0, diagnostics };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			kind,
			source: markdownSource,
			label,
			line,
			ok: false,
			diagnostics: [
				{
					code: "parse-error",
					message,
					path: label,
					ref: `point://docs/${label}`,
					severity: "error",
					span: null,
					repair: "Fix the Point syntax in this docs snippet or referenced file.",
				},
			],
		};
	}
}

export async function checkDocs(options: { docsDir?: string; cwd?: string } = {}): Promise<DocsCheckResult> {
	const docsDir = options.docsDir ?? DEFAULT_DOCS_DIR;
	const cwd = options.cwd ?? process.cwd();
	const markdownFiles = await discoverDocsSiteMarkdown(docsDir, cwd);
	const items: DocsCheckItemResult[] = [];
	const checkedFiles = new Set<string>();

	for (const markdownPath of markdownFiles) {
		const absoluteMarkdownPath = resolve(cwd, markdownPath);
		const markdown = await Bun.file(absoluteMarkdownPath).text();

		for (const snippet of extractPointSnippets(markdown, markdownPath)) {
			items.push(checkPointSource(snippet.code, snippet.label, "snippet", markdownPath, snippet.line));
		}

		for (const filePath of extractPointFileReferences(markdown, markdownPath, cwd)) {
			if (checkedFiles.has(filePath)) continue;
			checkedFiles.add(filePath);
			const source = await Bun.file(resolve(cwd, filePath)).text();
			items.push(await checkPointFile(source, filePath, filePath, markdownPath));
		}
	}

	return { ok: items.every((item) => item.ok), checked: items.length, items };
}

export async function runCheckDocs(options: { docsDir?: string; cwd?: string } = {}): Promise<DocsCheckResult> {
	const result = await checkDocs(options);
	if (result.ok) {
		const snippets = result.items.filter((item) => item.kind === "snippet").length;
		const files = result.items.filter((item) => item.kind === "file").length;
		console.log(`Point docs check passed: ${snippets} snippet(s), ${files} file reference(s)`);
		return result;
	}

	const failures = result.items.filter((item) => !item.ok);
	console.error(
		JSON.stringify(
			{
				ok: false,
				failures: failures.map((item) => ({
					kind: item.kind,
					source: item.source,
					label: item.label,
					line: item.line,
					diagnostics: item.diagnostics,
				})),
			},
			null,
			2,
		),
	);
	process.exit(1);
}
