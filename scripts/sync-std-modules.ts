import { cp, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const sourceDir = join(repoRoot, "std");
const targetDir = join(repoRoot, "packages/point/std");

if (!existsSync(sourceDir)) {
	console.error(`[sync-std-modules] Missing source ${sourceDir}`);
	process.exit(1);
}

await mkdir(targetDir, { recursive: true });
const entries = await readdir(sourceDir);
for (const entry of entries) {
	if (!entry.endsWith(".point")) continue;
	await cp(join(sourceDir, entry), join(targetDir, entry));
}
console.log(`[sync-std-modules] Synced ${entries.filter((e) => e.endsWith(".point")).length} std modules → ${targetDir}`);
