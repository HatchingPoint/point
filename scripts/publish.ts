import { join } from "node:path";
import { loadEnvLocal, publishMarketplaceExtension, publishNpmPackage, repoRoot, requireEnv } from "./publish-lib.ts";

loadEnvLocal();
const npmToken = requireEnv("NPM_TOKEN", "NPM_TOKEN");
const vscePat = requireEnv("VSCE_PAT", "VSCE_PAT");

console.log("Running CI before publish...");
await Bun.$`bun run ci`;

await publishNpmPackage(npmToken, { verifyAuth: true });
await publishNpmPackage(npmToken, {
	packageDir: join(repoRoot(), "packages/point-logic"),
});

await publishMarketplaceExtension(vscePat);

console.log("Publish complete.");
