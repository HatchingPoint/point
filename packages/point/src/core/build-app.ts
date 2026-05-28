import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { checkPointCore, type PointCoreDiagnostic } from "./check.ts";
import {
	createModuleGraphForFile,
	jsOutputFor,
	loadCoreFile,
	orderByDependencies,
	programWithDependencyDeclarations,
	programWithTypeScriptImports,
	tsOutputFor,
	tsxOutputFor,
} from "./cli.ts";
import { viteWebRoot } from "./dev.ts";
import { emitPointCoreJavaScript } from "./emit-javascript.ts";
import { emitPointCoreTypeScript } from "./emit-typescript.ts";
import { readPointLock } from "./packages.ts";
import { removedLegacyAppHostMessage } from "./runtime-project.ts";

export interface PointBuildAppResult {
	ok: boolean;
	entry: string;
	jsOutput: string;
	tsOutput: string;
	tsxOutput: string;
	distDir: string;
	diagnostics: PointCoreDiagnostic[];
}

function viteConfigPath(cwd: string): string | null {
	const candidates = ["web/vite.config.ts", "web/vite.config.js", "web/vite.config.mts"];
	for (const candidate of candidates) {
		const configPath = resolve(cwd, candidate);
		if (existsSync(configPath)) return configPath;
	}
	return null;
}

export async function buildPointApp(_entry: string, _cwd = process.cwd(), _options: { legacy?: boolean } = {}): Promise<PointBuildAppResult> {
	throw new Error(removedLegacyAppHostMessage("point build-app"));
}

export async function runPointBuildApp(entry: string, cwd = process.cwd(), options: { legacy?: boolean } = {}): Promise<void> {
	const result = await buildPointApp(entry, cwd, options);
	if (!result.ok) {
		console.error(JSON.stringify({ ok: false, diagnostics: result.diagnostics }, null, 2));
		process.exit(1);
	}
	console.log(`Point build-app wrote ${result.jsOutput.replaceAll("\\", "/")}`);
	console.log(`Point build-app wrote ${result.tsOutput.replaceAll("\\", "/")}`);
	console.log(`Point build-app wrote ${result.tsxOutput.replaceAll("\\", "/")}`);
	console.log(`Point build-app wrote ${result.distDir.replaceAll("\\", "/")}`);
}
