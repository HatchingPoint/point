import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PointCoreDiagnostic } from "../packages/point/src/core/check.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import {
	AGENT_REPAIR_CASES,
	applyLineRepairFromGolden,
	estimateTokens,
	loadFixture,
	runCheckJson,
	serializeCheckJson,
	type AgentRepairCase,
} from "./agent-repair-sufficiency.ts";

export type EvalCondition = "point" | "typescript";

export type ModelSpec = {
	provider: "openai" | "anthropic" | "google";
	id: string;
	label: string;
	envKey: string;
};

export const DEFAULT_MODELS: ModelSpec[] = [
	{ provider: "openai", id: "gpt-4.1", label: "GPT-4.1", envKey: "OPENAI_API_KEY" },
	{ provider: "openai", id: "o4-mini", label: "o4-mini", envKey: "OPENAI_API_KEY" },
	{ provider: "openai", id: "gpt-4o", label: "GPT-4o", envKey: "OPENAI_API_KEY" },
	{ provider: "anthropic", id: "claude-opus-4-6", label: "Claude Opus 4.6", envKey: "ANTHROPIC_API_KEY" },
	{ provider: "anthropic", id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", envKey: "ANTHROPIC_API_KEY" },
	{ provider: "google", id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", envKey: "GEMINI_API_KEY" },
];

export type ModelEvalRun = {
	modelId: string;
	modelLabel: string;
	provider: ModelSpec["provider"];
	caseId: string;
	condition: EvalCondition;
	success: boolean;
	checkPassed: boolean;
	contextChars: number;
	contextTokens: number;
	promptTokens: number | null;
	completionTokens: number | null;
	latencyMs: number;
	fixedLine: string | null;
	modelResponseExcerpt: string | null;
	error: string | null;
};

export type ModelEvalReport = {
	schemaVersion: "point.agent-repair-model-eval.v1";
	generatedAt: string;
	methodology: string;
	models: string[];
	cases: string[];
	runs: ModelEvalRun[];
	summary: {
		overall: { point: SuccessRate; typescript: SuccessRate };
		byModel: Record<string, { point: SuccessRate; typescript: SuccessRate }>;
	};
};

type SuccessRate = {
	passed: number;
	total: number;
	rate: number;
};

export function buildEvalPrompt(
	testCase: AgentRepairCase,
	condition: EvalCondition,
): { prompt: string; context: string; contextChars: number; contextTokens: number } {
	const brokenSource = loadFixture(testCase.brokenFile);
	const payload = runCheckJson(brokenSource);
	const diagnostic = payload.diagnostics[0];
	if (!diagnostic?.span) {
		throw new Error(`Fixture ${testCase.id} missing diagnostic span`);
	}

	const lineNumber = diagnostic.span.start.line;
	const currentLine = brokenSource.split("\n")[lineNumber - 1] ?? "";

	let context = "";
	if (condition === "point") {
		const checkJson = serializeCheckJson({ schemaVersion: payload.schemaVersion, ok: false, diagnostics: [diagnostic] });
		context = `Workflow: Point agent loop (check-json only)

point check-json output:
${checkJson}

Patch target ref: ${diagnostic.ref}
Line ${lineNumber} currently reads:
${currentLine}`;
	} else {
		const ts = testCase.typescriptContext;
		context = `Workflow: TypeScript + chat paste

TypeScript files pasted into the agent context (~${ts.totalChars} chars total in real repos):
${ts.excerpt}

TypeScript compiler error:
${ts.tscError}

Authoritative Point source file to repair (edit this .point file, not the TypeScript):
${brokenSource}

Line ${lineNumber} currently reads:
${currentLine}`;
	}

	const prompt = `You are repairing a Point (.point) source file after an AI coding agent scaffolded a feature.

Agent task: ${testCase.agentTask}

Return ONLY valid JSON with this shape:
{"fixedLine":"<exact replacement for line ${lineNumber}>","reason":"<one short sentence>"}

Rules:
- fixedLine must be the full line text only (preserve indentation)
- for unknown-field errors, pick from expected and use Point field syntax with spaces (example: signals.has bundle id)
- for missing-await errors, follow the repair hint (await action calls or use the declared data binding)
- for unknown-load-action errors, pick the correct action name from expected
- for unknown-nav-page errors, pick the correct page name from expected
- for arity-mismatch errors, call the function with the expected number of arguments
- for operator-type-mismatch errors, use numeric operands where the repair hint says so
- do not wrap JSON in markdown fences
- do not return the whole file

${context}`;

	return {
		prompt,
		context,
		contextChars: context.length,
		contextTokens: estimateTokens(context),
	};
}

export function parseModelJson(text: string): { fixedLine?: string } {
	const trimmed = text.trim();
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const candidate = fenced?.[1]?.trim() ?? trimmed;
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");
	if (start === -1 || end === -1) return {};
	try {
		return JSON.parse(candidate.slice(start, end + 1)) as { fixedLine?: string };
	} catch {
		return {};
	}
}

export function applyFixedLine(source: string, lineNumber: number, fixedLine: string): string {
	const lines = source.split("\n");
	lines[lineNumber - 1] = fixedLine;
	return lines.join("\n");
}

export function verifyPointSource(source: string): boolean {
	try {
		return checkPointCore(parsePointSource(source)).length === 0;
	} catch {
		return false;
	}
}

function successRate(passed: number, total: number): SuccessRate {
	return { passed, total, rate: total === 0 ? 0 : Math.round((passed / total) * 100) };
}

export function summarizeRuns(runs: ModelEvalRun[]): ModelEvalReport["summary"] {
	const byModel: ModelEvalReport["summary"]["byModel"] = {};
	for (const run of runs) {
		byModel[run.modelId] ??= {
			point: successRate(0, 0),
			typescript: successRate(0, 0),
		};
		const bucket = byModel[run.modelId]![run.condition];
		bucket.total += 1;
		if (run.success) bucket.passed += 1;
		bucket.rate = bucket.total === 0 ? 0 : Math.round((bucket.passed / bucket.total) * 100);
	}

	const overallPoint = runs.filter((run) => run.condition === "point");
	const overallTs = runs.filter((run) => run.condition === "typescript");
	return {
		overall: {
			point: successRate(overallPoint.filter((run) => run.success).length, overallPoint.length),
			typescript: successRate(overallTs.filter((run) => run.success).length, overallTs.length),
		},
		byModel,
	};
}

async function callOpenAI(model: string, prompt: string, apiKey: string) {
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			temperature: 0,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: "You fix Point source files and return JSON only." },
				{ role: "user", content: prompt },
			],
		}),
	});
	if (!response.ok) {
		throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
	}
	const data = (await response.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
		usage?: { prompt_tokens?: number; completion_tokens?: number };
	};
	return {
		text: data.choices?.[0]?.message?.content ?? "",
		promptTokens: data.usage?.prompt_tokens ?? null,
		completionTokens: data.usage?.completion_tokens ?? null,
	};
}

