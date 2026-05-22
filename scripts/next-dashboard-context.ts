import { measureAllPairedScaffoldCases, measurePairedScaffoldCase } from "./paired-scaffold-context.ts";

/** @deprecated Use measurePairedScaffoldCase("next-dashboard", caseId) */
export function measureNextDashboardCase(caseId: string) {
	return measurePairedScaffoldCase("next-dashboard", caseId);
}

/** @deprecated Use measureAllPairedScaffoldCases("next-dashboard") */
export function measureAllNextDashboardCases() {
	return measureAllPairedScaffoldCases("next-dashboard");
}

export {
	loadPairedScaffoldManifest as loadNextDashboardManifest,
	readScaffoldVariantFile as readVariantFile,
	measurePairedScaffoldCase,
	measureAllPairedScaffoldCases,
} from "./paired-scaffold-context.ts";

export type { PairedScaffoldManifest as NextDashboardManifest, PairedScaffoldMetrics as NextDashboardCaseMetrics } from "./paired-scaffold-types.ts";
