import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { editorConfigFiles } from "./editor-config.ts";
import { findPointProjectRoot } from "./resolve-cli.ts";
import { POINT_LOCK, POINT_MANIFEST, writePointLock, writePointManifest } from "./packages.ts";

const POINT_PACKAGE = "@hatchingpoint/point";
const DEFAULT_POINT_VERSION = "^0.1.36";

export interface PointInitResult {
	projectRoot: string;
	wrote: string[];
	skipped: string[];
	installed: boolean;
	pointEntry?: string;
}

export function parseInitArgs(args: string[]): {
	skipInstall: boolean;
	force: boolean;
	quiet: boolean;
	targetDir?: string;
} {
	const positional = args.filter((arg) => !arg.startsWith("-"));
	return {
		skipInstall: args.includes("--skip-install"),
		force: args.includes("--force"),
		quiet: args.includes("--quiet"),
		targetDir: positional[0],
	};
}

export async function runPointInit(args: string[], cwd = process.cwd()): Promise<PointInitResult> {
	const options = parseInitArgs(args);
	const projectRoot = options.targetDir ? resolve(cwd, options.targetDir) : (findPointProjectRoot(cwd) ?? resolve(cwd));
	const wrote: string[] = [];
	const skipped: string[] = [];

	await ensureEditorConfigs(projectRoot, options.force, wrote, skipped);
	await ensurePackageJson(projectRoot, options.force, wrote, skipped);
	await ensurePointManifest(projectRoot, wrote, skipped);

	let installed = false;
	if (!options.skipInstall && existsSync(join(projectRoot, "package.json"))) {
		installed = await installPointDependency(projectRoot, options.quiet);
	}

	const pointEntry = await findPointEntryFile(projectRoot);
	if (pointEntry) {
		await ensureCheckScript(projectRoot, pointEntry, options.force, wrote, skipped);
	}

	if (!options.quiet) {
		printInitNextSteps(projectRoot, installed, pointEntry);
	}

	return { projectRoot, wrote, skipped, installed, pointEntry };
}

async function ensureEditorConfigs(
	projectRoot: string,
	force: boolean,
	wrote: string[],
	skipped: string[],
): Promise<void> {
	for (const file of editorConfigFiles(projectRoot)) {
		const targetPath = join(projectRoot, file.relativePath);
		if (existsSync(targetPath) && !force) {
			skipped.push(relative(projectRoot, targetPath).replaceAll("\\", "/"));
			continue;
		}
		await mkdir(dirname(targetPath), { recursive: true });
		await writeFile(targetPath, file.content, "utf8");
		wrote.push(relative(projectRoot, targetPath).replaceAll("\\", "/"));
	}
}

async function ensurePackageJson(
	projectRoot: string,
	force: boolean,
	wrote: string[],
	skipped: string[],
): Promise<void> {
	const packagePath = join(projectRoot, "package.json");
	if (!existsSync(packagePath)) return;

	const pkg = JSON.parse(await Bun.file(packagePath).text()) as {
		devDependencies?: Record<string, string>;
	};
	const devDependencies = pkg.devDependencies ?? {};
	if (devDependencies[POINT_PACKAGE] && !force) {
		skipped.push("package.json devDependency");
		return;
	}
	devDependencies[POINT_PACKAGE] = devDependencies[POINT_PACKAGE] ?? DEFAULT_POINT_VERSION;
	pkg.devDependencies = devDependencies;
	await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
	if (!wrote.includes("package.json")) wrote.push("package.json");
}

async function ensurePointManifest(projectRoot: string, wrote: string[], skipped: string[]): Promise<void> {
	const manifestPath = join(projectRoot, POINT_MANIFEST);
	if (existsSync(manifestPath)) {
		skipped.push(POINT_MANIFEST);
		return;
	}
	const hasPointFiles = (await findPointFiles(projectRoot)).length > 0;
	if (!hasPointFiles) {
		skipped.push(`${POINT_MANIFEST} (no .point files found)`);
		return;
	}
	const name = projectRoot.split(/[/\\]/).pop() ?? "point-app";
	await writePointManifest({ name, version: "0.1.0", dependencies: {} }, projectRoot);
	await writePointLock({ schemaVersion: "point.lock.v1", packages: {} }, projectRoot);
	wrote.push(POINT_MANIFEST, POINT_LOCK);
}

async function installPointDependency(projectRoot: string, quiet: boolean): Promise<boolean> {
	const proc = Bun.spawn(["bun", "add", "-d", POINT_PACKAGE], {
		cwd: projectRoot,
		stdout: quiet ? "ignore" : "inherit",
		stderr: quiet ? "ignore" : "inherit",
	});
	const code = await proc.exited;
	return code === 0;
}

async function ensureCheckScript(
	projectRoot: string,
	pointEntry: string,
	force: boolean,
	wrote: string[],
	skipped: string[],
): Promise<void> {
	const packagePath = join(projectRoot, "package.json");
	if (!existsSync(packagePath)) return;
	const pkg = JSON.parse(await Bun.file(packagePath).text()) as { scripts?: Record<string, string> };
	const scripts = pkg.scripts ?? {};
	const checkCommand = `point check ${pointEntry.replaceAll("\\", "/")}`;
	if (scripts.check && !force) {
		skipped.push("package.json scripts.check");
		return;
	}
	scripts.check = checkCommand;
	pkg.scripts = scripts;
	await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
	if (!wrote.includes("package.json")) wrote.push("package.json scripts.check");
}

async function findPointEntryFile(projectRoot: string): Promise<string | undefined> {
	for (const candidate of ["src/app.point", "app.point", "main.point"]) {
		if (existsSync(join(projectRoot, candidate))) return candidate;
	}
	const files = await findPointFiles(projectRoot);
	return files.sort((a, b) => a.length - b.length)[0];
}

async function findPointFiles(projectRoot: string, maxDepth = 4): Promise<string[]> {
	const found: string[] = [];
	async function walk(dir: string, depth: number) {
		if (depth > maxDepth) return;
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "generated" || entry.name === "dist") {
				continue;
			}
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				await walk(fullPath, depth + 1);
				continue;
			}
			if (entry.isFile() && entry.name.endsWith(".point")) {
				found.push(relative(projectRoot, fullPath).replaceAll("\\", "/"));
			}
		}
	}
	await walk(projectRoot, 0);
	return found;
}

function printInitNextSteps(projectRoot: string, installed: boolean, pointEntry?: string): void {
	const relRoot = projectRoot.replaceAll("\\", "/");
	console.log(`Point init configured ${relRoot}`);
	console.log("");
	console.log("Next steps:");
	if (existsSync(join(projectRoot, "package.json")) && !installed) {
		console.log("  bun install");
	}
	console.log("  Open any .point file in your editor");
	console.log("");
	console.log("Editor setup (pick one):");
	console.log("  VS Code / Cursor — install recommended extension when prompted (.vscode/extensions.json)");
	console.log("  Neovim — dofile .point/editors/neovim.lua from your config");
	console.log("  Zed — merge .point/editors/zed.json into workspace settings");
	console.log("  Any LSP editor — run: bun .point/lsp.mjs lsp");
	console.log("  Terminal only — bun run check" + (pointEntry ? `  (checks ${pointEntry})` : ""));
	console.log("");
	console.log("See .point/editor.json for machine-readable editor hints.");
}
