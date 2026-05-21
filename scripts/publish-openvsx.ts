import { loadEnvLocal, publishOpenVsxExtension, requireEnv } from "./publish-lib.ts";

loadEnvLocal();
const pat = requireEnv("OPENVSX_PAT", "OPENVSX_PAT");

if (!process.env.SKIP_CI) {
	console.log("Running CI before Open VSX publish...");
	await Bun.$`bun run ci`;
}

await publishOpenVsxExtension(pat);
console.log("Open VSX publish complete.");
