import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import {
	applyLineRepairFromGolden,
	estimateTokens,
	runCheckJson,
	serializeCheckJson,
} from "./agent-repair-sufficiency.ts";
import { measurePairedScaffoldCase } from "./paired-scaffold-context.ts";
import { pairedScaffoldRef } from "./paired-scaffold-types.ts";

export type AgentAppTaskCategory = "feature-add" | "refactor" | "app-repair";

export type AgentAppTypescriptContext = {
	excerpt: string;
	totalChars: number;
	taskDescription: string;
	/** Measured from benchmarks/next-dashboard/ when nextDashboardCaseId is set. */
	measuredTokens?: number;
	measuredChars?: number;
	measuredVariant?: string;
	filesMissing?: string[];
};

export type AgentAppBenchmarkCase = {
	id: string;
	title: string;
	category: AgentAppTaskCategory;
	/** What the user asked a coding agent to do on a real multi-block app. */
	agentTask: string;
	baseFile: string;
	brokenFile: string;
	goldenFile: string;
	/** First diagnostic code the broken state should surface for the agent loop. */
	expectedCode: string;
	requiredDeclarations: string[];
	requiredNavPaths: string[];
	sourceExample: string;
	/** Paired Next.js scaffold under benchmarks/next-dashboard/ */
	nextDashboardCaseId?: string;
	/** Paired Next.js scaffold under benchmarks/next-notes/ */
	nextNotesCaseId?: string;
	typescriptContext: AgentAppTypescriptContext;
};

export type AgentAppBenchmarkResult = {
	id: string;
	passed: boolean;
	baseLines: number;
	goldenLines: number;
	deltaLines: number;
	brokenCheckJsonTokens: number;
	brokenCheckJsonChars: number;
	tsContextTokens: number;
	tsContextSource: "measured" | "heuristic";
	tsHeuristicTokens: number;
	tokenReductionPercent: number;
	goldenCheckPasses: boolean;
	brokenHasExpectedDiagnostic: boolean;
	structuralChecksPass: boolean;
};

const FIXTURES_DIR = join(import.meta.dir, "../tests/fixtures/agent-app");

