import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { POINT_MANIFEST, type PointManifest } from "./packages.ts";

export const RUNTIME_OWNED = "owned";

export function isRuntimeOwnedManifest(manifest: PointManifest): boolean {
	return manifest.runtime === RUNTIME_OWNED;
}

export function findRuntimeOwnedProjectRoot(input: string, cwd = process.cwd()): string | null {
	const absolute = resolve(cwd, input);
	let dir = existsSync(absolute) && statSync(absolute).isDirectory() ? absolute : dirname(absolute);
	for (;;) {
		const manifestPath = join(dir, POINT_MANIFEST);
		if (existsSync(manifestPath)) {
			try {
				const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PointManifest;
				if (isRuntimeOwnedManifest(manifest)) return dir;
			} catch {
				// ignore invalid manifest
			}
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

export function isRuntimeNativeInput(input: string, cwd = process.cwd()): boolean {
	const relativeInput = relative(cwd, resolve(cwd, input)).replaceAll("\\", "/");
	if (relativeInput === "experiments/point-only" || relativeInput.startsWith("experiments/point-only/")) {
		return true;
	}
	return findRuntimeOwnedProjectRoot(input, cwd) !== null;
}
