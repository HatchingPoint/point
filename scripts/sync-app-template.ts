import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const sourceDir = join(repoRoot, "examples/full-stack-template");
const targetDir = join(repoRoot, "packages/point/templates/full-stack-app");

if (!existsSync(sourceDir)) {
	console.error(`[sync-app-template] Missing source ${sourceDir}`);
	process.exit(1);
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true });
console.log(`[sync-app-template] Synced ${sourceDir} → ${targetDir}`);
