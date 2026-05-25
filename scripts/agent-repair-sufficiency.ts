import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { PointCoreDiagnostic } from "../packages/point/src/core/check.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { sortDiagnosticsForRepairPlan } from "../packages/point/src/core/context.ts";
import { buildCoreFileFromSource, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { resolveUseDependencyInput } from "../packages/point/src/core/module-resolve.ts";
import { readPointLockSync } from "../packages/point/src/core/packages.ts";
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

const REPO_ROOT = join(import.meta.dir, "..");
const FIXTURES_DIR = join(REPO_ROOT, "tests/fixtures/agent-repair");

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
		id: "middleware-input-unavailable",
		title: "Route — middleware input unavailable",
		category: "typo-fix",
		agentTask: "Fix middleware wired on a GET items route — agent declared body middleware but the route only exposes query params.",
		repairMode: "single-shot",
		brokenFile: "middleware-input-unavailable-broken.point",
		fixedFile: "middleware-input-unavailable-fixed.point",
		expectedCode: "middleware-input-unavailable",
		chosenField: "query",
		typescriptContext: {
			excerpt: `// routes/items.ts — excerpt
app.get("/items", requireBody, (req, res) => {
  const limit = req.query.limit;
  return res.send("ok");
});

function requireBody(req, res, next) {
  if (!req.body) return res.status(400).end();
  next();
}`,
			totalChars: 6400,
			tscError: `error TS2339: Property 'body' does not exist on type 'IncomingMessage & { query: ItemQuery }'.
  at requireBody (routes/items.ts:8:12)`,
		},
	},
	{
		id: "middleware-input-type-mismatch",
		title: "Middleware — header record mismatch",
		category: "typo-fix",
		agentTask: "Fix auth middleware on an items route — agent typed middleware headers differently from the route input record.",
		repairMode: "single-shot",
		brokenFile: "middleware-input-type-mismatch-broken.point",
		fixedFile: "middleware-input-type-mismatch-fixed.point",
		expectedCode: "middleware-input-type-mismatch",
		chosenField: "Auth Headers",
		typescriptContext: {
			excerpt: `// middleware/auth.ts — excerpt
type RouteHeaders = { authorization: string };
type MiddlewareHeaders = { token: string };

export function requireAuth(headers: MiddlewareHeaders, routeHeaders: RouteHeaders) {
  return headers.token.length > 0;
}`,
			totalChars: 5200,
			tscError: `error TS2322: Type 'MiddlewareHeaders' is not assignable to type 'RouteHeaders'.
  at requireAuth (middleware/auth.ts:5:60)`,
		},
	},
	{
		id: "auth-bearer",
		title: "Auth — legacy JWT helper typo",
		category: "typo-fix",
		agentTask: "Fix auth middleware on a protected route — agent called a nonexistent legacyJwtCheck helper instead of std/auth auth ok.",
		repairMode: "single-shot",
		brokenFile: "auth-bearer-broken.point",
		fixedFile: "auth-bearer-fixed.point",
		expectedCode: "unknown-function",
		chosenField: "auth ok",
		typescriptContext: {
			excerpt: `// middleware/requireAuth.ts — excerpt
import { jwtAuthOk, unauthorizedBody } from "@/lib/auth";

export function requireAuth(headers: { authorization: string }, secret: string) {
  if (!legacyJwtCheck(headers.authorization, secret)) {
    return unauthorizedBody();
  }
  return null;
}`,
			totalChars: 4800,
			tscError: `error TS2304: Cannot find name 'legacyJwtCheck'.
  at requireAuth (middleware/requireAuth.ts:5:8)`,
		},
	},
	{
		id: "pipeline-step-type-mismatch",
		title: "Pipeline — step output type mismatch",
		category: "typo-fix",
		agentTask: "Fix document ingest pipeline wiring — agent passed fetched Text body into a parse step that expects an Int page count.",
		repairMode: "single-shot",
		brokenFile: "pipeline-step-type-mismatch-broken.point",
		fixedFile: "pipeline-step-type-mismatch-fixed.point",
		expectedCode: "pipeline-step-type-mismatch",
		chosenField: "Int",
		typescriptContext: {
			excerpt: `// pipeline/documentIngest.ts — excerpt
async function documentIngest(url: string) {
  const fetched = await fetchDocumentBody(url);
  const parsed = await parseDocumentBody(fetched); // fetched is string, parser expects number
  return parsed;
}`,
			totalChars: 7800,
			tscError: `error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
  at documentIngest (pipeline/documentIngest.ts:4:42)`,
		},
	},
	{
		id: "float-money-field",
		title: "Record — float money field lint",
		category: "typo-fix",
		agentTask: "Fix cart line item pricing record — agent used Float for a money-like unit price field.",
		repairMode: "single-shot",
		brokenFile: "float-money-field-broken.point",
		fixedFile: "float-money-field-fixed.point",
		expectedCode: "float-money-field",
		chosenField: "Int",
		typescriptContext: {
			excerpt: `// pricing/lineItem.ts — excerpt
export type LineItem = {
  label: string;
  unitPrice: number; // should be integer cents
};`,
			totalChars: 4100,
			tscError: `error TS2367: Money-like field 'unitPrice' should use integer cents, not floating point.`,
		},
	},
	{
		id: "missing-variant-case",
		title: "Label — missing variant case",
		category: "typo-fix",
		agentTask: "Fix order status label dispatch — agent typo'd a variant branch name and left Pending uncovered.",
		repairMode: "single-shot",
		brokenFile: "missing-variant-case-broken.point",
		fixedFile: "missing-variant-case-fixed.point",
		expectedCode: "missing-variant-case",
		chosenField: "Pending",
		typescriptContext: {
			excerpt: `// orders/statusLabel.ts — excerpt
type OrderStatus = { kind: "Pending" } | { kind: "Shipped" };

export function statusMessage(status: OrderStatus): string {
  switch (status.kind) {
    case "Refund": return "wrong";
    case "Shipped": return "shipped";
    default: return "unknown";
  }
}`,
			totalChars: 5600,
			tscError: `error TS2678: Type '"Refund"' is not comparable to type '"Pending" | "Shipped"'.`,
		},
	},
	{
		id: "action-outcome-not-exhaustive",
		title: "Label — outcome dispatch typo (Payment Outcome)",
		category: "typo-fix",
		agentTask: "Fix payment headline label — agent misspelled the Succeeded branch on an outcome variant (types named ending with \" Outcome\").",
		repairMode: "single-shot",
		brokenFile: "action-outcome-not-exhaustive-broken.point",
		fixedFile: "action-outcome-not-exhaustive-fixed.point",
		expectedCode: "action-outcome-not-exhaustive",
		chosenField: "Succeeded",
		typescriptContext: {
			excerpt: `// payments/detailLine.ts — excerpt
type PaymentOutcome =
  | { kind: "Succeeded"; receiptId: string }
  | { kind: "Failed"; message: string };

export function paymentDetailLine(outcome: PaymentOutcome): string {
  switch (outcome.kind) {
    case "Succeded":
      return "Paid (" + outcome.receiptId + ")";
    case "Failed":
      return outcome.message;
  }
}`,
			totalChars: 5400,
			tscError: `error TS2678: Type '"Succeded"' is not comparable to type '"Succeeded" | "Failed"'.`,
		},
	},
	{
		id: "calculation-on-failure-type-mismatch",
		title: "Calculation — on failure return type mismatch",
		category: "typo-fix",
		agentTask: "Fix margin calculation fallback — agent returned a string from on failure return but output is integer cents.",
		repairMode: "single-shot",
		brokenFile: "calculation-on-failure-type-mismatch-broken.point",
		fixedFile: "calculation-on-failure-type-mismatch-fixed.point",
		expectedCode: "calculation-on-failure-type-mismatch",
		chosenField: "Int",
		typescriptContext: {
			excerpt: `// margin/netCents.ts — excerpt
export function netAfterGatewayFee(grossCents: number): number {
  if (grossCents < 0) return 0;
  // domain fallback must still be cents (Int), not text
  return "invalid gross" as unknown as number;
}`,
			totalChars: 6200,
			tscError: `error TS2322: Type 'string' is not assignable to type 'number'.
  at netAfterGatewayFee (margin/netCents.ts:5:3)`,
		},
	},
	{
		id: "invalid-view-bind-target",
		title: "View — invalid bind target",
		category: "typo-fix",
		agentTask: "Fix settings form bindings — agent bound the field label to the input record instead of input.field.",
		repairMode: "single-shot",
		brokenFile: "invalid-view-bind-target-broken.point",
		fixedFile: "invalid-view-bind-target-fixed.point",
		expectedCode: "invalid-view-bind-target",
		chosenField: "settings.workspace name",
		typescriptContext: {
			excerpt: `// SettingsForm.tsx — excerpt
export function SettingsForm({ settings, onSettingsChange }: Props) {
  return (
    <input
      value={settings}
      onChange={(event) => onSettingsChange({ ...settings, workspaceName: event.target.value })}
    />
  );
}`,
			totalChars: 4800,
			tscError: `error TS2322: Type 'SettingsForm' is not assignable to type 'string | number | readonly string[] | undefined'.
  at SettingsForm (SettingsForm.tsx:4:7)`,
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
	{
		id: "refresh-without-load",
		title: "View — unknown load action with refresh",
		category: "typo-fix",
		agentTask: "Fix a view load data action name typo while keeping refresh every.",
		repairMode: "single-shot",
		brokenFile: "refresh-without-load-broken.point",
		fixedFile: "refresh-without-load-fixed.point",
		expectedCode: "unknown-load-action",
		chosenField: "fetchmetrics",
		typescriptContext: {
			excerpt: `// LiveMetrics.tsx — excerpt
export function MetricsPanel() {
  useEffect(() => { const id = setInterval(() => refetch(), 30000); return () => clearInterval(id); }, []);
  return <p>metrics</p>; // forgot useQuery / load hook
}`,
			totalChars: 7200,
			tscError: `error TS2304: Cannot find name 'refetch'.
  at MetricsPanel (LiveMetrics.tsx:3:51)`,
		},
	},
	{
		id: "invalid-refresh-interval",
		title: "View — invalid refresh interval",
		category: "typo-fix",
		agentTask: "Fix a refresh every interval that must be a positive integer.",
		repairMode: "single-shot",
		brokenFile: "invalid-refresh-interval-broken.point",
		fixedFile: "invalid-refresh-interval-fixed.point",
		expectedCode: "invalid-refresh-interval",
		typescriptContext: {
			excerpt: `// Dashboard.tsx — excerpt
useEffect(() => { refetch(); const a = setInterval(refetch, 30000); const b = setInterval(refetch, 60000); return () => { clearInterval(a); clearInterval(b); }; }, []);`,
			totalChars: 6400,
			tscError: `error TS2451: Cannot redeclare block-scoped variable 'intervalId'.`,
		},
	},
	{
		id: "invalid-table-link-column",
		title: "View — table link column missing from columns",
		category: "typo-fix",
		agentTask: "Fix a table where link column is not listed in columns.",
		repairMode: "single-shot",
		brokenFile: "invalid-table-link-column-broken.point",
		fixedFile: "invalid-table-link-column-fixed.point",
		expectedCode: "invalid-table-link-column",
		chosenField: "title",
		typescriptContext: {
			excerpt: `// MembersTable.tsx — excerpt
columns={["name", "role"]} linkColumn="title" // title not in columns`,
			totalChars: 5800,
			tscError: `error TS2322: Type '"title"' is not assignable to type '"name" | "role"'.`,
		},
	},
	{
		id: "terminal-unknown-stream",
		title: "View — terminal unknown stream route",
		category: "typo-fix",
		agentTask: "Fix terminal subscribe to stream name typo.",
		repairMode: "single-shot",
		brokenFile: "terminal-unknown-stream-broken.point",
		fixedFile: "terminal-unknown-stream-fixed.point",
		expectedCode: "unknown-stream-subscribe-route",
		chosenField: "buildlogs",
		typescriptContext: {
			excerpt: `// BuildTerminal.tsx — excerpt
useWebSocket("/ws/build", { subscribe: "buildLog" }); // route registered as buildLogs`,
			totalChars: 6100,
			tscError: `error TS2820: Type '"buildLog"' is not assignable to type '"buildLogs"'.`,
		},
	},
	{
		id: "invalid-datagrid-sort-column",
		title: "View — datagrid sort column missing from columns",
		category: "typo-fix",
		agentTask: "Fix a datagrid where sort by column is not listed in columns.",
		repairMode: "single-shot",
		brokenFile: "invalid-datagrid-sort-column-broken.point",
		fixedFile: "invalid-datagrid-sort-column-fixed.point",
		expectedCode: "invalid-datagrid-sort-column",
		chosenField: "name",
		typescriptContext: {
			excerpt: `// JobsGrid.tsx — excerpt
columns={["name", "role"]} sortBy="title" // title not in columns`,
			totalChars: 5900,
			tscError: `error TS2322: Type '"title"' is not assignable to type '"name" | "role"'.`,
		},
	},
	{
		id: "invalid-datagrid-filter-column",
		title: "View — datagrid filter column missing from columns",
		category: "typo-fix",
		agentTask: "Fix a datagrid where filter by column is not listed in columns.",
		repairMode: "single-shot",
		brokenFile: "invalid-datagrid-filter-column-broken.point",
		fixedFile: "invalid-datagrid-filter-column-fixed.point",
		expectedCode: "invalid-datagrid-filter-column",
		chosenField: "name",
		typescriptContext: {
			excerpt: `// MembersGrid.tsx — excerpt
columns={["name", "role"]} filterColumn="title" // title not in columns`,
			totalChars: 5900,
			tscError: `error TS2322: Type '"title"' is not assignable to type '"name" | "role"'.`,
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
	{
		id: "feature-multistep-cart",
		title: "Feature — cart pricing (2-step repair plan)",
		agentTask:
			"Build a cart line-total rule and discount band label — agent left a field typo and a string comparison bug.",
		brokenFile: "feature-multistep-cart-broken.point",
		fixedFile: "feature-multistep-cart-fixed.point",
		expectedSteps: 2,
		expectedCodes: ["unknown-field", "operator-type-mismatch"],
		typescriptContext: {
			excerpt: `// Agent pasted cart pricing module (~180 lines)
export function lineTotal(item: CartItem): number {
  return item.unitAmount * item.quantity; // field typo
}

export function discountBand(total: number): string {
  if (total >= "fifty") return "Bulk"; // string compare bug
  return "Standard";
}`,
			totalChars: 7200,
			tscError: `error TS2339: Property 'unitAmount' does not exist on type 'CartItem'.
  at lineTotal (cart.ts:3:15)`,
		},
	},
	{
		id: "feature-multistep-notes",
		title: "Feature — notes list app (2-step repair plan)",
		agentTask:
			"Build a notes list view with client routing — agent wired the wrong action name and typo'd the page in navigation.",
		brokenFile: "feature-multistep-notes-broken.point",
		fixedFile: "feature-multistep-notes-fixed.point",
		expectedSteps: 2,
		expectedCodes: ["unknown-load-action", "unknown-nav-page"],
		typescriptContext: {
			excerpt: `// Agent pasted notes shell (~320 lines)
export function NotesList() {
  const { data } = useLoadAction("fetchNotes"); // should be listNotes
  return data.map(note => <div key={note.id}>{note.title}</div>);
}

const routes = [{ path: "/notes", page: "notesPages" }]; // typo vs notesListPage`,
			totalChars: 9800,
			tscError: `error TS2304: Cannot find name 'fetchNotes'.
  at notesApi.ts:8:10)`,
		},
	},
	{
		id: "feature-multistep-pipeline",
		title: "Feature — document ingest pipeline (2-step repair plan)",
		agentTask:
			"Build a document ingest pipeline with URL policy — agent forgot await on fetch and typo'd the policy name.",
		brokenFile: "feature-multistep-pipeline-broken.point",
		fixedFile: "feature-multistep-pipeline-fixed.point",
		expectedSteps: 2,
		expectedCodes: ["missing-await", "unknown-policy"],
		typescriptContext: {
			excerpt: `// Agent pasted pipeline orchestrator (~240 lines)
async function documentIngest(url: string) {
  const fetched = fetchDocumentBody(url); // forgot await
  await assertPolicy("allowedUrls", url); // typo: allowed url
  return await parseDocumentBody(fetched);
}`,
			totalChars: 8600,
			tscError: `error TS2345: Argument of type 'Promise<string | Error>' is not assignable to parameter of type 'string | Error'.
  at documentIngest (pipeline.ts:3:42)`,
		},
	},
];

export function estimateTokens(text: string): number {
	return Math.max(1, Math.round(text.length / 4));
}

export function loadFixture(name: string): string {
	return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

function fixtureInputPath(fixtureFile: string): string {
	return fixtureFile.includes("/") ? fixtureFile : join(FIXTURES_DIR, fixtureFile);
}

function loadFixtureCoreFile(fixtureFile: string) {
	const input = fixtureInputPath(fixtureFile);
	const lock = readPointLockSync(REPO_ROOT);
	const source = readFileSync(resolve(REPO_ROOT, input), "utf8");
	return buildCoreFileFromSource(input, source, lock, REPO_ROOT);
}

function createFixtureModuleGraph(coreFile: ReturnType<typeof loadFixtureCoreFile>) {
	const lock = readPointLockSync(REPO_ROOT);
	const loaded = new Map<string, ReturnType<typeof loadFixtureCoreFile>>();
	const pending = [coreFile];
	while (pending.length > 0) {
		const current = pending.pop()!;
		const key = current.input.replaceAll("\\", "/");
		if (loaded.has(key)) continue;
		loaded.set(key, current);
		for (const use of current.uses) {
			const dependencyInput = resolveUseDependencyInput(current.input, use.from, REPO_ROOT);
			const dependencyKey = dependencyInput.replaceAll("\\", "/");
			if (loaded.has(dependencyKey)) continue;
			const dependencySource = readFileSync(resolve(REPO_ROOT, dependencyInput), "utf8");
			pending.push(buildCoreFileFromSource(dependencyInput, dependencySource, lock, REPO_ROOT));
		}
	}
	const graph = new Map<string, { result: (typeof loaded extends Map<string, infer V> ? V : never); dependencies: Array<(typeof loaded extends Map<string, infer V> ? V : never)> }>();
	for (const result of loaded.values()) {
		const dependencies = result.uses.map((use) => {
			const dependencyInput = resolveUseDependencyInput(result.input, use.from, REPO_ROOT);
			return loaded.get(dependencyInput.replaceAll("\\", "/"))!;
		});
		graph.set(result.input.replaceAll("\\", "/"), { result, dependencies });
	}
	return graph;
}

export function parseFixtureSource(source: string, fixtureFile: string) {
	const coreFile = buildCoreFileFromSource(fixtureInputPath(fixtureFile), source, readPointLockSync(REPO_ROOT), REPO_ROOT);
	if (coreFile.uses.length === 0) return coreFile.program;
	const graph = createFixtureModuleGraph(coreFile);
	return programWithDependencyDeclarations(coreFile, graph, REPO_ROOT);
}

export function runCheckJson(source: string, fixtureFile = "inline.point"): CheckJsonPayload {
	const program = parseFixtureSource(source, fixtureFile);
	const diagnostics = sortDiagnosticsForRepairPlan(mapPublicDiagnostics(program, checkPointCore(program)));
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
	fixtureFile: string,
	maxSteps = 10,
): { source: string; stepsApplied: number; codes: string[] } {
	let source = brokenSource;
	const codes: string[] = [];
	for (let step = 0; step < maxSteps; step++) {
		const payload = runCheckJson(source, fixtureFile);
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
	const { source, stepsApplied, codes } = applyRepairPlanFromGolden(brokenSource, fixedSource, testCase.brokenFile, testCase.expectedSteps + 2);
	const checkPasses = checkPointCore(parseFixtureSource(source, testCase.brokenFile)).length === 0;
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
	const payload = runCheckJson(brokenSource, testCase.brokenFile);
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
		const repairedProgram = parseFixtureSource(repaired, testCase.brokenFile);
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
		const payload = runCheckJson(loadFixture(testCase.brokenFile), testCase.brokenFile);
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
