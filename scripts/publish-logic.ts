import { join } from "node:path";
import { loadEnvLocal, publishNpmPackage, repoRoot, requireEnv } from "./publish-lib.ts";

loadEnvLocal();
const token = requireEnv("NPM_TOKEN", "NPM_TOKEN");

if (!process.env.SKIP_CI) {
	console.log("Running CI before point-logic publish...");
	await Bun.$`bun run ci`;
}

await publishNpmPackage(token, {
	verifyAuth: true,
	packageDir: join(repoRoot(), "packages/point-logic"),
});
console.log("point-logic npm publish complete.");
