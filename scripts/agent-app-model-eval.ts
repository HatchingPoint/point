import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PointCoreDiagnostic } from "../packages/point/src/core/check.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import {
	AGENT_APP_BENCHMARK_CASES,
	loadAppFixture,
	resolveTypescriptContext,
	type AgentAppBenchmarkCase,
} from "./agent-app-benchmark.ts";
import {
	applyLineRepairFromGolden,
	estimateTokens,
	runCheckJson,
	serializeCheckJson,
} from "./agent-repair-sufficiency.ts";
import { pairedScaffoldRef } from "./paired-scaffold-types.ts";
import {
	callModel,
	DEFAULT_MODELS,
	parseModelJson,
	verifyPointSource,
	type EvalCondition,
	type ModelSpec,
} from "./agent-repair-model-eval.ts";

export { DEFAULT_MODELS };

export type AppModelEdit =
	| { kind: "replaceLine"; line: number; text: string }
	| { kind: "insertAfterLine"; line: number; lines: string[] };

export type AppModelEvalMode = "single-line" | "multi-edit";

export type AppModelEvalRun = {
	modelId: string;
	modelLabel: string;
	provider: ModelSpec["provider"];
	caseId: string;
	category: AgentAppBenchmarkCase["category"];
	condition: EvalCondition;
	mode: AppModelEvalMode;
	success: boolean;
	checkPassed: boolean;
	contextChars: number;
	contextTokens: number;
	promptTokens: number | null;
	completionTokens: number | null;
	latencyMs: number;
	stepsUsed: number;
	editCount: number;
	modelResponseExcerpt: string | null;
	error: string | null;
};

export type AppModelEvalReport = {
	schemaVersion: "point.agent-app-model-eval.v1";
	generatedAt: string;
	methodology: string;
	models: string[];
	cases: string[];
	runs: AppModelEvalRun[];
	summary: {
		overall: { point: SuccessRate; typescript: SuccessRate };
		byModel: Record<string, { point: SuccessRate; typescript: SuccessRate }>;
		byCategory: Record<string, { point: SuccessRate; typescript: SuccessRate }>;
	};
};

type SuccessRate = {
	passed: number;
	total: number;
	rate: number;
};

export function evalModeForCase(testCase: AgentAppBenchmarkCase): AppModelEvalMode {
	return testCase.category === "app-repair" ? "single-line" : "multi-edit";
}

export function numberSourceLines(source: string): string {
	return source
		.split("\n")
		.map((line, index) => `${String(index + 1).padStart(3, " ")}| ${line}`)
		.join("\n");
}

export function buildAppTscError(testCase: AgentAppBenchmarkCase): string {
	if (testCase.id === "dashboard-add-search") {
		return `error TS2307: Cannot find module '../lib/searchItems' or its corresponding type declarations.
  at components/SearchPanel.tsx:1:29`;
	}
	if (testCase.id === "notes-add-detail") {
		return `error TS2307: Cannot find module '../lib/getNote' or its corresponding type declarations.
  at components/NoteDetail.tsx:1:25`;
	}
	if (testCase.id === "dashboard-rename-products") {
		return `error TS2307: Cannot find module '../lib/items' or its corresponding type declarations.
  at components/ProductsList.tsx:1:28`;
	}
	if (testCase.id === "ops-add-dashboard") {
		return `error TS2304: Cannot find name 'fetchOpsPanel'.
  at components/OpsDashboard.tsx:12:42`;
	}
	if (testCase.id === "sse-add-live-feed") {
		return `error TS2552: Cannot find name 'metricTicks'. Did you mean 'metricPulses'?
  at components/LivePulseFeed.tsx:8:28`;
	}
	if (testCase.id === "ops-dashboard-chart-wiring") {
		return `error TS2339: Property 'title' does not exist on type 'JobMetric'.
  at components/OpsDashboard.tsx:14:32`;
	}
	if (testCase.id === "ops-dashboard-sort-wiring") {
		return `error TS2322: Type '"title"' is not assignable to type '"name" | "status" | "score"'.
  at components/OpsDashboard.tsx:18:11`;
	}
	if (testCase.id === "ops-dashboard-filter-wiring") {
		return `error TS2322: Type '"title"' is not assignable to type '"name" | "status" | "score"'.
  at components/OpsDashboard.tsx:19:15`;
	}
	if (testCase.id === "ops-dashboard-page-size-wiring") {
		return `error TS2322: Type '0' is not assignable to type 'PositiveInteger'.
  at components/OpsDashboard.tsx:20:13`;
	}
	if (testCase.id === "ops-dashboard-refresh-wiring") {
		return `error TS2304: Cannot find name 'refetch'.
  at components/OpsDashboard.tsx:12:51`;
	}
	if (testCase.id === "notes-create-form-wiring") {
		return `error TS2339: Property 'options' does not exist on type 'CreateNoteInput'.
  at components/NoteCreateForm.tsx:15:28`;
	}
	if (testCase.id === "notes-detail-wiring") {
		return `error TS2304: Cannot find name 'fetchNote'.
  at components/NoteDetail.tsx:8:42`;
	}
	return `error TS2724: '"../lib/searchItems"' has no exported member named 'searchItem'. Did you mean 'searchItems'?
  at components/SearchPanel.tsx:1:10`;
}

