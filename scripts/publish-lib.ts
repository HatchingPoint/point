import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function repoRoot(): string {
	return join(import.meta.dir, "..");
}

export function loadEnvLocal(root = repoRoot()): void {
	const envPath = join(root, ".env.local");
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

export function requireEnv(name: string, placeholder?: string): string {
	const value = process.env[name]?.trim();
	if (!value || value === name || (placeholder && value === placeholder)) {
		console.error(`Missing or invalid ${name}. Set it in the shell, .env.local, or GitHub secrets.`);
		process.exit(1);
	}
	return value;
}

export function npmrcPath(root = repoRoot()): string {
	return join(root, ".npmrc.publish");
}

export async function withNpmAuth<T>(token: string, run: (configPath: string) => Promise<T>): Promise<T> {
	const configPath = npmrcPath();
	writeFileSync(configPath, `//registry.npmjs.org/:_authToken=${token}\n`);
	try {
		return await run(configPath);
	} finally {
		if (existsSync(configPath)) unlinkSync(configPath);
	}
}

export async function publishNpmPackage(
	token: string,
	options: { verifyAuth?: boolean; packageDir?: string } = {},
): Promise<void> {
	const pkgDir = options.packageDir ?? join(repoRoot(), "packages/point");
	const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")) as { name: string; version: string };
	await withNpmAuth(token, async (configPath) => {
		if (options.verifyAuth) {
			const whoami = await Bun.$`npm whoami --userconfig ${configPath}`.cwd(pkgDir).text();
			console.log(`npm user: ${whoami.trim()}`);
		}
		console.log(`Publishing ${pkg.name}@${pkg.version}...`);
		try {
			await Bun.$`npm publish --access public --userconfig ${configPath}`.cwd(pkgDir);
		} catch (error) {
			const stdout =
				error instanceof Error && "stdout" in error ? String((error as { stdout?: unknown }).stdout ?? "") : "";
			const stderr =
				error instanceof Error && "stderr" in error ? String((error as { stderr?: unknown }).stderr ?? "") : "";
			const combined = `${stdout}\n${stderr}\n${error instanceof Error ? error.message : ""}`;
			if (/cannot publish over the previously published versions?/i.test(combined)) {
				console.log(`${pkg.name}@${pkg.version} already published — skipping.`);
				return;
			}
			throw error;
		}
	});
}

export async function publishMarketplaceExtension(pat: string): Promise<void> {
	const root = repoRoot();
	const extDir = join(root, "packages/point-vscode");
	console.log("Packaging VS Code extension...");
	await Bun.$`bun run vscode:package`.cwd(root);
	const pkg = JSON.parse(readFileSync(join(extDir, "package.json"), "utf8")) as { name: string; version: string };
	const vsixPath = join(extDir, `${pkg.name}-${pkg.version}.vsix`);
	if (!existsSync(vsixPath)) {
		throw new Error(`VSIX not found: ${vsixPath}`);
	}
	console.log(`Publishing ${vsixPath} to marketplace...`);
	// Use VSCE_PAT env var — avoids shell mangling special characters in --pat.
	try {
		await Bun.$`bunx --yes @vscode/vsce publish --packagePath ${vsixPath}`.cwd(extDir).env({
			...process.env,
			VSCE_PAT: pat,
		});
	} catch (error) {
		const stdout =
			error instanceof Error && "stdout" in error ? String((error as { stdout?: unknown }).stdout ?? "") : "";
		const stderr =
			error instanceof Error && "stderr" in error ? String((error as { stderr?: unknown }).stderr ?? "") : "";
		const combined = `${stdout}\n${stderr}\n${error instanceof Error ? error.message : ""}`;
		if (/already exists/i.test(combined)) {
			console.log(`Marketplace version ${pkg.version} already published — skipping.`);
			return;
		}
		throw error;
	}
}
