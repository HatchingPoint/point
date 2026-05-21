import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

loadEnvLocal();

if (!process.env.NPM_TOKEN?.trim() || process.env.NPM_TOKEN === "NPM_TOKEN") {
	console.error("Missing NPM_TOKEN. Set it in the shell or in .env.local (see docs/publishing.md).");
	process.exit(1);
}

const pkgDir = join(import.meta.dir, "../packages/point");
const npmrcPath = join(import.meta.dir, "../.npmrc.publish");
writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}\n`);

try {
	console.log("Checking npm auth...");
	const whoami = await Bun.$`npm whoami --userconfig ${npmrcPath}`.cwd(pkgDir).text();
	console.log(`npm user: ${whoami.trim()}`);

	console.log("Running CI before npm publish...");
	await Bun.$`bun run ci`;

	console.log("Publishing @hatchingpoint/point to npm...");
	await Bun.$`npm publish --access public --userconfig ${npmrcPath}`.cwd(pkgDir);

	console.log("npm publish complete.");
} finally {
	if (existsSync(npmrcPath)) unlinkSync(npmrcPath);
}

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
