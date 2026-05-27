import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { viteWebRoot } from "./dev.ts";
import { POINT_MANIFEST, type PointManifest } from "./packages.ts";
import { findRuntimeOwnedProjectRoot, isRuntimeOwnedManifest } from "./runtime-project.ts";

export function findPointProjectRoot(input: string, cwd = process.cwd()): string | null {
	const absolute = resolve(cwd, input);
	let dir = existsSync(absolute) && statSync(absolute).isDirectory() ? absolute : dirname(absolute);
	for (;;) {
		if (existsSync(join(dir, POINT_MANIFEST))) return dir;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

export function hasLegacyViteWebHost(projectRoot: string): boolean {
	return viteWebRoot(projectRoot) !== null;
}

export function isLegacyViteAppProject(input: string, cwd = process.cwd()): boolean {
	if (findRuntimeOwnedProjectRoot(input, cwd)) return false;
	const projectRoot = findPointProjectRoot(input, cwd) ?? cwd;
	if (!hasLegacyViteWebHost(projectRoot)) return false;
	const manifestPath = join(projectRoot, POINT_MANIFEST);
	if (!existsSync(manifestPath)) return true;
	try {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PointManifest;
		return !isRuntimeOwnedManifest(manifest);
	} catch {
		return true;
	}
}

export function legacyViteAppWorkflowMessage(command: string): string {
	return `${command} for emit/Vite app hosts is legacy. Pass --legacy to opt in, or use a runtime-owned app (point.json runtime: "owned") with point dev / point serve through packages/point/runtime.`;
}

export function assertLegacyViteAppWorkflowAllowed(
	command: string,
	input: string,
	options: { legacy?: boolean; cwd?: string } = {},
): void {
	if (!isLegacyViteAppProject(input, options.cwd)) return;
	if (!options.legacy) {
		throw new Error(legacyViteAppWorkflowMessage(command));
	}
	console.warn(
		`Warning: ${command} uses the legacy emit/Vite app host and will be removed in a future release. Prefer runtime-owned apps.`,
	);
}

export function parseLegacyCliFlag(args: string[]): { legacy: boolean; rest: string[] } {
	let legacy = false;
	const rest: string[] = [];
	for (const arg of args) {
		if (arg === "--legacy") {
			legacy = true;
			continue;
		}
		rest.push(arg);
	}
	return { legacy, rest };
}
