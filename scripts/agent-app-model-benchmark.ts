#!/usr/bin/env bun
import { join } from "node:path";
import { DEFAULT_MODELS, runAppModelEval } from "./agent-app-model-eval.ts";

const repoRoot = join(import.meta.dir, "..");
const outputPath = join(repoRoot, "benchmarks/agent-app-model-results.json");
const requestedModels = process.argv.find((arg) => arg.startsWith("--models="))?.slice("--models=".length);

const models = (requestedModels
	? DEFAULT_MODELS.filter((model) => requestedModels.split(",").includes(model.id))
	: DEFAULT_MODELS
).filter((model) => Boolean(process.env[model.envKey]));

console.log("Point agent app — model evaluation");
console.log("==================================");
console.log(`Models: ${models.map((model) => model.label).join(", ") || "(none — set API keys)"}`);

try {
	const report = await runAppModelEval({ models, outputPath });
	console.log("");
	console.log(
		`Overall Point workflow: ${report.summary.overall.point.passed}/${report.summary.overall.point.total} (${report.summary.overall.point.rate}%)`,
	);
	console.log(
		`Overall TS workflow: ${report.summary.overall.typescript.passed}/${report.summary.overall.typescript.total} (${report.summary.overall.typescript.rate}%)`,
	);
	console.log(`Wrote ${outputPath}`);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
