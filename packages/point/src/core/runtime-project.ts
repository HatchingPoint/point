import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { PointCoreProgram } from "./ast.ts";
import { POINT_MANIFEST, type PointManifest } from "./packages.ts";

export const RUNTIME_OWNED = "owned";

const APP_SURFACE_KINDS = new Set(["route", "page", "navigation", "streamRoute", "sseRoute"]);

export function isRuntimeOwnedManifest(manifest: PointManifest): boolean {
	return manifest.runtime === RUNTIME_OWNED;
}

export function programHasAppSurface(program: PointCoreProgram): boolean {
	const semantic = program.semanticSource;
	if (!semantic) return false;
	return semantic.declarations.some((declaration) => APP_SURFACE_KINDS.has(declaration.kind));
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
	return findRuntimeOwnedProjectRoot(input, cwd) !== null;
}

export function shouldUseRuntimeExecution(input: string, program: PointCoreProgram, cwd = process.cwd()): boolean {
	return isRuntimeNativeInput(input, cwd) || programHasAppSurface(program);
}

export function removedLegacyAppHostMessage(command: string): string {
	return `${command} no longer supports emit/Vite app hosts. Use a runtime-owned app (point.json runtime: "owned") or author routes/pages in .point and run ${command} through packages/point/runtime/.`;
}
