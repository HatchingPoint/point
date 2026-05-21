import { createHash } from "node:crypto";
import { resolve } from "node:path";

const CACHE_DIR = ".point-cache";
const MANIFEST = "manifest.json";

export interface PointBuildCacheEntry {
	sourceHash: string;
	checkedAt: string;
	ok: boolean;
}

export interface PointBuildCacheManifest {
	schemaVersion: "point.cache.v1";
	entries: Record<string, PointBuildCacheEntry>;
}

export function hashPointSource(source: string): string {
	return createHash("sha256").update(source).digest("hex");
}

export async function readBuildCache(cwd = process.cwd()): Promise<PointBuildCacheManifest> {
	const path = resolve(cwd, CACHE_DIR, MANIFEST);
	if (!(await Bun.file(path).exists())) {
		return { schemaVersion: "point.cache.v1", entries: {} };
	}
	return Bun.file(path).json();
}

export async function writeBuildCache(manifest: PointBuildCacheManifest, cwd = process.cwd()): Promise<void> {
	const path = resolve(cwd, CACHE_DIR, MANIFEST);
	await Bun.$`mkdir -p ${resolve(cwd, CACHE_DIR)}`.quiet();
	await Bun.write(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function isIncrementalEnabled(): boolean {
	return process.env.POINT_INCREMENTAL === "1" || process.env.POINT_INCREMENTAL === "true";
}

export function isCacheHit(manifest: PointBuildCacheManifest, input: string, source: string): boolean {
	const entry = manifest.entries[input];
	return Boolean(entry && entry.sourceHash === hashPointSource(source) && entry.ok);
}

export function recordCacheEntry(manifest: PointBuildCacheManifest, input: string, source: string, ok: boolean): PointBuildCacheManifest {
	return {
		...manifest,
		entries: {
			...manifest.entries,
			[input]: { sourceHash: hashPointSource(source), checkedAt: new Date().toISOString(), ok },
		},
	};
}
