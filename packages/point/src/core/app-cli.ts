import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_TEMPLATE_REL = "examples/full-stack-template";
export const DEFAULT_APP_TEMPLATE_ID = "full-stack-app";

const APP_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

export type AppTemplateSpec = {
	id: string;
	title: string;
	description: string;
	resolveDir: () => string;
};

export const APP_TEMPLATES: AppTemplateSpec[] = [
	{
		id: DEFAULT_APP_TEMPLATE_ID,
		title: "Full-stack admin app",
		description: "Layout, navigation, three pages, data loading, and CLI entry — SaaS admin starter",
		resolveDir: resolveFullStackTemplateDir,
	},
];

export function validateAppName(name: string): void {
	if (!name || !APP_NAME_PATTERN.test(name)) {
		throw new Error(`Invalid app name "${name}". Use lowercase letters, digits, and hyphens (e.g. my-app).`);
	}
}

export function locatePointToolkitRoot(startDir = dirname(fileURLToPath(import.meta.url))): string {
	let dir = startDir;
	for (;;) {
		if (existsSync(join(dir, REPO_TEMPLATE_REL))) return dir;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error(
		`Cannot locate Point repo template (${REPO_TEMPLATE_REL} missing). Install @hatchingpoint/point or run from the Point repository.`,
	);
}

export function bundledTemplateDir(templateId: string): string {
	return join(packageRoot, "templates", templateId);
}

export function resolveFullStackTemplateDir(): string {
	const bundled = bundledTemplateDir(DEFAULT_APP_TEMPLATE_ID);
	if (existsSync(bundled)) return bundled;
	const repoRoot = locatePointToolkitRoot();
	return join(repoRoot, REPO_TEMPLATE_REL);
}

export function fullStackTemplateDir(toolkitRoot?: string): string {
	if (toolkitRoot) return join(toolkitRoot, REPO_TEMPLATE_REL);
	return resolveFullStackTemplateDir();
}

export function resolveAppTemplate(templateId = DEFAULT_APP_TEMPLATE_ID): AppTemplateSpec {
	const template = APP_TEMPLATES.find((item) => item.id === templateId);
	if (!template) {
		const known = APP_TEMPLATES.map((item) => item.id).join(", ");
		throw new Error(`Unknown template "${templateId}". Available: ${known}`);
	}
	return template;
}

export function resolveAppTemplateDir(templateId = DEFAULT_APP_TEMPLATE_ID): string {
	const template = resolveAppTemplate(templateId);
	const dir = template.resolveDir();
	if (!existsSync(dir)) {
		throw new Error(`Template "${templateId}" not found at ${dir}`);
	}
	return dir;
}

export function parseCreateAppArgs(args: string[]): {
	appName: string;
	targetDir?: string;
	templateId: string;
	listTemplates: boolean;
} {
	let templateId = DEFAULT_APP_TEMPLATE_ID;
	let listTemplates = false;
	const positional: string[] = [];

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index]!;
		if (arg === "--list-templates" || arg === "--list") {
			listTemplates = true;
			continue;
		}
		if (arg === "--template" && args[index + 1]) {
			templateId = args[++index]!;
			continue;
		}
		if (arg.startsWith("--template=")) {
			templateId = arg.slice("--template=".length);
			continue;
		}
		if (arg.startsWith("-")) {
			throw new Error(`Unknown option: ${arg}`);
		}
		positional.push(arg);
	}

	return {
		appName: positional[0] ?? "",
		targetDir: positional[1],
		templateId,
		listTemplates,
	};
}

async function copyTemplateTree(sourceDir: string, targetDir: string, appName: string): Promise<string[]> {
	const written: string[] = [];
	const entries = await readdir(sourceDir, { withFileTypes: true });
	for (const entry of entries) {
		const sourcePath = join(sourceDir, entry.name);
		const targetPath = join(targetDir, entry.name);
		if (entry.isDirectory()) {
			await mkdir(targetPath, { recursive: true });
			written.push(...(await copyTemplateTree(sourcePath, targetPath, appName)));
			continue;
		}
		if (!entry.isFile()) continue;
		const raw = await Bun.file(sourcePath).text();
		const content = raw.replaceAll("{{APP_NAME}}", appName).replaceAll("full-stack-template", appName);
		await Bun.write(targetPath, content);
		written.push(targetPath);
	}
	return written;
}

export interface AppNewResult {
	appName: string;
	targetDir: string;
	templateId: string;
	templateDir: string;
	files: string[];
}

export async function scaffoldAppFromTemplate(
	appName: string,
	options: { cwd?: string; targetDir?: string; templateId?: string } = {},
): Promise<AppNewResult> {
	validateAppName(appName);
	const templateId = options.templateId ?? DEFAULT_APP_TEMPLATE_ID;
	const templateDir = resolveAppTemplateDir(templateId);
	const cwd = options.cwd ?? process.cwd();
	const targetDir = resolve(cwd, options.targetDir ?? appName);
	if (existsSync(targetDir)) {
		const info = await stat(targetDir);
		if (!info.isDirectory()) throw new Error(`Target path exists and is not a directory: ${targetDir}`);
		const existing = await readdir(targetDir);
		if (existing.length > 0) {
			throw new Error(`Target directory is not empty: ${targetDir}`);
		}
	} else {
		await mkdir(targetDir, { recursive: true });
	}
	const files = await copyTemplateTree(templateDir, targetDir, appName);
	return { appName, targetDir, templateId, templateDir, files };
}

function printCreateNextSteps(appName: string, targetDir: string): void {
	const relativeTarget = targetDir.replaceAll("\\", "/");
	console.log("");
	console.log("Next steps:");
	console.log(`  cd ${relativeTarget}`);
	console.log("  point check src/app.point");
	console.log("  point run src/app.point");
	console.log("");
	console.log("Edit src/app.point — your app lives entirely in Point source.");
	console.log("Docs: https://hatchingpoint.com/point/guide/quick-start");
}

export async function runCreateApp(args: string[]): Promise<void> {
	const parsed = parseCreateAppArgs(args);
	if (parsed.listTemplates) {
		console.log("Available templates:");
		for (const template of APP_TEMPLATES) {
			console.log(`  ${template.id.padEnd(16)} ${template.title} — ${template.description}`);
		}
		return;
	}
	if (!parsed.appName) {
		throw new Error("Usage: point create <name> [directory] [--template full-stack-app]");
	}
	const result = await scaffoldAppFromTemplate(parsed.appName, {
		targetDir: parsed.targetDir,
		templateId: parsed.templateId,
	});
	console.log(`Created ${result.appName} at ${result.targetDir.replaceAll("\\", "/")}`);
	console.log(`Template: ${result.templateId} (${result.files.length} files)`);
	printCreateNextSteps(result.appName, result.targetDir);
}

/** @deprecated Prefer `point create`. */
export async function runAppNew(appName: string, targetDir?: string, templateId = DEFAULT_APP_TEMPLATE_ID): Promise<void> {
	const result = await scaffoldAppFromTemplate(appName, { targetDir, templateId });
	console.log(`Point app new created ${result.appName} at ${result.targetDir.replaceAll("\\", "/")}`);
	console.log(`Copied ${result.files.length} files from ${result.templateDir.replaceAll("\\", "/")}`);
	printCreateNextSteps(result.appName, result.targetDir);
}
