import { loadEnvLocal, publishNpmPackage, requireEnv } from "./publish-lib.ts";

loadEnvLocal();
const token = requireEnv("NPM_TOKEN", "NPM_TOKEN");

if (!process.env.SKIP_CI) {
	console.log("Running CI before npm publish...");
	await Bun.$`bun run ci`;
}

console.log("Publishing @hatchingpoint/point to npm...");
await publishNpmPackage(token, { verifyAuth: true });
console.log("npm publish complete.");
