import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PointCoreDiagnostic } from "../packages/point/src/core/check.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

export type AgentRepairTypescriptContext = {
	excerpt: string;
	totalChars: number;
	tscError: string;
};

export type AgentRepairCaseCategory = "typo-fix" | "feature-build";

export type AgentRepairRepairMode = "single-shot" | "repair-plan";

export type AgentRepairCase = {
	id: string;
	title: string;
	category: AgentRepairCaseCategory;
	/** What the user asked a coding agent to build — simulates auto-coding workflows. */
	agentTask: string;
	repairMode: AgentRepairRepairMode;
	brokenFile: string;
	fixedFile: string;
	/** Diagnostic code the fixture is designed to surface first. */
	expectedCode: string;
	/** Field name as it appears in check-json expected list (camelCase for semantic records). */
	chosenField?: string;
	typescriptContext: AgentRepairTypescriptContext;
};

export type AgentRepairMultistepCase = {
	id: string;
	title: string;
	agentTask: string;
	brokenFile: string;
	fixedFile: string;
	expectedSteps: number;
	expectedCodes: string[];
	typescriptContext: AgentRepairTypescriptContext;
};

export type MultistepRepairResult = {
	id: string;
	passed: boolean;
	stepsApplied: number;
	expectedSteps: number;
	finalMatchesGolden: boolean;
	checkPasses: boolean;
};

export type CheckJsonPayload = {
	schemaVersion: string;
	ok: boolean;
	diagnostics: PointCoreDiagnostic[];
};

export type SufficiencyResult = {
	id: string;
	passed: boolean;
	diagnosticCode: string;
	contextChars: number;
	estimatedTokens: number;
	expectedIncludesFix: boolean;
	checkPassesAfterRepair: boolean;
	ref?: string;
};

const FIXTURES_DIR = join(import.meta.dir, "../tests/fixtures/agent-repair");