export function buildAppEvalPrompt(
	testCase: AgentAppBenchmarkCase,
	condition: EvalCondition,
): { prompt: string; context: string; contextChars: number; contextTokens: number; mode: AppModelEvalMode } {
	const brokenSource = loadAppFixture(testCase.brokenFile);
	const payload = runCheckJson(brokenSource);
	const diagnostic = payload.diagnostics[0];
	if (!diagnostic?.span) {
		throw new Error(`Fixture ${testCase.id} missing diagnostic span`);
	}

	const mode = evalModeForCase(testCase);
	const lineNumber = diagnostic.span.start.line;
	const currentLine = brokenSource.split("\n")[lineNumber - 1] ?? "";
	const numberedSource = numberSourceLines(brokenSource);
	const typescript = resolveTypescriptContext(testCase);

	let context = "";
	if (condition === "point") {
		const checkJson = serializeCheckJson({ schemaVersion: payload.schemaVersion, ok: false, diagnostics: [diagnostic] });
		context = `Workflow: Point agent loop (check-json only)

point check-json output:
${checkJson}

Patch target ref: ${diagnostic.ref}
Line ${lineNumber} currently reads:
${currentLine}

Numbered broken app (for multi-line inserts):
${numberedSource}`;
	} else {
		const scaffoldRef = pairedScaffoldRef(testCase);
		const scaffoldPath = scaffoldRef ? `benchmarks/${scaffoldRef.scaffold}/` : "benchmarks/next-dashboard/";
		const scaffoldBody =
			typescript.excerpt ||
			`${testCase.typescriptContext.taskDescription}\n\n` +
				"// Illustrative Next.js scaffold paste (components, loaders, routes)\n".repeat(
					Math.max(1, Math.ceil(testCase.typescriptContext.totalChars / 72)),
				);
		context = `Workflow: TypeScript + paired Next.js scaffold

Task context (~${typescript.chars} chars measured from ${scaffoldPath}):
${scaffoldBody}

TypeScript compiler error:
${buildAppTscError(testCase)}

Authoritative Point source file to repair (edit this .point file, not the TypeScript):
${numberedSource}

Line ${lineNumber} currently reads:
${currentLine}`;
	}

	const responseShape =
		mode === "single-line"
			? `Return ONLY valid JSON:
{"fixedLine":"<exact replacement for line ${lineNumber}>","reason":"<one short sentence>"}`
			: `Return ONLY valid JSON:
{"edits":[{"kind":"replaceLine","line":<n>,"text":"<full line>"},{"kind":"insertAfterLine","line":<n>,"lines":["<line>", "..."]}],"reason":"<one short sentence>"}`;

	const prompt = `You are repairing a full Point (.point) application after an AI coding agent scaffolded a feature.

Agent task: ${testCase.agentTask}

${responseShape}

Rules:
- preserve indentation exactly
- for unknown-load-action errors, add the missing action block or fix the action name from expected
- for feature-add tasks you may need insertAfterLine to add new action/view blocks — use line numbers from the numbered source
- apply edits using original line numbers before any insertions
- do not wrap JSON in markdown fences
- do not return the whole file unless using multi-edit with targeted lines only

${context}`;

	return {
		prompt,
		context,
		contextChars: context.length,
		contextTokens: estimateTokens(context),
		mode,
	};
}

