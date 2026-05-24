import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { modulePathFromLock, readPointLockSync } from "./packages.ts";

export function resolveUseDependencyInput(input: string, from: string, cwd = process.cwd()): string {
	const normalized = from.replaceAll("\\", "/");
	if (normalized.startsWith("./") || normalized.startsWith("../")) {
		const fromProjectRoot = resolve(cwd, normalized);
		if (existsSync(fromProjectRoot)) {
			return normalized;
		}
		const base = dirname(resolve(cwd, input));
		return resolve(base, from).replace(resolve(cwd), "").replace(/^[/\\]/, "");
	}
	return normalized;
}

export function resolveUseDependencyPath(input: string, from: string, cwd = process.cwd()): string {
	const relativeInput = resolveUseDependencyInput(input, from, cwd);
	return resolve(cwd, relativeInput);
}

export interface UseReference {
	moduleName: string;
	from?: string;
}

export function createUseSourceResolver(cwd: string, inputPath?: string) {
	const lock = readPointLockSync(cwd);
	return (use: UseReference, fromInputPath?: string): string | null => {
		try {
			const importerInput = fromInputPath ?? inputPath;
			let dependencyPath = use.from ?? modulePathFromLock(lock, use.moduleName, cwd);
			if (dependencyPath.startsWith("./") || dependencyPath.startsWith("../")) {
				const fromProjectRoot = resolve(cwd, dependencyPath);
				if (existsSync(fromProjectRoot)) {
					dependencyPath = fromProjectRoot;
				} else if (importerInput) {
					dependencyPath = resolveUseDependencyPath(importerInput, dependencyPath, cwd);
				} else {
					return null;
				}
			} else {
				dependencyPath = resolve(cwd, dependencyPath);
			}
			if (!existsSync(dependencyPath)) return null;
			return readFileSync(dependencyPath, "utf8");
		} catch {
			return null;
		}
	};
}

export function resolveUseDependencyInputPath(
	use: UseReference,
	importerInput: string | undefined,
	cwd: string,
): string | undefined {
	if (!importerInput) return undefined;
	const from = use.from ?? use.moduleName;
	if (!from.startsWith("./") && !from.startsWith("../")) {
		try {
			const lock = readPointLockSync(cwd);
			return resolve(cwd, modulePathFromLock(lock, use.moduleName, cwd));
		} catch {
			return undefined;
		}
	}
	return resolveUseDependencyPath(importerInput, from, cwd);
}
