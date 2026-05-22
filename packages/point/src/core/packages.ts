import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
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

export interface ParsedNpmLocator {
	name: string;
	version?: string;
}

export function parseNpmLocator(locator: string): ParsedNpmLocator {
	if (locator.startsWith("@")) {
		const slash = locator.indexOf("/");
		if (slash < 0) {
			throw new Error(`Invalid npm package name "${locator}". Scoped packages use @scope/name.`);
		}
		const rest = locator.slice(slash + 1);
		const versionAt = rest.indexOf("@");
		if (versionAt >= 0) {
			return { name: `${locator.slice(0, slash + 1 + versionAt)}`, version: rest.slice(versionAt + 1) };
		}
		return { name: locator };
	}
	const versionAt = locator.lastIndexOf("@");
	if (versionAt > 0) {
		return { name: locator.slice(0, versionAt), version: locator.slice(versionAt + 1) };
	}
	return { name: locator };
}

export function parseDependencySpec(spec: string): ParsedDependencySpec {
	if (spec.startsWith("workspace:")) return { kind: "workspace", locator: spec.slice("workspace:".length) };
	if (spec.startsWith("file:")) return { kind: "file", locator: spec.slice("file:".length) };
	if (spec.startsWith("npm:")) return { kind: "npm", locator: spec.slice("npm:".length) };
	throw new Error(`Invalid dependency spec "${spec}". Use workspace:<path>, file:<path>, or npm:<package>[@version].`);
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

export function locatePointPackageRoot(pkgDir: string): string {
	if (existsSync(join(pkgDir, POINT_MANIFEST))) return pkgDir;
	const srcDir = join(pkgDir, "src");
	if (existsSync(srcDir) && readdirSync(srcDir).some((name) => name.endsWith(".point"))) return pkgDir;
	if (readdirSync(pkgDir).some((name) => name.endsWith(".point"))) return pkgDir;
	throw new Error(`Point package at ${pkgDir} has no ${POINT_MANIFEST} or src/*.point modules`);
}

export function resolveNpmPackagePath(cwd: string, packageName: string): string | null {
	const direct = join(cwd, "node_modules", ...packageName.split("/"));
	if (existsSync(join(direct, "package.json"))) return direct;
	try {
		const req = createRequire(join(cwd, "package.json"));
		const pkgJson = req.resolve(`${packageName}/package.json`);
		return resolve(pkgJson, "..");
	} catch {
		return null;
	}
}

async function readInstalledNpmVersion(pkgDir: string): Promise<string | null> {
	const pkgJsonPath = join(pkgDir, "package.json");
	if (!existsSync(pkgJsonPath)) return null;
	const pkg = (await Bun.file(pkgJsonPath).json()) as { version?: string };
	return pkg.version ?? null;
}

export async function ensureNpmPackage(cwd: string, packageName: string, version?: string): Promise<string> {
	const installed = resolveNpmPackagePath(cwd, packageName);
	if (installed) {
		const installedVersion = await readInstalledNpmVersion(installed);
		if (!version || installedVersion === version) return installed;
	}
	const installSpec = version ? `${packageName}@${version}` : packageName;
	const bunResult = await Bun.$`bun add ${installSpec} --cwd ${cwd} --no-save`.quiet().nothrow();
	if (bunResult.exitCode !== 0) {
		const npmResult = await Bun.$`npm install ${installSpec} --prefix ${cwd} --no-save --no-package-lock`.quiet().nothrow();
		if (npmResult.exitCode !== 0) {
			const detail =
				npmResult.stderr.toString().trim() ||
				npmResult.stdout.toString().trim() ||
				bunResult.stderr.toString().trim() ||
				bunResult.stdout.toString().trim();
			throw new Error(`Registry install failed for ${installSpec}: ${detail || "unknown error"}`);
		}
	}
	const resolved = resolveNpmPackagePath(cwd, packageName);
	if (!resolved) {
		throw new Error(`npm package "${packageName}" was not found under node_modules/ after install`);
	}
	if (version) {
		const installedVersion = await readInstalledNpmVersion(resolved);
		if (installedVersion && installedVersion !== version) {
			throw new Error(`npm package "${packageName}" resolved to ${installedVersion}, expected ${version}`);
		}
	}
	return resolved;
}

export async function resolveNpmDependencySpec(spec: string, cwd = process.cwd()): Promise<PointLockPackage> {
	const parsed = parseDependencySpec(spec);
	if (parsed.kind !== "npm") throw new Error(`Expected npm: spec, got ${spec}`);
	const { name, version } = parseNpmLocator(parsed.locator);
	const pkgDir = await ensureNpmPackage(cwd, name, version);
	locatePointPackageRoot(pkgDir);
	const npmVersion = (await readInstalledNpmVersion(pkgDir)) ?? version ?? "npm";
	return { version: npmVersion, path: normalizePackagePath(cwd, pkgDir) };
}

export async function resolveDependencySpec(spec: string, cwd = process.cwd()): Promise<PointLockPackage> {
	const parsed = parseDependencySpec(spec);
	if (parsed.kind === "npm") return resolveNpmDependencySpec(spec, cwd);
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
		packages[name] = await resolveDependencySpec(spec, cwd);
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

function modulePathCandidates(root: string, modulePath: string): string[] {
	const segments = modulePath.replaceAll(".", "/");
	return [`${root}/${segments}.point`, `${root}/src/${segments}.point`];
}

export function modulePathFromLock(lock: PointLock | null, moduleName: string, cwd = process.cwd()): string {
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
	for (const candidate of modulePathCandidates(root, modulePath)) {
		if (existsSync(join(cwd, candidate))) return candidate;
	}
	return modulePathCandidates(root, modulePath)[0]!;
}
