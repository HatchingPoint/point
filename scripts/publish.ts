import { loadEnvLocal, publishMarketplaceExtension, publishNpmPackage, requireEnv } from "./publish-lib.ts";

loadEnvLocal();
const npmToken = requireEnv("NPM_TOKEN", "NPM_TOKEN");
const vscePat = requireEnv("VSCE_PAT", "VSCE_PAT");

console.log("Running CI before publish...");
await Bun.$`bun run ci`;

console.log("Publishing @hatchingpoint/point to npm...");
await publishNpmPackage(npmToken, { verifyAuth: true });

await publishMarketplaceExtension(vscePat);

console.log("Publish complete.");