export const AGENT_REPAIR_CASES: AgentRepairCase[] = [
	{
		id: "unknown-field-rule",
		title: "Rule — unknown field",
		category: "typo-fix",
		agentTask: "Fix a typo in an existing launch readiness rule.",
		repairMode: "single-shot",
		brokenFile: "unknown-field-broken.point",
		fixedFile: "unknown-field-fixed.point",
		expectedCode: "unknown-field",
		chosenField: "hasBundleId",
		typescriptContext: {
			excerpt: `// ReadinessPanel.tsx — excerpt (~320 lines total in real repos)
import { useMemo } from "react";
import type { LaunchSignals } from "../../types";
import { launchReadinessScore, scoreStatusLabel } from "../../lib/math";

export function ReadinessPanel({ signals }: { signals: LaunchSignals }) {
  const score = useMemo(() => launchReadinessScore(signals), [signals]);
  const label = scoreStatusLabel(score);
  return (<section><h2>Launch readiness</h2><p>Score: {score} — {label}</p></section>);
}

// lib/math.ts — agent often pastes this too when tsc fails
export function launchReadinessScore(signals: LaunchSignals): number {
  let score = 0;
  if (signals.unknownField) score += 30;
  if (signals.submittedForReview) score += 40;
  if (signals.hasPassingTests) score += 30;
  return score;
}`,
			totalChars: 12000,
			tscError: `error TS2339: Property 'unknownField' does not exist on type 'LaunchSignals'.
  at launchReadinessScore (lib/math.ts:18:15)`,
		},
	},
	{
		id: "label-unknown-field",
		title: "Label — unknown field",
		category: "typo-fix",
		agentTask: "Fix a typo in a user status label.",
		repairMode: "single-shot",
		brokenFile: "label-unknown-field-broken.point",
		fixedFile: "label-unknown-field-fixed.point",
		expectedCode: "unknown-field",
		chosenField: "active",
		typescriptContext: {
			excerpt: `// UserStatusBadge.tsx — excerpt
import type { User } from "../types";

export function userStatusLabel(user: User): string {
  if (user.enabled) return user.name;
  return "inactive";
}`,
			totalChars: 4200,
			tscError: `error TS2339: Property 'enabled' does not exist on type 'User'.
  at userStatusLabel (UserStatusBadge.tsx:4:12)`,
		},
	},
	{
		id: "calc-unknown-field",
		title: "Calculation — unknown field",
		category: "typo-fix",
		agentTask: "Fix a typo in a pricing calculation.",
		repairMode: "single-shot",
		brokenFile: "calc-unknown-field-broken.point",
		fixedFile: "calc-unknown-field-fixed.point",
		expectedCode: "unknown-field",
		chosenField: "monthlyPrice",
		typescriptContext: {
			excerpt: `// pricing.ts — excerpt
export type PriceInput = { monthlyPrice: number; discountPercent: number };

export function annualPrice(input: PriceInput): number {
  return input.monthlyAmount * 12;
}`,
			totalChars: 6800,
			tscError: `error TS2339: Property 'monthlyAmount' does not exist on type 'PriceInput'.
  at annualPrice (pricing.ts:4:16)`,
		},
	},
	{
		id: "rule-stock-unknown-field",
		title: "Rule — inventory field typo",
		category: "typo-fix",
		agentTask: "Fix a typo in an inventory scoring rule.",
		repairMode: "single-shot",
		brokenFile: "rule-stock-unknown-field-broken.point",
		fixedFile: "rule-stock-unknown-field-fixed.point",
		expectedCode: "unknown-field",
		chosenField: "quantity",
		typescriptContext: {
			excerpt: `// inventory.ts — excerpt
export type Item = { sku: string; inStock: boolean; quantity: number };

export function stockStatusScore(item: Item): number {
  let score = 0;
  if (item.inStock) score += 50;
  if (item.warehouseQty > 0) score += 50;
  return score;
}`,
			totalChars: 5400,
			tscError: `error TS2339: Property 'warehouseQty' does not exist on type 'Item'.
  at stockStatusScore (inventory.ts:7:12)`,
		},
	},
	{
		id: "rule-user-unknown-field",
		title: "Rule — user record typo",
		category: "typo-fix",
		agentTask: "Fix a typo in a user points rule.",
		repairMode: "single-shot",
		brokenFile: "rule-user-unknown-field-broken.point",
		fixedFile: "rule-user-unknown-field-fixed.point",
		expectedCode: "unknown-field",
		chosenField: "active",
		typescriptContext: {
			excerpt: `// users.ts — excerpt
export type User = { name: string; active: boolean };

export function userPointsScore(user: User): number {
  let score = 0;
  if (user.enabled) score += 10;
  return score;
}`,
			totalChars: 3900,
			tscError: `error TS2339: Property 'enabled' does not exist on type 'User'.
  at userPointsScore (users.ts:5:12)`,
		},
	},
	{
		id: "missing-await",
		title: "Action — missing await",
		category: "typo-fix",
		agentTask: "Fix a missing await in a small async action.",
		repairMode: "single-shot",
		brokenFile: "missing-await-broken.point",
		fixedFile: "missing-await-fixed.point",
		expectedCode: "missing-await",
		typescriptContext: {
			excerpt: `// actions.ts — excerpt
export async function fetchItemTitle(id: string): Promise<string> {
  return fetchItem(id);
}

async function fetchItem(id: string): Promise<string> {
  return "item";
}`,
			totalChars: 5100,
			tscError: `error TS2322: Type 'Promise<string>' is not assignable to type 'string'.
  at fetchItemTitle (actions.ts:2:3)`,
		},
	},
	{
		id: "load-data-repair",
		title: "View — load data instead of direct action call",
		category: "typo-fix",
		agentTask: "Fix a view that calls an action directly instead of using the load data binding.",
		repairMode: "single-shot",
		brokenFile: "load-data-repair-broken.point",
		fixedFile: "load-data-repair-fixed.point",
		expectedCode: "missing-await",
		typescriptContext: {
			excerpt: `// ItemsList.tsx — excerpt
export function ItemsList() {
  const notes = listNotes(); // forgot load hook pattern
  return notes.map(note => <div key={note.id}>{note.title}</div>);
}`,
			totalChars: 12000,
			tscError: `error TS2345: Argument of type 'Promise<Note[]>' is not assignable to parameter of type 'Note[]'.
  at ItemsList (ItemsList.tsx:3:17)`,
		},
	},
	{
		id: "arity-mismatch",
		title: "Calculation — arity mismatch",
		category: "typo-fix",
		agentTask: "Fix a wrong argument count in a widget calculation.",
		repairMode: "single-shot",
		brokenFile: "arity-mismatch-broken.point",
		fixedFile: "arity-mismatch-fixed.point",
		expectedCode: "arity-mismatch",
		typescriptContext: {
			excerpt: `// widget.ts — excerpt
export function listingStatusLabel(score: number): string {
  return score >= 90 ? "Ready" : "Needs work";
}

export function readinessSummary(signals: ListingSignals): string {
  return listingStatusLabel(listingScore(signals), signals);
}`,
			totalChars: 7600,
			tscError: `error TS2554: Expected 1 arguments, but got 2.
  at readinessSummary (widget.ts:6:45)`,
		},
	},
	{
		id: "operator-type-mismatch",
		title: "Label — operator type mismatch",
		category: "typo-fix",
		agentTask: "Fix a numeric comparison typo in a score label.",
		repairMode: "single-shot",
		brokenFile: "operator-type-mismatch-broken.point",
		fixedFile: "operator-type-mismatch-fixed.point",
		expectedCode: "operator-type-mismatch",
		typescriptContext: {
			excerpt: `// grades.ts — excerpt
export function scoreBandLabel(score: number): string {
  if (score >= "ninety") return "A";
  return "F";
}`,
			totalChars: 3200,
			tscError: `error TS2365: Operator '>=' cannot be applied to types 'number' and 'string'.
		at scoreBandLabel (grades.ts:2:7)`,
		},
	},
	{
		id: "feature-dashboard-load",
		title: "Feature — dashboard items list",
		category: "feature-build",
		agentTask:
			"Build a mini dashboard app with sidebar nav, items list view with loading states, layout, page, and client routing.",
		repairMode: "single-shot",
		brokenFile: "feature-dashboard-load-broken.point",
		fixedFile: "feature-dashboard-load-fixed.point",
		expectedCode: "missing-await",
		typescriptContext: {
			excerpt: `// Agent pasted React dashboard scaffold (~400 lines in real repos)
// ItemsList.tsx, useItems.ts, router layout, MSW handlers, Storybook...

export function ItemsList() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetchItems().then(setItems); }, []); // wrong: bypasses load hook pattern
  return items.map(item => <Link key={item.id} href={\`/items/\${item.id}\`}>{item.title}</Link>);
}`,
			totalChars: 14000,
			tscError: `error TS2345: Argument of type 'Promise<Item[]>' is not assignable to parameter of type 'SetStateAction<Item[]>'.
  at ItemsList (ItemsList.tsx:6:38)`,
		},
	},
	{
		id: "feature-pipeline-await",
		title: "Feature — document ingest pipeline",
		category: "feature-build",
		agentTask: "Build a document ingest pipeline with URL policy, fetch/parse/store actions, and retry on fetch.",
		repairMode: "single-shot",
		brokenFile: "feature-pipeline-await-broken.point",
		fixedFile: "feature-pipeline-await-fixed.point",
		expectedCode: "missing-await",
		typescriptContext: {
			excerpt: `// Agent pasted orchestrator + step handlers (~280 lines)
async function documentIngest(url: string) {
  const fetched = fetchDocumentBody(url); // forgot await
  const parsed = await parseDocumentBody(fetched);
  return await storeDocument(parsed, "general");
}`,
			totalChars: 9800,
			tscError: `error TS2345: Argument of type 'Promise<string | Error>' is not assignable to parameter of type 'string | Error'.
  at documentIngest (pipeline.ts:4:42)`,
		},
	},
	{
		id: "feature-notes-crud",
		title: "Feature — notes list app",
		category: "feature-build",
		agentTask: "Build a notes CRUD shell with list action, loading view, layout, page, and navigation.",
		repairMode: "single-shot",
		brokenFile: "feature-notes-crud-broken.point",
		fixedFile: "feature-notes-crud-fixed.point",
		expectedCode: "unknown-load-action",
		chosenField: "listNotes",
		typescriptContext: {
			excerpt: `// Agent pasted notes app scaffold
// NotesList.tsx, notesRouter.tsx, API client, form page stubs...

export function NotesList() {
  const { data, loading } = useNotesQuery(); // hook wired to wrong action name in .point
  if (loading) return <p>Loading...</p>;
  return <p>Notes</p>;
}`,
			totalChars: 8500,
			tscError: `error TS2304: Cannot find name 'fetchNotes'.
  at notesApi.ts:12:10`,
		},
	},
	{
		id: "feature-nav-routes",
		title: "Feature — settings app routes",
		category: "feature-build",
		agentTask: "Build a settings app with layout, settings/profile pages, nav links, and client routing.",
		repairMode: "single-shot",
		brokenFile: "feature-nav-routes-broken.point",
		fixedFile: "feature-nav-routes-fixed.point",
		expectedCode: "unknown-nav-page",
		chosenField: "profilePage",
		typescriptContext: {
			excerpt: `// Agent pasted client router + page components
const routes = [
  { path: "/settings", element: <SettingsPage /> },
  { path: "/profile", element: <ProfilePages /> }, // typo: component vs declared page
];`,
			totalChars: 6200,
			tscError: `error TS2552: Cannot find name 'ProfilePages'. Did you mean 'ProfilePage'?
  at routes.tsx:4:32)`,
		},
	},
	{
		id: "feature-guard-policy",
		title: "Feature — guarded file write pipeline",
		category: "feature-build",
		agentTask:
			"Build a guarded file-write pipeline with output guard, URL policy, write action, and policy-gated pipeline step.",
		repairMode: "single-shot",
		brokenFile: "feature-guard-policy-broken.point",
		fixedFile: "feature-guard-policy-fixed.point",
		expectedCode: "unknown-policy",
		chosenField: "allowedPath",
		typescriptContext: {
			excerpt: `// Agent pasted pipeline orchestrator + guard middleware (~220 lines)
async function guardedWrite(target: string) {
  await assertPolicy("allowedPaths", target); // typo: policy is "allowed path"
  return await writePath(target);
}`,
			totalChars: 9100,
			tscError: `error TS2345: Argument of type '"allowedPaths"' is not assignable to parameter of type '"allowed path"'.
  at guardedWrite (pipeline.ts:3:22)`,
		},
	},
];

