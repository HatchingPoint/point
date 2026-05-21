import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

loadEnvLocal();

const required = ["NPM_TOKEN", "VSCE_PAT"];
const missing = required.filter((name) => !process.env[name]?.trim() || process.env[name] === name);

if (missing.length > 0) {
	console.error(`Missing publish credentials: ${missing.join(", ")}`);
	console.error("Set them in the shell or in .env.local (see docs/publishing.md).");
	process.exit(1);
}

if (process.env.VSCE_PAT === "VSCE_PAT") {
	console.error("VSCE_PAT looks like a placeholder. Create a PAT at https://dev.azure.com and set the real token.");
	process.exit(1);
}

console.log("Running CI before publish...");
await Bun.$`bun run ci`;

console.log("Publishing @hatchingpoint/point to npm...");
await Bun.$`npm publish --access public`.cwd(join(import.meta.dir, "../packages/point")).env(process.env);

console.log("Packaging VS Code extension...");
await Bun.$`bun run vscode:package`;

console.log("Publishing VS Code extension to marketplace...");
await Bun.$`bunx --yes @vscode/vsce publish --pat ${process.env.VSCE_PAT}`.cwd(
	join(import.meta.dir, "../packages/point-vscode"),
);

console.log("Publish complete.");

function loadEnvLocal() {
	const envPath = join(import.meta.dir, "../.env.local");
	if (!existsSync(envPath)) return;
	for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
		if (!match) continue;
		const key = match[1]!;
		if (process.env[key]) continue;
		let value = match[2] ?? "";
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		process.env[key] = value;
	}
}
