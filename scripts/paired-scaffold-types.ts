import type { AgentAppBenchmarkCase } from "./agent-app-benchmark.ts";

export type PairedScaffoldManifest = {
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

export type PairedScaffoldMetrics = {
	scaffold: string;
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

export function pairedScaffoldRef(testCase: AgentAppBenchmarkCase): { scaffold: string; caseId: string } | null {
	if (testCase.nextNotesCaseId) return { scaffold: "next-notes", caseId: testCase.nextNotesCaseId };
	if (testCase.nextOpsCaseId) return { scaffold: "next-ops-dashboard", caseId: testCase.nextOpsCaseId };
	if (testCase.nextDashboardCaseId) return { scaffold: "next-dashboard", caseId: testCase.nextDashboardCaseId };
	return null;
}
