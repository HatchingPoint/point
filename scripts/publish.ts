const required = ["NPM_TOKEN", "VSCE_PAT"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
	console.error(`Missing publish credentials: ${missing.join(", ")}`);
	process.exit(1);
}

await Bun.$`bun run ci`;
await Bun.$`npm publish --access public`;
await Bun.$`bun run vscode:package`;
await Bun.$`echo "VS Code marketplace publish requires vsce with VSCE_PAT"`;
