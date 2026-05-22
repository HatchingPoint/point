#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	AGENT_REPAIR_CASES,
	AGENT_REPAIR_MULTISTEP_CASES,
	evaluateRepairSufficiency,
	evaluateMultistepRepair,
	runMultistepRepairBenchmark,
	runRepairSufficiencyBenchmark,
	summarizeTokenReduction,
} from "./agent-repair-sufficiency.ts";
import { DEFAULT_MODELS, runModelEval, type ModelEvalReport } from "./agent-repair-model-eval.ts";

const repoRoot = join(import.meta.dir, "..");
const skipModels = process.argv.includes("--skip-models");
const reportPath = join(repoRoot, "benchmarks/agent-repair-proof-report.json");

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

	console.log("Point agent repair — proof run");
	console.log("==============================");
	console.log(`Time: ${generatedAt}`);
	console.log("");

	const sufficiencyTest = await runTestFile("tests/agent-repair-sufficiency.test.ts");
	sections.push({
		title: "CI: check-json sufficiency (single-shot agent loop, no LLM)",
		verified: "ci",
		passed: sufficiencyTest.passed,
		detail: `${AGENT_REPAIR_CASES.length} fixtures · real check-json → golden line → point check`,
	});
	console.log(sufficiencyTest.passed ? "✓" : "✗", sections.at(-1)!.title);

	const multistepTest = await runTestFile("tests/agent-repair-multistep.test.ts");
	sections.push({
		title: "CI: repair-plan loop (check → fix → check again, no LLM)",
		verified: "ci",
		passed: multistepTest.passed,
		detail: `${AGENT_REPAIR_MULTISTEP_CASES.length} multistep fixture(s) · simulates rushed auto-coding scaffold`,
	});
	console.log(multistepTest.passed ? "✓" : "✗", sections.at(-1)!.title);

	const sufficiency = runRepairSufficiencyBenchmark();
	const sufficiencyOk = sufficiency.every((r) => r.passed);
	sections.push({
		title: "Measured: check-json context size per fixture",
		verified: "ci",
		passed: sufficiencyOk,
		detail: sufficiency
			.map((r) => `${r.id}: ${r.contextChars} chars (~${r.estimatedTokens} tok)`)
			.join("; "),
	});
	console.log(sufficiencyOk ? "✓" : "✗", "Token sizes from real CLI output");

	const tokenSummary = summarizeTokenReduction();
	sections.push({
		title: "Compared: Point check-json vs illustrative TS paste heuristic",
		verified: "estimated",
		passed: tokenSummary.minReductionPercent >= 75,
		detail: `${tokenSummary.minReductionPercent}–${tokenSummary.maxReductionPercent}% less context (avg ${tokenSummary.avgReductionPercent}%). TS paste sizes are heuristics, not logged agent traces.`,
	});
	console.log("~", sections.at(-1)!.detail);

	const multistep = runMultistepRepairBenchmark();
	const multistepOk = multistep.every((r) => r.passed);
	sections.push({
		title: "CI: multistep golden repair",
		verified: "ci",
		passed: multistepOk,
		detail: multistep.map((r) => `${r.id}: ${r.stepsApplied}/${r.expectedSteps} steps`).join("; "),
	});

	let modelReport: ModelEvalReport | null = null;
	const proofModels = process.env.PROOF_MODELS?.split(",").filter(Boolean);
	const models = (proofModels
		? DEFAULT_MODELS.filter((m) => proofModels.includes(m.id))
		: DEFAULT_MODELS.filter((m) => ["gpt-4.1", "claude-opus-4-6", "claude-sonnet-4-6"].includes(m.id))
	).filter((m) => Boolean(process.env[m.envKey]));
	if (!skipModels && models.length > 0) {
		console.log("");
		console.log(`Running live model benchmark (real API calls): ${models.map((m) => m.label).join(", ")}`);
		modelReport = await runModelEval({
			models,
			outputPath: join(repoRoot, "benchmarks/agent-repair-model-results.json"),
		});
		const checkPassed = modelReport.runs.filter((r) => r.checkPassed).length;
		const total = modelReport.runs.length;
		sections.push({
			title: "Live: frontier models — real API, point check verifier",
			verified: "live-model",
			passed: checkPassed / total >= 0.85,
			detail: `${checkPassed}/${total} runs pass point check · Point workflow ${modelReport.summary.overall.point.rate}% · TS workflow ${modelReport.summary.overall.typescript.rate}%`,
		});
		console.log("✓", sections.at(-1)!.detail);
	} else if (skipModels) {
		console.log("(skipped live model benchmark — omit --skip-models to run)");
	}

	const ciPassed = sections.filter((s) => s.verified === "ci").every((s) => s.passed);
	const overallOk = ciPassed;

	const report = {
		schemaVersion: "point.agent-repair-proof.v1",
		generatedAt,
		overallOk,
		ciPassed,
		sections,
		fixtureCounts: {
			singleShot: AGENT_REPAIR_CASES.length,
			multistep: AGENT_REPAIR_MULTISTEP_CASES.length,
			exported: AGENT_REPAIR_CASES.length + AGENT_REPAIR_MULTISTEP_CASES.length,
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
			"bun run proof:agent-repair",
			"bun test tests/agent-repair-sufficiency.test.ts tests/agent-repair-multistep.test.ts",
			"bun run benchmark:agent-repair-models",
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
	if (!overallOk) process.exit(1);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