export function parseAppModelResponse(text: string, mode: AppModelEvalMode): {
	fixedLine?: string;
	edits?: AppModelEdit[];
} {
	if (mode === "single-line") {
		return parseModelJson(text);
	}
	const trimmed = text.trim();
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const candidate = fenced?.[1]?.trim() ?? trimmed;
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");
	if (start === -1 || end === -1) return {};
	try {
		const parsed = JSON.parse(candidate.slice(start, end + 1)) as { edits?: AppModelEdit[] };
		if (!Array.isArray(parsed.edits)) return {};
		const edits = parsed.edits.filter(
			(edit) =>
				(edit.kind === "replaceLine" && typeof edit.line === "number" && typeof edit.text === "string") ||
				(edit.kind === "insertAfterLine" && typeof edit.line === "number" && Array.isArray(edit.lines)),
		);
		return { edits };
	} catch {
		return {};
	}
}

function editLine(edit: AppModelEdit): number {
	return edit.line;
}

export function applyAppEdits(source: string, edits: AppModelEdit[]): string {
	const lines = source.split("\n");
	const sorted = [...edits].sort((left, right) => editLine(right) - editLine(left));
	for (const edit of sorted) {
		if (edit.kind === "replaceLine") {
			lines[edit.line - 1] = edit.text;
			continue;
		}
		lines.splice(edit.line, 0, ...edit.lines);
	}
	return lines.join("\n");
}

export function applyAppModelResponse(
	source: string,
	mode: AppModelEvalMode,
	response: { fixedLine?: string; edits?: AppModelEdit[] },
	diagnostic: PointCoreDiagnostic,
): string {
	if (mode === "single-line") {
		if (!response.fixedLine) throw new Error("Model JSON missing fixedLine");
		const lines = source.split("\n");
		lines[diagnostic.span!.start.line - 1] = response.fixedLine;
		return lines.join("\n");
	}
	if (!response.edits?.length) throw new Error("Model JSON missing edits");
	return applyAppEdits(source, response.edits);
}

function successRate(passed: number, total: number): SuccessRate {
	return { passed, total, rate: total === 0 ? 0 : Math.round((passed / total) * 100) };
}

export function summarizeAppRuns(runs: AppModelEvalRun[]): AppModelEvalReport["summary"] {
	const byModel: AppModelEvalReport["summary"]["byModel"] = {};
	const byCategory: AppModelEvalReport["summary"]["byCategory"] = {};
	for (const run of runs) {
		byModel[run.modelId] ??= { point: successRate(0, 0), typescript: successRate(0, 0) };
		byCategory[run.category] ??= { point: successRate(0, 0), typescript: successRate(0, 0) };
		for (const bucket of [byModel[run.modelId]![run.condition], byCategory[run.category]![run.condition]]) {
			bucket.total += 1;
			if (run.success) bucket.passed += 1;
			bucket.rate = bucket.total === 0 ? 0 : Math.round((bucket.passed / bucket.total) * 100);
		}
	}
	const overallPoint = runs.filter((run) => run.condition === "point");
	const overallTs = runs.filter((run) => run.condition === "typescript");
	return {
		overall: {
			point: successRate(
				overallPoint.filter((run) => run.success).length,
				overallPoint.length,
			),
			typescript: successRate(
				overallTs.filter((run) => run.success).length,
				overallTs.length,
			),
		},
		byModel,
		byCategory,
	};
}