export const AGENT_APP_BENCHMARK_CASES: AgentAppBenchmarkCase[] = [
	{
		id: "dashboard-add-search",
		title: "Dashboard — add search page",
		category: "feature-add",
		agentTask:
			"Add a /search page to the existing dashboard app: nav link, search action, search view with load data, and page wired into navigation.",
		baseFile: "dashboard-add-search/base.point",
		brokenFile: "dashboard-add-search/broken.point",
		goldenFile: "dashboard-add-search/golden.point",
		expectedCode: "unknown-load-action",
		requiredDeclarations: ["view search panel", "action search items", "page search page"],
		requiredNavPaths: ["/search"],
		sourceExample: "examples/app/dashboard/dashboard.point",
		nextDashboardCaseId: "dashboard-add-search",
		typescriptContext: {
			taskDescription:
				"Add a Search page to an existing Next.js admin app with sidebar nav, items list, and settings — new route, page component, data loader, and nav link.",
			totalChars: 22000,
			excerpt: "",
		},
	},
	{
		id: "dashboard-search-wiring",
		title: "Dashboard — wire search action",
		category: "app-repair",
		agentTask:
			"Fix the search panel wiring in a 100-line dashboard app — the page and nav exist but the view loads the wrong action name.",
		baseFile: "dashboard-add-search/golden.point",
		brokenFile: "dashboard-search-wiring/broken.point",
		goldenFile: "dashboard-add-search/golden.point",
		expectedCode: "unknown-load-action",
		requiredDeclarations: ["action search items", "view search panel", "page search page"],
		requiredNavPaths: ["/search"],
		sourceExample: "examples/app/dashboard/dashboard.point",
		nextDashboardCaseId: "dashboard-search-wiring",
		typescriptContext: {
			taskDescription:
				"Fix a SearchPage component that calls the wrong loader function in a Next.js admin app with sidebar, items CRUD, and settings.",
			totalChars: 24000,
			excerpt: "",
		},
	},
	{
		id: "notes-add-detail",
		title: "Notes — add detail page",
		category: "feature-add",
		agentTask:
			"Add a /notes/:id detail page to the notes app: get-note action, detail view, list links, and route wired into navigation.",
		baseFile: "notes-add-detail/base.point",
		brokenFile: "notes-add-detail/broken.point",
		goldenFile: "notes-add-detail/golden.point",
		expectedCode: "unknown-load-action",
		requiredDeclarations: ["action get note", "view note detail", "page note detail page"],
		requiredNavPaths: ["/notes/:id"],
		sourceExample: "examples/app/notes/notes.point",
		nextNotesCaseId: "notes-add-detail",
		typescriptContext: {
			taskDescription:
				"Add a note detail route to a Next.js notes app with list, create form, and sidebar nav — new dynamic route, loader, and list links.",
			totalChars: 18000,
			excerpt: "",
		},
	},
	{
		id: "dashboard-rename-products",
		title: "Dashboard — rename items to products",
		category: "refactor",
		agentTask:
			"Rename the dashboard items surface to products across actions, views, pages, and navigation — the agent updated nav and action names but left stale view wiring.",
		baseFile: "dashboard-rename-products/base.point",
		brokenFile: "dashboard-rename-products/broken.point",
		goldenFile: "dashboard-rename-products/golden.point",
		expectedCode: "unknown-load-action",
		requiredDeclarations: ["action list products", "view products list", "page products list page"],
		requiredNavPaths: ["/products"],
		sourceExample: "examples/app/dashboard/dashboard.point",
		nextDashboardCaseId: "dashboard-rename-products",
		typescriptContext: {
			taskDescription:
				"Finish renaming an admin Items area to Products in a Next.js app — update list component imports, loader names, and page wiring.",
			totalChars: 20000,
			excerpt: "",
		},
	},
];

export function loadAppFixture(relativePath: string): string {
	return readFileSync(join(FIXTURES_DIR, relativePath), "utf8");
}

export function countSourceLines(source: string): number {
	return source.split("\n").length;
}

export function sourceContainsDeclaration(source: string, declaration: string): boolean {
	const lines = source.split("\n");
	return lines.some((line) => line.trimStart().startsWith(declaration));
}

export function sourceContainsNavPath(source: string, path: string): boolean {
	return source.includes(`path "${path}"`) || source.includes(`to "${path}"`);
}

export function resolveTypescriptContext(testCase: AgentAppBenchmarkCase): {
	tokens: number;
	chars: number;
	source: "measured" | "heuristic";
	excerpt: string;
	heuristicTokens: number;
	filesMissing: string[];
} {
	const heuristicTokens = estimateTokens("x".repeat(testCase.typescriptContext.totalChars));
	const scaffoldRef = pairedScaffoldRef(testCase);
	if (scaffoldRef) {
		const measured = measurePairedScaffoldCase(scaffoldRef.scaffold, scaffoldRef.caseId);
		return {
			tokens: measured.brokenContextTokens,
			chars: measured.brokenContextChars,
			source: "measured",
			excerpt: measured.brokenExcerpt,
			heuristicTokens,
			filesMissing: measured.filesMissing,
		};
	}
	return {
		tokens: heuristicTokens,
		chars: testCase.typescriptContext.totalChars,
		source: "heuristic",
		excerpt: testCase.typescriptContext.excerpt,
		heuristicTokens,
		filesMissing: [],
	};
}

export function evaluateStructuralChecks(testCase: AgentAppBenchmarkCase, goldenSource: string): boolean {
	const declarationsOk = testCase.requiredDeclarations.every((declaration) =>
		sourceContainsDeclaration(goldenSource, declaration),
	);
	const navOk = testCase.requiredNavPaths.every((path) => sourceContainsNavPath(goldenSource, path));
	return declarationsOk && navOk;
}

