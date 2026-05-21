import { loadEnvLocal, publishMarketplaceExtension, requireEnv } from "./publish-lib.ts";

loadEnvLocal();
const pat = requireEnv("VSCE_PAT", "VSCE_PAT");

if (!process.env.SKIP_CI) {
	console.log("Running CI before marketplace publish...");
	await Bun.$`bun run ci`;
}

await publishMarketplaceExtension(pat);
console.log("Marketplace publish complete.");
