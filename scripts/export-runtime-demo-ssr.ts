import { mkdir, writeFile } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { interpretCoreProgramEntry, interpretCoreProgramEntryAsync } from "../packages/point/runtime/interpreter/index.ts";
import { renderPointViewToHtml } from "../packages/point/runtime/index.ts";
import { renderPointUiClientScript } from "../packages/point/runtime/ssr/form-client.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../packages/point/src/core/cli.ts";
import { bundledTemplateDir, RUNTIME_SAAS_APP_TEMPLATE_ID } from "../packages/point/src/core/app-cli.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");

type DeploySignals = {
	hasBuildArtifact: boolean;
	hasPassingChecks: boolean;
	hasRollbackPlan: boolean;
	hasOwnerApproval: boolean;
};

type ReadinessEvaluation = {
	score: number;
	label: string;
	tone: string;
	summary: string;
};

async function checkedProgramFromFile(appPoint: string) {
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource(appPoint, await Bun.file(appPoint).text(), lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	const diagnostics = checkPointCore(program);
	if (diagnostics.length > 0) {
		throw new Error(`Cannot export runtime demo from unchecked program: ${diagnostics.length} diagnostic(s).`);
	}
	return program;
}

function signalKey(signals: DeploySignals): string {
	return [
		signals.hasBuildArtifact ? "1" : "0",
		signals.hasPassingChecks ? "1" : "0",
		signals.hasRollbackPlan ? "1" : "0",
		signals.hasOwnerApproval ? "1" : "0",
	].join("");
}

function evaluateReadiness(program: Awaited<ReturnType<typeof checkedProgramFromFile>>, signals: DeploySignals): ReadinessEvaluation {
	const score = interpretCoreProgramEntry(program, "deployReadinessScore", [signals]);
	if (typeof score !== "number") throw new Error("deploy readiness did not return a numeric score.");
	const label = interpretCoreProgramEntry(program, "readinessLabel", [score]);
	const tone = interpretCoreProgramEntry(program, "readinessToneLabel", [score]);
	const summary = interpretCoreProgramEntry(program, "readinessSummary", [signals]);
	if (typeof label !== "string" || typeof tone !== "string" || typeof summary !== "string") {
		throw new Error("readiness labels did not return text.");
	}
	return { score, label, tone, summary };
}

function stripReadinessSubmit(formHtml: string): string {
	return formHtml
		.replace(/\sdata-point-form-submit="[^"]*"/, "")
		.replace(/<button type="submit" class="point-button point-form-submit">[\s\S]*?<\/button>/, "");
}

async function exportRuntimeDemo() {
	const homeBasePoint = join(repoRoot, "experiments/point-only/src/app.point");
	const saasPoint = join(bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID), "src/app.point");
	const homeProgram = await checkedProgramFromFile(homeBasePoint);

	const emptySignals: DeploySignals = {
		hasBuildArtifact: false,
		hasPassingChecks: false,
		hasRollbackPlan: false,
		hasOwnerApproval: false,
	};
	const readinessFormHtml = stripReadinessSubmit(
		renderPointViewToHtml(homeProgram, "readiness form", [emptySignals, () => {}]),
	);

	const evaluations: Record<string, ReadinessEvaluation> = {};
	for (let mask = 0; mask < 16; mask++) {
		const signals: DeploySignals = {
			hasBuildArtifact: Boolean(mask & 8),
			hasPassingChecks: Boolean(mask & 4),
			hasRollbackPlan: Boolean(mask & 2),
			hasOwnerApproval: Boolean(mask & 1),
		};
		evaluations[signalKey(signals)] = evaluateReadiness(homeProgram, signals);
	}

	const oldDatabaseUrl = process.env.DATABASE_URL;
	const oldPointSqlDatabase = process.env.POINT_SQL_DATABASE;
	const demoDbRoot = mkdtempSync(join(tmpdir(), "point-runtime-demo-db-"));
	process.env.DATABASE_URL = `sqlite:${join(demoDbRoot, "members.db")}`;
	delete process.env.POINT_SQL_DATABASE;
	let saasMembersHtml = "";
	let saasLoginHtml = "";
	try {
		const saasProgram = await checkedProgramFromFile(saasPoint);
		await interpretCoreProgramEntryAsync(saasProgram, "initDatabaseCommand", []);
		saasMembersHtml = renderPointViewToHtml(saasProgram, "members list");
		saasLoginHtml = renderPointViewToHtml(saasProgram, "login form", [{ email: "", password: "" }, () => {}]);
	} finally {
		rmSync(demoDbRoot, { recursive: true, force: true });
		if (oldDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = oldDatabaseUrl;
		if (oldPointSqlDatabase === undefined) delete process.env.POINT_SQL_DATABASE;
		else process.env.POINT_SQL_DATABASE = oldPointSqlDatabase;
	}

	const payload = {
		version: 1,
		generatedAt: new Date().toISOString(),
		uiClientScript: renderPointUiClientScript(),
		readiness: {
			source: "experiments/point-only/src/app.point",
			formHtml: readinessFormHtml,
			fields: ["hasBuildArtifact", "hasPassingChecks", "hasRollbackPlan", "hasOwnerApproval"],
			evaluations,
		},
		saas: {
			source: "packages/point/templates/runtime-saas-app/src/app.point",
			membersHtml: saasMembersHtml,
			loginHtml: saasLoginHtml,
		},
	};

	const outputArg = process.argv.find((arg) => arg.startsWith("--out="))?.slice("--out=".length);
	if (outputArg) {
		await mkdir(dirname(outputArg), { recursive: true });
		await writeFile(outputArg, `${JSON.stringify(payload, null, 2)}\n`);
	} else {
		process.stdout.write(`${JSON.stringify(payload)}\n`);
	}
}

await exportRuntimeDemo();