export function evaluateAgentAppCase(testCase: AgentAppBenchmarkCase): AgentAppBenchmarkResult {
	const baseSource = loadAppFixture(testCase.baseFile);
	const brokenSource = loadAppFixture(testCase.brokenFile);
	const goldenSource = loadAppFixture(testCase.goldenFile);
	const brokenPayload = runCheckJson(brokenSource);
	const brokenDiagnostic = brokenPayload.diagnostics[0];
	const brokenContext = brokenDiagnostic
		? serializeCheckJson({ schemaVersion: brokenPayload.schemaVersion, ok: false, diagnostics: [brokenDiagnostic] })
		: "";
	const brokenCheckJsonTokens = estimateTokens(brokenContext);
	const typescriptContext = resolveTypescriptContext(testCase);
	const tsContextTokens = typescriptContext.tokens;
	const tokenReductionPercent =
		tsContextTokens > 0 ? Math.round((1 - brokenCheckJsonTokens / tsContextTokens) * 100) : 0;
	const goldenCheckPasses = checkPointCore(parsePointSource(goldenSource)).length === 0;
	const brokenHasExpectedDiagnostic = brokenPayload.diagnostics.some((item) => item.code === testCase.expectedCode);
	const structuralChecksPass = evaluateStructuralChecks(testCase, goldenSource);
	const baseLines = countSourceLines(baseSource);
	const goldenLines = countSourceLines(goldenSource);
	const growthOk = testCase.category === "feature-add" ? goldenLines > baseLines : true;

	return {
		id: testCase.id,
		passed: goldenCheckPasses && brokenHasExpectedDiagnostic && structuralChecksPass && growthOk,
		baseLines,
		goldenLines,
		deltaLines: goldenLines - baseLines,
		brokenCheckJsonTokens,
		brokenCheckJsonChars: brokenContext.length,
		tsContextTokens,
		tsContextSource: typescriptContext.source,
		tsHeuristicTokens: typescriptContext.heuristicTokens,
		tokenReductionPercent,
		goldenCheckPasses,
		brokenHasExpectedDiagnostic,
		structuralChecksPass,
	};
}

/** Simulate agent loop: check-json on broken app → apply golden blocks via line repair until pass. */
export function simulateAppRepairFromGolden(testCase: AgentAppBenchmarkCase, maxSteps = 12): {
	stepsApplied: number;
	checkPasses: boolean;
	codes: string[];
} {
	let source = loadAppFixture(testCase.brokenFile);
	const goldenSource = loadAppFixture(testCase.goldenFile);
	const codes: string[] = [];
	for (let step = 0; step < maxSteps; step++) {
		const payload = runCheckJson(source);
		if (payload.ok) break;
		const diagnostic = payload.diagnostics[0];
		if (!diagnostic?.span) break;
		codes.push(diagnostic.code);
		source = applyLineRepairFromGolden(source, goldenSource, diagnostic);
	}
	return {
		stepsApplied: codes.length,
		checkPasses: checkPointCore(parsePointSource(source)).length === 0,
		codes,
	};
}

export function runAgentAppBenchmark(): AgentAppBenchmarkResult[] {
	return AGENT_APP_BENCHMARK_CASES.map(evaluateAgentAppCase);
}

export function summarizeAppTokenReduction(cases: AgentAppBenchmarkCase[] = AGENT_APP_BENCHMARK_CASES): {
	minReductionPercent: number;
	maxReductionPercent: number;
	avgReductionPercent: number;
} {
	const reductions = cases.map((testCase) => evaluateAgentAppCase(testCase).tokenReductionPercent);
	return {
		minReductionPercent: Math.min(...reductions),
		maxReductionPercent: Math.max(...reductions),
		avgReductionPercent: Math.round(reductions.reduce((sum, value) => sum + value, 0) / reductions.length),
	};
}
