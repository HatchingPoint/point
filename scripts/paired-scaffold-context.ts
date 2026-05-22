import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { estimateTokens } from "./agent-repair-sufficiency.ts";
import type { PairedScaffoldManifest, PairedScaffoldMetrics } from "./paired-scaffold-types.ts";

const REPO_ROOT = join(import.meta.dir, "..");

export function scaffoldDir(scaffold: string): string {
	return join(REPO_ROOT, "benchmarks", scaffold);
}

export function loadPairedScaffoldManifest(scaffold: string): PairedScaffoldManifest {
	return JSON.parse(readFileSync(join(scaffoldDir(scaffold), "manifest.json"), "utf8")) as PairedScaffoldManifest;
}

export function readScaffoldVariantFile(scaffold: string, variant: string, relativePath: string): string | null {
	const absolute = join(scaffoldDir(scaffold), variant, relativePath);
	if (!existsSync(absolute)) return null;
	return readFileSync(absolute, "utf8");
}

export function buildScaffoldContextBundle(
	scaffold: string,
	variant: string,
	relativePaths: string[],
): {
	text: string;
	totalChars: number;
	filesIncluded: string[];
	filesMissing: string[];
} {
	const filesIncluded: string[] = [];
	const filesMissing: string[] = [];
	const sections: string[] = [];
	for (const relativePath of relativePaths) {
		const source = readScaffoldVariantFile(scaffold, variant, relativePath);
		if (source === null) {
			filesMissing.push(relativePath);
			continue;
		}
		filesIncluded.push(relativePath);
		sections.push(`// ${relativePath}\n${source.trim()}\n`);
	}
	const text = sections.join("\n");
	return { text, totalChars: text.length, filesIncluded, filesMissing };
}

export function measurePairedScaffoldCase(scaffold: string, caseId: string): PairedScaffoldMetrics {
	const manifest = loadPairedScaffoldManifest(scaffold);
	const mapping = manifest.caseMapping[caseId];
	if (!mapping) throw new Error(`Unknown ${scaffold} case: ${caseId}`);
	const brokenVariant = manifest.variants[mapping.brokenVariant] ?? mapping.brokenVariant;
	const goldenVariant = manifest.variants[mapping.goldenVariant] ?? mapping.goldenVariant;
	const baseVariant = manifest.variants[mapping.baseVariant] ?? mapping.baseVariant;
	const brokenBundle = buildScaffoldContextBundle(scaffold, brokenVariant, mapping.agentContextFiles);
	const goldenBundle = buildScaffoldContextBundle(scaffold, goldenVariant, mapping.agentContextFiles);
	const baseBundle = buildScaffoldContextBundle(scaffold, baseVariant, mapping.agentContextFiles);
	return {
		scaffold,
		caseId,
		brokenVariant,
		goldenVariant,
		brokenContextChars: brokenBundle.totalChars,
		brokenContextTokens: estimateTokens(brokenBundle.text),
		goldenContextChars: goldenBundle.totalChars,
		goldenContextTokens: estimateTokens(goldenBundle.text),
		baseContextChars: baseBundle.totalChars,
		baseContextTokens: estimateTokens(baseBundle.text),
		filesIncluded: brokenBundle.filesIncluded,
		filesMissing: brokenBundle.filesMissing,
		brokenExcerpt: brokenBundle.text.slice(0, 1200),
	};
}

export function measureAllPairedScaffoldCases(scaffold: string): PairedScaffoldMetrics[] {
	const manifest = loadPairedScaffoldManifest(scaffold);
	return Object.keys(manifest.caseMapping).map((caseId) => measurePairedScaffoldCase(scaffold, caseId));
}
