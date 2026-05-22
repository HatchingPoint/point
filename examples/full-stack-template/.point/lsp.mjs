#!/usr/bin/env bun
/**
 * Project-local Point language server launcher.
 * Any LSP-capable editor can run: bun .point/lsp.mjs lsp
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const localCli = join(projectRoot, "node_modules/@hatchingpoint/point/src/cli.ts");
const subcommand = process.argv[2] ?? "lsp";
const extraArgs = process.argv.slice(3);

if (existsSync(localCli)) {
	const child = spawn("bun", [localCli, subcommand, ...extraArgs], { stdio: "inherit" });
	child.on("exit", (code, signal) => {
		if (signal) process.kill(process.pid, signal);
		process.exit(code ?? 1);
	});
} else {
	const child = spawn("point", [subcommand, ...extraArgs], { stdio: "inherit" });
	child.on("exit", (code, signal) => {
		if (signal) process.kill(process.pid, signal);
		process.exit(code ?? 1);
	});
}
