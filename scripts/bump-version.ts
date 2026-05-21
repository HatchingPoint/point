import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./publish-lib.ts";

const bump = process.argv[2];
const noteIndex = process.argv.indexOf("--note");
const note = noteIndex >= 0 ? process.argv.slice(noteIndex + 1).join(" ").trim() : "";

if (!bump || !["patch", "minor", "major"].includes(bump)) {
	console.error("Usage: bun scripts/bump-version.ts patch|minor|major [--note \"changelog line\"]");
	process.exit(1);
}

const root = repoRoot();
const versionFiles = [
	join(root, "package.json"),
	join(root, "packages/point/package.json"),
	join(root, "packages/point-vscode/package.json"),
];

const current = JSON.parse(readFileSync(join(root, "packages/point/package.json"), "utf8")).version as string;
const next = bumpSemver(current, bump as "patch" | "minor" | "major");

for (const file of versionFiles) {
	const pkg = JSON.parse(readFileSync(file, "utf8"));
	pkg.version = next;
	writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

const changelogPath = join(root, "CHANGELOG.md");
const changelog = readFileSync(changelogPath, "utf8");
const entry = note
	? `## ${next}\n\n### Added\n\n- ${note}\n\n`
	: `## ${next}\n\n### Added\n\n- \n\n`;
const body = changelog.replace(/^# Changelog\n\n/, `# Changelog\n\n${entry}`);
writeFileSync(changelogPath, body.startsWith("# Changelog") ? body : `${entry}${changelog}`);

console.log(`Bumped ${current} → ${next}`);
console.log("Updated:");
for (const file of versionFiles) console.log(`  ${file.replace(`${root}\\`, "").replace(`${root}/`, "")}`);
console.log("  CHANGELOG.md");
console.log(`\nNext: commit, tag v${next}, push tag to trigger npm publish.`);

function bumpSemver(version: string, kind: "patch" | "minor" | "major"): string {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) throw new Error(`Unsupported version format: ${version}`);
	let major = Number(match[1]);
	let minor = Number(match[2]);
	let patch = Number(match[3]);
	if (kind === "major") {
		major += 1;
		minor = 0;
		patch = 0;
	} else if (kind === "minor") {
		minor += 1;
		patch = 0;
	} else {
		patch += 1;
	}
	return `${major}.${minor}.${patch}`;
}