async function callAnthropic(model: string, prompt: string, apiKey: string) {
	const response = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			max_tokens: 400,
			temperature: 0,
			system: "You fix Point source files and return JSON only.",
			messages: [{ role: "user", content: prompt }],
		}),
	});
	if (!response.ok) {
		throw new Error(`Anthropic ${response.status}: ${await response.text()}`);
	}
	const data = (await response.json()) as {
		content?: Array<{ type?: string; text?: string }>;
		usage?: { input_tokens?: number; output_tokens?: number };
	};
	const text = data.content?.find((part) => part.type === "text")?.text ?? "";
	return {
		text,
		promptTokens: data.usage?.input_tokens ?? null,
		completionTokens: data.usage?.output_tokens ?? null,
	};
}

async function callGoogle(model: string, prompt: string, apiKey: string) {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			generationConfig: { temperature: 0, responseMimeType: "application/json" },
			contents: [{ parts: [{ text: prompt }] }],
		}),
	});
	if (!response.ok) {
		throw new Error(`Google ${response.status}: ${await response.text()}`);
	}
	const data = (await response.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
		usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
	};
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
	return {
		text,
		promptTokens: data.usageMetadata?.promptTokenCount ?? null,
		completionTokens: data.usageMetadata?.candidatesTokenCount ?? null,
	};
}

