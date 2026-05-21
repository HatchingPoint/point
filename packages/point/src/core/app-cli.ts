import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FULL_STACK_TEMPLATE_REL = "examples/full-stack-template";

const APP_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

export function validateAppName(name: string): void {
	if (!name || !APP_NAME_PATTERN.test(name)) {
		throw new Error(`Invalid app name "${name}". Use lowercase letters, digits, and hyphens (e.g. my-app).`);
	}
}

export function locatePointToolkitRoot(startDir = dirname(fileURLToPath(import.meta.url))): string {
	let dir = startDir;
	for (;;) {
		if (existsSync(join(dir, FULL_STACK_TEMPLATE_REL))) return dir;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error(`Cannot locate Point toolkit root (${FULL_STACK_TEMPLATE_REL} missing). Run from the Point repo or install @hatchingpoint/point.`);
}

export function fullStackTemplateDir(toolkitRoot: string): string {
	return join(toolkitRoot, FULL_STACK_TEMPLATE_REL);
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
	templateDir: string;
	files: string[];
}

export async function scaffoldAppFromTemplate(
	appName: string,
	options: { cwd?: string; targetDir?: string; toolkitRoot?: string } = {},
): Promise<AppNewResult> {
	validateAppName(appName);
	const cwd = options.cwd ?? process.cwd();
	const toolkitRoot = options.toolkitRoot ?? locatePointToolkitRoot();
	const templateDir = fullStackTemplateDir(toolkitRoot);
	if (!existsSync(templateDir)) {
		throw new Error(`Full-stack template not found at ${templateDir}`);
	}
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
	return { appName, targetDir, templateDir, files };
}

export async function runAppNew(appName: string, targetDir?: string): Promise<void> {
	const result = await scaffoldAppFromTemplate(appName, { targetDir });
	console.log(`Point app new created ${result.appName} at ${result.targetDir.replaceAll("\\", "/")}`);
	console.log(`Copied ${result.files.length} files from ${result.templateDir.replaceAll("\\", "/")}`);
	console.log("Next: point check src/app.point && point build-ts src/app.point generated/app.ts");
}