export const AGENT_REPAIR_MULTISTEP_CASES: AgentRepairMultistepCase[] = [
	{
		id: "feature-multistep-launch",
		title: "Feature — launch app (2-step repair plan)",
		agentTask:
			"Build a launch readiness app with scoring rule, status label, and summary calculation — agent left two wiring bugs.",
		brokenFile: "feature-multistep-broken.point",
		fixedFile: "feature-multistep-fixed.point",
		expectedSteps: 2,
		expectedCodes: ["unknown-field", "operator-type-mismatch"],
		typescriptContext: {
			excerpt: `// Agent pasted launch dashboard (~350 lines)
// rules.ts, labels.ts, summary hook, tests, Storybook...

export function launchSummary(signals: LaunchSignals): string {
  const score = launchReadinessScore(signals); // field typo + string compare bug below
  return scoreBandLabel(score);
}`,
			totalChars: 11500,
			tscError: `error TS2339: Property 'unknownField' does not exist on type 'LaunchSignals'.
  at launchReadinessScore (rules.ts:8:15)`,
		},
	},
];

export function estimateTokens(text: string): number {
	return Math.max(1, Math.round(text.length / 4));
}

export function loadFixture(name: string): string {
	return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

export function runCheckJson(source: string): CheckJsonPayload {
	const program = parsePointSource(source);
	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	return {
		schemaVersion: "point.core.check.v1",
		ok: diagnostics.length === 0,
		diagnostics,
	};
}

export function serializeCheckJson(payload: CheckJsonPayload): string {
	return JSON.stringify(payload, null, 2);
}

/** Replace the diagnostic line with the corresponding golden line (simulates picking the right field from expected). */
export function applyLineRepairFromGolden(brokenSource: string, fixedSource: string, diagnostic: PointCoreDiagnostic): string {
	if (!diagnostic.span) {
		throw new Error("Diagnostic missing span");
	}
	const brokenLines = brokenSource.split("\n");
	const fixedLines = fixedSource.split("\n");
	const lineIndex = diagnostic.span.start.line - 1;
	if (fixedLines[lineIndex] === undefined) {
		throw new Error(`Fixed file missing line ${diagnostic.span.start.line}`);
	}
	brokenLines[lineIndex] = fixedLines[lineIndex]!;
	return brokenLines.join("\n");
}

/** Simulate the documented agent loop: check-json → patch line → repeat until pass. */
export function applyRepairPlanFromGolden(
	brokenSource: string,
	fixedSource: string,
	maxSteps = 10,
): { source: string; stepsApplied: number; codes: string[] } {
	let source = brokenSource;
	const codes: string[] = [];
	for (let step = 0; step < maxSteps; step++) {
		const payload = runCheckJson(source);
		if (payload.ok) break;
		const diagnostic = payload.diagnostics[0];
		if (!diagnostic?.span) break;
		codes.push(diagnostic.code);
		source = applyLineRepairFromGolden(source, fixedSource, diagnostic);
	}
	return { source, stepsApplied: codes.length, codes };
}

export function evaluateMultistepRepair(testCase: AgentRepairMultistepCase): MultistepRepairResult {
	const brokenSource = loadFixture(testCase.brokenFile);
	const fixedSource = loadFixture(testCase.fixedFile);
	const { source, stepsApplied, codes } = applyRepairPlanFromGolden(brokenSource, fixedSource, testCase.expectedSteps + 2);
	const checkPasses = checkPointCore(parsePointSource(source)).length === 0;
	return {
		id: testCase.id,
		passed:
			stepsApplied === testCase.expectedSteps &&
			codes.join(",") === testCase.expectedCodes.join(",") &&
			source === fixedSource &&
			checkPasses,
		stepsApplied,
		expectedSteps: testCase.expectedSteps,
		finalMatchesGolden: source === fixedSource,
		checkPasses,
	};
}

export function runMultistepRepairBenchmark(): MultistepRepairResult[] {
	return AGENT_REPAIR_MULTISTEP_CASES.map(evaluateMultistepRepair);
}

export function expectedListIncludesFixField(diagnostic: PointCoreDiagnostic, chosenField: string): boolean {
	if (!diagnostic.expected) return false;
	const expected = Array.isArray(diagnostic.expected) ? diagnostic.expected : [diagnostic.expected];
	const normalizedChoice = chosenField.replace(/\s+/g, "").toLowerCase();
	return expected.some((candidate) => candidate.replace(/\s+/g, "").toLowerCase() === normalizedChoice);
}

export function assertDiagnosticIsAgentReady(diagnostic: PointCoreDiagnostic): void {
	if (!diagnostic.ref.startsWith("point://semantic/")) {
		throw new Error(`Expected semantic ref, got ${diagnostic.ref}`);
	}
	if (!diagnostic.repair?.trim()) {
		throw new Error("Missing repair hint");
	}
	if (!diagnostic.expected || (Array.isArray(diagnostic.expected) && diagnostic.expected.length === 0)) {
		throw new Error("Missing expected field list");
	}
	if (!diagnostic.span) {
		throw new Error("Missing source span");
	}
}

export function evaluateRepairSufficiency(testCase: AgentRepairCase): SufficiencyResult {
	const brokenSource = loadFixture(testCase.brokenFile);
	const fixedSource = loadFixture(testCase.fixedFile);
	const payload = runCheckJson(brokenSource);
	const diagnostic = payload.diagnostics[0];
	if (!diagnostic) {
		return {
			id: testCase.id,
			passed: false,
			diagnosticCode: "none",
			contextChars: 0,
			estimatedTokens: 0,
			expectedIncludesFix: false,
			checkPassesAfterRepair: false,
		};
	}

	const contextJson = serializeCheckJson({ schemaVersion: payload.schemaVersion, ok: false, diagnostics: [diagnostic] });
	const expectedIncludesFix = testCase.chosenField
		? expectedListIncludesFixField(diagnostic, testCase.chosenField)
		: true;

	let checkPassesAfterRepair = false;
	try {
		assertDiagnosticIsAgentReady(diagnostic);
		const repaired = applyLineRepairFromGolden(brokenSource, fixedSource, diagnostic);
		const repairedProgram = parsePointSource(repaired);
		checkPassesAfterRepair = checkPointCore(repairedProgram).length === 0;
	} catch {
		checkPassesAfterRepair = false;
	}

	const passed =
		diagnostic.code === testCase.expectedCode && expectedIncludesFix && checkPassesAfterRepair;

	return {
		id: testCase.id,
		passed,
		diagnosticCode: diagnostic.code,
		contextChars: contextJson.length,
		estimatedTokens: estimateTokens(contextJson),
		expectedIncludesFix,
		checkPassesAfterRepair,
		ref: diagnostic.ref,
	};
}

export function runRepairSufficiencyBenchmark(): SufficiencyResult[] {
	return AGENT_REPAIR_CASES.map(evaluateRepairSufficiency);
}

export function summarizeTokenReduction(cases: AgentRepairCase[] = AGENT_REPAIR_CASES): {
	minReductionPercent: number;
	maxReductionPercent: number;
	avgReductionPercent: number;
} {
	const reductions = cases.map((testCase) => {
		const payload = runCheckJson(loadFixture(testCase.brokenFile));
		const diagnostic = payload.diagnostics[0];
		if (!diagnostic) return 0;
		const context = serializeCheckJson({ schemaVersion: payload.schemaVersion, ok: false, diagnostics: [diagnostic] });
		const pointTokens = estimateTokens(context);
		const tsTokens = estimateTokens("x".repeat(testCase.typescriptContext.totalChars));
		return tsTokens > 0 ? Math.round((1 - pointTokens / tsTokens) * 100) : 0;
	});
	return {
		minReductionPercent: Math.min(...reductions),
		maxReductionPercent: Math.max(...reductions),
		avgReductionPercent: Math.round(reductions.reduce((sum, value) => sum + value, 0) / reductions.length),
	};
}