async function callModel(model: ModelSpec, prompt: string): Promise<{ text: string; promptTokens: number | null; completionTokens: number | null }> {
	const apiKey = process.env[model.envKey];
	if (!apiKey) {
		throw new Error(`Missing ${model.envKey}`);
	}
	if (model.provider === "openai") return callOpenAI(model.id, prompt, apiKey);
	if (model.provider === "anthropic") return callAnthropic(model.id, prompt, apiKey);
	return callGoogle(model.id, prompt, apiKey);
}

export async function runModelEval(options: {
	models?: ModelSpec[];
	cases?: AgentRepairCase[];
	outputPath?: string;
}): Promise<ModelEvalReport> {
	const models = options.models ?? DEFAULT_MODELS.filter((model) => Boolean(process.env[model.envKey]));
	const cases = options.cases ?? AGENT_REPAIR_CASES;
	if (models.length === 0) {
		throw new Error("No API keys found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, and/or GEMINI_API_KEY.");
	}

	const runs: ModelEvalRun[] = [];
	for (const model of models) {
		for (const testCase of cases) {
			for (const condition of ["point", "typescript"] as const) {
				const brokenSource = loadFixture(testCase.brokenFile);
				const fixedSource = loadFixture(testCase.fixedFile);
				const diagnostic = runCheckJson(brokenSource).diagnostics[0] as PointCoreDiagnostic;
				const lineNumber = diagnostic.span!.start.line;
				const { prompt, contextChars } = buildEvalPrompt(testCase, condition);
				const reportedContextTokens =
					condition === "point"
						? estimateTokens(
								serializeCheckJson({
									schemaVersion: "point.core.check.v1",
									ok: false,
									diagnostics: [diagnostic],
								}),
							)
						: estimateTokens("x".repeat(testCase.typescriptContext.totalChars));
				const started = performance.now();
				let run: ModelEvalRun = {
					modelId: model.id,
					modelLabel: model.label,
					provider: model.provider,
					caseId: testCase.id,
					condition,
					success: false,
					checkPassed: false,
					contextChars: condition === "point" ? contextChars : testCase.typescriptContext.totalChars,
					contextTokens: reportedContextTokens,
					promptTokens: null,
					completionTokens: null,
					latencyMs: 0,
					fixedLine: null,
					modelResponseExcerpt: null,
					error: null,
				};
				try {
					const result = await callModel(model, prompt);
					run.latencyMs = Math.round(performance.now() - started);
					run.promptTokens = result.promptTokens;
					run.completionTokens = result.completionTokens;
					run.modelResponseExcerpt = result.text.slice(0, 240);
					const parsed = parseModelJson(result.text);
					if (!parsed.fixedLine) {
						run.error = "Model JSON missing fixedLine";
					} else {
						run.fixedLine = parsed.fixedLine;
						const candidate = applyFixedLine(brokenSource, lineNumber, parsed.fixedLine);
						run.checkPassed = verifyPointSource(candidate);
						const golden = applyLineRepairFromGolden(brokenSource, fixedSource, diagnostic);
						run.success = run.checkPassed && candidate === golden;
						if (!run.success && run.checkPassed) {
							run.error = "check passed but line differs from golden fixture";
						}
						if (!run.checkPassed) {
							run.error = "point check failed after applying model line";
						}
					}
				} catch (error) {
					run.latencyMs = Math.round(performance.now() - started);
					run.error = error instanceof Error ? error.message : String(error);
				}
				runs.push(run);
				console.log(
					`${model.label} · ${testCase.id} · ${condition}: ${run.success ? "PASS" : "FAIL"}${run.error ? ` (${run.error})` : ""}`,
				);
			}
		}
	}

	const report: ModelEvalReport = {
		schemaVersion: "point.agent-repair-model-eval.v1",
		generatedAt: new Date().toISOString(),
		methodology:
			"Each model receives either check-json only (Point) or TS paste + tsc error + full .point file (TypeScript). Success = applied fixedLine passes point check and matches the CI golden fixture line.",
		models: models.map((model) => model.id),
		cases: cases.map((testCase) => testCase.id),
		runs,
		summary: summarizeRuns(runs),
	};

	if (options.outputPath) {
		mkdirSync(join(options.outputPath, ".."), { recursive: true });
		writeFileSync(options.outputPath, `${JSON.stringify(report, null, 2)}\n`);
	}

	return report;
}