/** Golden-derived edits for CI verification without calling models. */
export function goldenEditsForCase(testCase: AgentAppBenchmarkCase): AppModelEdit[] {
	switch (testCase.id) {
		case "dashboard-search-wiring":
			return [{ kind: "replaceLine", line: 58, text: "  load data from action search items" }];
		case "notes-add-detail":
			return [
				{
					kind: "insertAfterLine",
					line: 25,
					lines: [
						"",
						"action get note",
						"  input id: Text",
						"  output note: Note",
						"  touches none",
						"  return { id: id, title: \"Note \" + id, body: \"Detail for \" + id }",
					],
				},
				{ kind: "replaceLine", line: 44, text: "" },
				{ kind: "replaceLine", line: 43, text: "" },
				{ kind: "replaceLine", line: 42, text: "" },
				{ kind: "replaceLine", line: 41, text: '  render "Note detail for " + id' },
			];
		case "dashboard-rename-products":
			return [
				{ kind: "replaceLine", line: 38, text: "view products list" },
				{ kind: "replaceLine", line: 39, text: "  load data from action list products" },
				{ kind: "replaceLine", line: 42, text: '  when empty render "No products yet"' },
				{ kind: "insertAfterLine", line: 42, lines: ['  each product in data render link product.title to "/products/" + product.id'] },
				{ kind: "replaceLine", line: 65, text: "  main render products list()" },
			];
		case "ops-add-dashboard":
			return [{ kind: "replaceLine", line: 42, text: "  load data from action fetch ops dashboard" }];
		case "sse-add-live-feed":
			return [{ kind: "replaceLine", line: 21, text: "  subscribe to sse metric pulses" }];
		case "ops-dashboard-chart-wiring":
			return [
				{
					kind: "replaceLine",
					line: 40,
					text: "  chart bar from data.metrics label field label value field value",
				},
			];
		case "ops-dashboard-sort-wiring":
			return [
				{
					kind: "replaceLine",
					line: 41,
					text: "  datagrid row in data.jobs columns name, status, score sort by score filter by name page size 6",
				},
			];
		case "ops-dashboard-filter-wiring":
			return [
				{
					kind: "replaceLine",
					line: 41,
					text: "  datagrid row in data.jobs columns name, status, score sort by score filter by name page size 6",
				},
			];
		case "ops-dashboard-page-size-wiring":
			return [
				{
					kind: "replaceLine",
					line: 41,
					text: "  datagrid row in data.jobs columns name, status, score sort by score filter by name page size 6",
				},
			];
		case "ops-dashboard-refresh-wiring":
			return [{ kind: "insertAfterLine", line: 34, lines: ["  load data from action fetch ops dashboard"] }];
		case "notes-create-form-wiring":
			return [{ kind: "replaceLine", line: 58, text: '  bind textarea "Body" to draft.body' }];
		case "notes-detail-wiring":
			return [{ kind: "replaceLine", line: 47, text: "  load data from action get note" }];
		default:
			return [
				{
					kind: "insertAfterLine",
					line: 37,
					lines: [
						"",
						"action search items",
						"  input query: Text",
						"  output items: List<Item>",
						"  touches none",
						"  return sample items()",
					],
				},
				{ kind: "replaceLine", line: 55, text: '  when empty render "No matches"' },
				{ kind: "insertAfterLine", line: 55, lines: ["  each item in data render item.title"] },
			];
	}
}

