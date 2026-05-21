const vscode = require("vscode");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

/** @type {LanguageClient | undefined} */
let client;

function activate(context) {
	const serverOptions = resolveServerOptions();
	if (!serverOptions) {
		if (!warnedMissingCli) {
			warnedMissingCli = true;
			void vscode.window.showWarningMessage(
				"Point CLI not found. Install Bun + @hatchingpoint/point globally, clone the monorepo, or set point.cliPath.",
			);
		}
		return;
	}

	const trace = vscode.workspace.getConfiguration("point").get("trace.server") || "off";
	const clientOptions = {
		documentSelector: [{ language: "point", scheme: "file" }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher("**/*.point"),
		},
		outputChannelName: "Point Language Server",
		traceOutputChannel: vscode.window.createOutputChannel("Point LSP Trace"),
	};

	client = new LanguageClient("point", "Point Language Server", serverOptions, clientOptions);
	client.setTrace(trace);
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("point.trace.server") && client) {
				const nextTrace = vscode.workspace.getConfiguration("point").get("trace.server") || "off";
				client.setTrace(nextTrace);
			}
		}),
	);
	context.subscriptions.push({ dispose: () => void client?.stop() });
	void client.start();
}

function deactivate() {
	if (!client) return undefined;
	return client.stop();
}

function resolveServerOptions() {
	const resolved = resolveCli();
	if (!resolved) return null;

	const args = [...resolved.argsPrefix, "lsp"];
	return {
		run: { command: resolved.command, args, transport: TransportKind.stdio },
		debug: { command: resolved.command, args, transport: TransportKind.stdio },
	};
}

function resolveCli() {
	const config = vscode.workspace.getConfiguration("point");
	const override = (config.get("cliPath") || "").trim();
	const runtime = config.get("runtime") || "auto";

	if (override) {
		if (runtime === "point" || (!override.endsWith(".ts") && runtime !== "bun")) {
			return { command: override, argsPrefix: [] };
		}
		return { command: "bun", argsPrefix: [override] };
	}

	const bundledCandidates = [
		path.join(__dirname, "../point/src/cli.ts"),
		path.join(__dirname, "../../packages/point/src/cli.ts"),
	];
	for (const candidate of bundledCandidates) {
		if (fs.existsSync(candidate)) {
			return { command: "bun", argsPrefix: [candidate] };
		}
	}

	const onPath = findOnPath("point");
	if (onPath) {
		return { command: onPath, argsPrefix: [] };
	}

	return null;
}

function findOnPath(name) {
	const lookup = process.platform === "win32" ? "where" : "which";
	const result = cp.spawnSync(lookup, [name], { encoding: "utf8" });
	if (result.status !== 0) return null;
	const line = (result.stdout || "").split(/\r?\n/).find((entry) => entry.trim());
	return line?.trim() || null;
}

let warnedMissingCli = false;

module.exports = { activate, deactivate, resolveCli, resolveServerOptions, findOnPath };
