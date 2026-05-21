import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export const POINT_MANIFEST = "point.json";
export const POINT_LOCK = "point.lock";
export const LOCK_SCHEMA = "point.lock.v1";

export interface PointManifest {
	name: string;
	version: string;
	dependencies?: Record<string, string>;
}

export interface PointLock {
	schemaVersion: typeof LOCK_SCHEMA;
	packages: Record<string, PointLockPackage>;
}

export interface PointLockPackage {
	version: string;
	path?: string;
	dependencies?: Record<string, string>;
}

export type DependencySpecKind = "workspace" | "file" | "npm";

export interface ParsedDependencySpec {
	kind: DependencySpecKind;
	locator: string;
}

export function parseDependencySpec(spec: string): ParsedDependencySpec {
	if (spec.startsWith("workspace:")) return { kind: "workspace", locator: spec.slice("workspace:".length) };
	if (spec.startsWith("file:")) return { kind: "file", locator: spec.slice("file:".length) };
	if (spec.startsWith("npm:")) return { kind: "npm", locator: spec.slice("npm:".length) };
	throw new Error(`Invalid dependency spec "${spec}". Use workspace:<path>, file:<path>, or npm:<package> (npm not yet supported).`);
}

export function npmDependencyNotSupportedMessage(spec: string): string {
	return `npm: registry dependencies are not supported yet (${spec}). Use workspace:<path> or file:<path> for local Point packages.`;
}

export async function readPointManifest(cwd = process.cwd()): Promise<PointManifest> {
	const path = join(cwd, POINT_MANIFEST);
	if (!existsSync(path)) throw new Error(`Missing ${POINT_MANIFEST} in ${cwd}`);
	return Bun.file(path).json() as Promise<PointManifest>;
}

export async function writePointManifest(manifest: PointManifest, cwd = process.cwd()): Promise<void> {
	const path = join(cwd, POINT_MANIFEST);
	await Bun.write(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function readPointLock(cwd = process.cwd()): Promise<PointLock | null> {
	const path = join(cwd, POINT_LOCK);
	if (!existsSync(path)) return null;
	const lock = (await Bun.file(path).json()) as PointLock;
	if (lock.schemaVersion !== LOCK_SCHEMA) {
		throw new Error(`Unsupported ${POINT_LOCK} schema: ${lock.schemaVersion}`);
	}
	return lock;
}

export async function writePointLock(lock: PointLock, cwd = process.cwd()): Promise<void> {
	const path = join(cwd, POINT_LOCK);
	await Bun.write(path, `${JSON.stringify(lock, null, 2)}\n`);
}

export function normalizePackagePath(cwd: string, rawPath: string): string {
	const absolute = resolve(cwd, rawPath);
	if (!existsSync(absolute)) {
		throw new Error(`Dependency path does not exist: ${rawPath}`);
	}
	return relative(cwd, absolute).split("\\").join("/") || ".";
}

export function resolveDependencySpec(spec: string, cwd = process.cwd()): PointLockPackage {
	const parsed = parseDependencySpec(spec);
	if (parsed.kind === "npm") throw new Error(npmDependencyNotSupportedMessage(spec));
	const path = normalizePackagePath(cwd, parsed.locator);
	return { version: parsed.kind, path };
}

export async function resolveLockFromManifest(manifest: PointManifest, cwd = process.cwd()): Promise<PointLock> {
	const packages: Record<string, PointLockPackage> = {
		[manifest.name]: {
			version: manifest.version,
			dependencies: manifest.dependencies ?? {},
		},
	};
	for (const [name, spec] of Object.entries(manifest.dependencies ?? {})) {
		packages[name] = resolveDependencySpec(spec, cwd);
		const entry = packages[name];
		if (!entry.path) continue;
		const nestedManifestPath = join(cwd, entry.path, POINT_MANIFEST);
		if (!existsSync(nestedManifestPath)) continue;
		const nested = (await Bun.file(nestedManifestPath).json()) as PointManifest;
		packages[nested.name] = {
			version: nested.version,
			dependencies: nested.dependencies ?? {},
		};
	}
	return { schemaVersion: LOCK_SCHEMA, packages };
}

export async function addPointDependency(name: string, spec: string, cwd = process.cwd()): Promise<{ manifest: PointManifest; lock: PointLock }> {
	if (!name || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
		throw new Error(`Invalid dependency name "${name}". Use an identifier like std or point-logic.`);
	}
	parseDependencySpec(spec);
	const manifest = await readPointManifest(cwd);
	manifest.dependencies = { ...(manifest.dependencies ?? {}), [name]: spec };
	const lock = await resolveLockFromManifest(manifest, cwd);
	await writePointManifest(manifest, cwd);
	await writePointLock(lock, cwd);
	return { manifest, lock };
}

export function packageRootFromLock(lock: PointLock | null, packageName: string): string | null {
	const entry = lock?.packages[packageName];
	if (entry?.path) return entry.path;
	if (!lock && packageName === "std") return "std";
	return null;
}

export function modulePathFromLock(lock: PointLock | null, moduleName: string): string {
	const dot = moduleName.indexOf(".");
	if (dot < 0) {
		throw new Error(`Use declarations without from must target package modules: ${moduleName}`);
	}
	const packageName = moduleName.slice(0, dot);
	const modulePath = moduleName.slice(dot + 1);
	const root = packageRootFromLock(lock, packageName);
	if (!root) {
		throw new Error(`Unknown package "${packageName}" in ${moduleName}. Add it with: point add ${packageName} <spec>`);
	}
	return `${root}/${modulePath.replaceAll(".", "/")}.point`;
}
