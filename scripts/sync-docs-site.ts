import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(repoRoot, "docs/site");
const targetDir = join(repoRoot, "apps/docs/src/content/docs");

if (!existsSync(sourceDir)) {
	throw new Error(`Missing docs source: ${sourceDir}`);
}

rmSync(targetDir, { force: true, recursive: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, {
	recursive: true,
	filter(source) {
		return !source.includes("/.DS_Store");
	},
});

console.log(`Synced docs/site -> apps/docs/src/content/docs`);