export async function runAppModelEval(options: {
	models?: ModelSpec[];
	cases?: AgentAppBenchmarkCase[];
	outputPath?: string;
}): Promise<AppModelEvalReport> {
	const models = options.models ?? DEFAULT_MODELS.filter((model) => Boolean(process.env[model.envKey]));
	const cases = options.cases ?? AGENT_APP_BENCHMARK_CASES;
	if (models.length === 0) {
		throw new Error("No API keys found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, and/or GEMINI_API_KEY.");
	}

	const runs: AppModelEvalRun[] = [];
	for (const model of models) {
		for (const testCase of cases) {
			for (const condition of ["point", "typescript"] as const) {
				const brokenSource = loadAppFixture(testCase.brokenFile);
				const goldenSource = loadAppFixture(testCase.goldenFile);
				const diagnostic = runCheckJson(brokenSource).diagnostics[0] as PointCoreDiagnostic;
				const mode = evalModeForCase(testCase);
				const { prompt, contextChars, contextTokens } = buildAppEvalPrompt(testCase, condition);
				const typescript = resolveTypescriptContext(testCase);
				const reportedContextTokens =
					condition === "point"
						? estimateTokens(
								serializeCheckJson({
									schemaVersion: "point.core.check.v1",
									ok: false,
									diagnostics: [diagnostic],
								}),
							)
						: typescript.tokens;
				const started = performance.now();
				const run: AppModelEvalRun = {
					modelId: model.id,
					modelLabel: model.label,
					provider: model.provider,
					caseId: testCase.id,
					category: testCase.category,
					condition,
					mode,
					success: false,
					checkPassed: false,
					contextChars: condition === "point" ? contextChars : typescript.chars,
					contextTokens: reportedContextTokens,
					promptTokens: null,
					completionTokens: null,
					latencyMs: 0,
					stepsUsed: 1,
					editCount: 0,
					modelResponseExcerpt: null,
					error: null,
				};
				try {
					const maxTokens = mode === "multi-edit" ? 900 : 400;
					const result = await callModel(model, prompt, maxTokens);
					run.latencyMs = Math.round(performance.now() - started);
					run.promptTokens = result.promptTokens;
					run.completionTokens = result.completionTokens;
					run.modelResponseExcerpt = result.text.slice(0, 320);
					const parsed = parseAppModelResponse(result.text, mode);
					const candidate = applyAppModelResponse(brokenSource, mode, parsed, diagnostic);
					run.editCount = mode === "multi-edit" ? (parsed.edits?.length ?? 0) : parsed.fixedLine ? 1 : 0;
					run.checkPassed = verifyPointSource(candidate);
					run.success = run.checkPassed;
					if (!run.checkPassed) {
						run.error = "point check failed after applying model edits";
					} else if (candidate !== goldenSource && mode === "single-line") {
						const goldenLine = applyLineRepairFromGolden(brokenSource, goldenSource, diagnostic);
						if (goldenLine !== candidate) {
							run.error = "check passed (alternate valid fix)";
						}
					}
					if (mode === "multi-edit" && !parsed.edits?.length) {
						run.error = "Model JSON missing edits";
						run.success = false;
						run.checkPassed = false;
					}
					if (mode === "single-line" && !parsed.fixedLine) {
						run.error = "Model JSON missing fixedLine";
						run.success = false;
						run.checkPassed = false;
					}
				} catch (error) {
					run.latencyMs = Math.round(performance.now() - started);
					run.error = error instanceof Error ? error.message : String(error);
				}
				runs.push(run);
				console.log(
					`${model.label} · ${testCase.id} · ${condition} · ${mode}: ${run.success ? "PASS" : "FAIL"}${run.error ? ` (${run.error})` : ""}`,
				);
			}
		}
	}

	const report: AppModelEvalReport = {
		schemaVersion: "point.agent-app-model-eval.v1",
		generatedAt: new Date().toISOString(),
		methodology:
			"Full-app fixtures (~84–105 lines). App-repair uses single-line JSON; feature-add uses multi-edit JSON with numbered source. Success = point check passes (same gate as CI). TS workflow adds measured Next.js scaffold paste.",
		models: models.map((model) => model.id),
		cases: cases.map((testCase) => testCase.id),
		runs,
		summary: summarizeAppRuns(runs),
	};

	if (options.outputPath) {
		mkdirSync(join(options.outputPath, ".."), { recursive: true });
		writeFileSync(options.outputPath, `${JSON.stringify(report, null, 2)}\n`);
	}

	return report;
}

export function verifyGoldenEditsPass(testCase: AgentAppBenchmarkCase): boolean {
	const brokenSource = loadAppFixture(testCase.brokenFile);
	const edits = goldenEditsForCase(testCase);
	const candidate = applyAppEdits(brokenSource, edits);
	try {
		return checkPointCore(parsePointSource(candidate)).length === 0;
	} catch {
		return false;
	}
}
