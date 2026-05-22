#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	AGENT_APP_BENCHMARK_CASES,
	runAgentAppBenchmark,
	summarizeAppTokenReduction,
} from "./agent-app-benchmark.ts";
import { measureAllNextDashboardCases } from "./next-dashboard-context.ts";
import { DEFAULT_MODELS, runAppModelEval, type AppModelEvalReport } from "./agent-app-model-eval.ts";

const repoRoot = join(import.meta.dir, "..");
const skipModels = process.argv.includes("--skip-models");
const reportPath = join(repoRoot, "benchmarks/agent-app-proof-report.json");

type ProofSection = {
	title: string;
	verified: "ci" | "live-model" | "estimated";
	passed: boolean;
	detail: string;
};

async function runTestFile(path: string): Promise<{ passed: boolean; output: string }> {
	const proc = Bun.spawn(["bun", "test", path], {
		cwd: repoRoot,
		stdout: "pipe",
		stderr: "pipe",
	});
	const output = await new Response(proc.stdout).text();
	const err = await new Response(proc.stderr).text();
	const code = await proc.exited;
	return { passed: code === 0, output: output + err };
}

async function main() {
	const generatedAt = new Date().toISOString();
	const sections: ProofSection[] = [];

	console.log("Point agent app — proof run");
	console.log("===========================");
	console.log(`Time: ${generatedAt}`);
	console.log("");

	const benchmarkTest = await runTestFile("tests/agent-app-benchmark.test.ts");
	sections.push({
		title: "CI: full-app benchmark fixtures (check-json gate, no LLM)",
		verified: "ci",
		passed: benchmarkTest.passed,
		detail: `${AGENT_APP_BENCHMARK_CASES.length} cases · base/broken/golden apps from examples/app/dashboard`,
	});
	console.log(benchmarkTest.passed ? "✓" : "✗", sections.at(-1)!.title);

	const scaffoldTest = await runTestFile("tests/next-dashboard-scaffold.test.ts");
	sections.push({
		title: "CI: paired Next.js dashboard scaffold",
		verified: "ci",
		passed: scaffoldTest.passed,
		detail: `${measureAllNextDashboardCases().length} measured TS context bundles in benchmarks/next-dashboard/`,
	});
	console.log(scaffoldTest.passed ? "✓" : "✗", sections.at(-1)!.title);

	const modelEvalTest = await runTestFile("tests/agent-app-model-eval.test.ts");
	sections.push({
		title: "CI: app model eval prompts and golden edit verification",
		verified: "ci",
		passed: modelEvalTest.passed,
		detail: "Multi-edit JSON for feature-add · single-line for app-repair · no API calls",
	});
	console.log(modelEvalTest.passed ? "✓" : "✗", sections.at(-1)!.title);

	const results = runAgentAppBenchmark();
	const benchmarkOk = results.every((item) => item.passed);
	sections.push({
		title: "Measured: check-json context vs paired Next scaffold",
		verified: "ci",
		passed: benchmarkOk,
		detail: results
			.map((item) => `${item.id}: ${item.brokenCheckJsonTokens} tok vs ${item.tsContextTokens} tok (${item.tokenReductionPercent}% saved)`)
			.join("; "),
	});
	console.log(benchmarkOk ? "✓" : "✗", "Token comparison from real fixtures");

	const tokenSummary = summarizeAppTokenReduction();
	sections.push({
		title: "Compared: Point check-json vs measured Next.js scaffold",
		verified: "estimated",
		passed: tokenSummary.minReductionPercent >= 45,
		detail: `${tokenSummary.minReductionPercent}–${tokenSummary.maxReductionPercent}% less context (avg ${tokenSummary.avgReductionPercent}%). TS sizes are measured file bundles, not Cursor traces.`,
	});
	console.log("~", sections.at(-1)!.detail);

	let modelReport: AppModelEvalReport | null = null;
	const proofModels = process.env.PROOF_MODELS?.split(",").filter(Boolean);
	const models = (proofModels
		? DEFAULT_MODELS.filter((m) => proofModels.includes(m.id))
		: DEFAULT_MODELS.filter((m) => ["gpt-4.1", "claude-opus-4-6", "claude-sonnet-4-6"].includes(m.id))
	).filter((m) => Boolean(process.env[m.envKey]));
	if (!skipModels && models.length > 0) {
		console.log("");
		console.log(`Running live model benchmark (real API calls): ${models.map((m) => m.label).join(", ")}`);
		modelReport = await runAppModelEval({
			models,
			outputPath: join(repoRoot, "benchmarks/agent-app-model-results.json"),
		});
		const checkPassed = modelReport.runs.filter((r) => r.checkPassed).length;
		const total = modelReport.runs.length;
		sections.push({
			title: "Live: frontier models on full-app fixtures",
			verified: "live-model",
			passed: checkPassed / total >= 0.75,
			detail: `${checkPassed}/${total} runs pass point check · Point ${modelReport.summary.overall.point.rate}% · TS ${modelReport.summary.overall.typescript.rate}%`,
		});
		console.log("✓", sections.at(-1)!.detail);
	} else if (skipModels) {
		console.log("(skipped live model benchmark — omit --skip-models to run)");
	}

	const ciPassed = sections.filter((s) => s.verified === "ci").every((s) => s.passed);
	const report = {
		schemaVersion: "point.agent-app-proof.v1",
		generatedAt,
		overallOk: ciPassed,
		ciPassed,
		sections,
		fixtureCounts: {
			cases: AGENT_APP_BENCHMARK_CASES.length,
			nextDashboardVariants: measureAllNextDashboardCases().length,
		},
		tokenReductionPercent: tokenSummary,
		modelEval: modelReport
			? {
					generatedAt: modelReport.generatedAt,
					summary: modelReport.summary,
					models: modelReport.models,
				}
			: null,
		reproduce: [
			"bun run proof:agent-app",
			"bun test tests/agent-app-benchmark.test.ts tests/next-dashboard-scaffold.test.ts tests/agent-app-model-eval.test.ts",
			"bun run benchmark:agent-app-models",
		],
	};

	writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
	console.log("");
	console.log(`Wrote ${reportPath}`);
	console.log(ciPassed ? "CI PROOF PASSED (real tests, no LLM)" : "CI PROOF FAILED");
	if (modelReport) {
		const cp = modelReport.runs.filter((r) => r.checkPassed).length;
		console.log(`LIVE MODEL: ${cp}/${modelReport.runs.length} pass point check`);
	}
	if (!ciPassed) process.exit(1);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
