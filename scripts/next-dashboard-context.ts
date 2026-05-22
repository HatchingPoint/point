import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { estimateTokens } from "./agent-repair-sufficiency.ts";

export type NextDashboardManifest = {
	title: string;
	description: string;
	variants: Record<string, string>;
	caseMapping: Record<
		string,
		{
			baseVariant: string;
			brokenVariant: string;
			goldenVariant: string;
			agentContextFiles: string[];
		}
	>;
};

const NEXT_DASHBOARD_DIR = join(import.meta.dir, "../benchmarks/next-dashboard");
const MANIFEST_PATH = join(NEXT_DASHBOARD_DIR, "manifest.json");

export function loadNextDashboardManifest(): NextDashboardManifest {
	return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as NextDashboardManifest;
}

export function listVariantSourceFiles(variantDir: string): string[] {
	const files: string[] = [];
	const walk = (directory: string, prefix = "") => {
		for (const entry of readdirSync(directory)) {
			const absolute = join(directory, entry);
			const relative = prefix ? `${prefix}/${entry}` : entry;
			if (statSync(absolute).isDirectory()) {
				walk(absolute, relative);
				continue;
			}
			if (/\.(tsx?|jsx?)$/.test(entry)) files.push(relative);
		}
	};
	walk(variantDir);
	return files.sort();
}

export function readVariantFile(variant: string, relativePath: string): string | null {
	const absolute = join(NEXT_DASHBOARD_DIR, variant, relativePath);
	if (!existsSync(absolute)) return null;
	return readFileSync(absolute, "utf8");
}

export function buildAgentContextBundle(variant: string, relativePaths: string[]): {
	text: string;
	totalChars: number;
	filesIncluded: string[];
	filesMissing: string[];
} {
	const filesIncluded: string[] = [];
	const filesMissing: string[] = [];
	const sections: string[] = [];
	for (const relativePath of relativePaths) {
		const source = readVariantFile(variant, relativePath);
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

export type NextDashboardCaseMetrics = {
	caseId: string;
	brokenVariant: string;
	goldenVariant: string;
	brokenContextChars: number;
	brokenContextTokens: number;
	goldenContextChars: number;
	goldenContextTokens: number;
	baseContextChars: number;
	baseContextTokens: number;
	filesIncluded: string[];
	filesMissing: string[];
	brokenExcerpt: string;
};

export function measureNextDashboardCase(caseId: string): NextDashboardCaseMetrics {
	const manifest = loadNextDashboardManifest();
	const mapping = manifest.caseMapping[caseId];
	if (!mapping) throw new Error(`Unknown next-dashboard case: ${caseId}`);
	const brokenVariant = manifest.variants[mapping.brokenVariant] ?? mapping.brokenVariant;
	const goldenVariant = manifest.variants[mapping.goldenVariant] ?? mapping.goldenVariant;
	const baseVariant = manifest.variants[mapping.baseVariant] ?? mapping.baseVariant;
	const brokenBundle = buildAgentContextBundle(brokenVariant, mapping.agentContextFiles);
	const goldenBundle = buildAgentContextBundle(goldenVariant, mapping.agentContextFiles);
	const baseBundle = buildAgentContextBundle(baseVariant, mapping.agentContextFiles);
	return {
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

export function measureAllNextDashboardCases(): NextDashboardCaseMetrics[] {
	const manifest = loadNextDashboardManifest();
	return Object.keys(manifest.caseMapping).map(measureNextDashboardCase);
}
