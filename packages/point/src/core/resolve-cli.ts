import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const LOCAL_POINT_CLI_REL = "node_modules/@hatchingpoint/point/src/cli.ts";
export const LOCAL_POINT_BIN_REL =
	process.platform === "win32" ? "node_modules/.bin/point.cmd" : "node_modules/.bin/point";

export type PointCliSource = "override" | "local-package" | "local-bin" | "global" | "bundled";

export interface ResolvedPointCli {
	command: string;
	argsPrefix: string[];
	source: PointCliSource;
	root?: string;
}

export interface ResolvePointCliOptions {
	cwd?: string;
	cliPath?: string;
	runtime?: "auto" | "bun" | "point";
	bundledCandidates?: string[];
	findOnPath?: (name: string) => string | null;
}

export function resolvePointCli(options: ResolvePointCliOptions = {}): ResolvedPointCli | null {
	const cwd = resolve(options.cwd ?? process.cwd());
	const override = (options.cliPath ?? "").trim();
	const runtime = options.runtime ?? "auto";

	if (override) {
		return resolveOverrideCli(override, runtime);
	}

	const local = resolveLocalPointCli(cwd);
	if (local) return local;

	for (const candidate of options.bundledCandidates ?? []) {
		if (existsSync(candidate)) {
			return { command: "bun", argsPrefix: [candidate], source: "bundled" };
		}
	}

	const onPath = options.findOnPath?.("point");
	if (onPath) {
		return { command: onPath, argsPrefix: [], source: "global" };
	}

	return null;
}

export function resolveLocalPointCli(startDir: string): ResolvedPointCli | null {
	let dir = resolve(startDir);
	for (;;) {
		const localPackageCli = join(dir, LOCAL_POINT_CLI_REL);
		if (existsSync(localPackageCli)) {
			return { command: "bun", argsPrefix: [localPackageCli], source: "local-package", root: dir };
		}
		const localBin = join(dir, LOCAL_POINT_BIN_REL);
		if (existsSync(localBin)) {
			return { command: localBin, argsPrefix: [], source: "local-bin", root: dir };
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

export function findPointProjectRoot(startDir: string): string | null {
	let dir = resolve(startDir);
	for (;;) {
		if (existsSync(join(dir, "point.json")) || existsSync(join(dir, LOCAL_POINT_CLI_REL))) {
			return dir;
		}
		if (existsSync(join(dir, "package.json"))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

function resolveOverrideCli(override: string, runtime: "auto" | "bun" | "point"): ResolvedPointCli {
	if (runtime === "point" || (!override.endsWith(".ts") && runtime !== "bun")) {
		return { command: override, argsPrefix: [], source: "override" };
	}
	return { command: "bun", argsPrefix: [override], source: "override" };
}
