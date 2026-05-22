const vscode = require("vscode");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

const LOCAL_POINT_CLI_REL = "node_modules/@hatchingpoint/point/src/cli.ts";
const LOCAL_POINT_BIN_REL =
	process.platform === "win32" ? "node_modules/.bin/point.cmd" : "node_modules/.bin/point";

/** @type {LanguageClient | undefined} */
let client;

function activate(context) {
	const serverOptions = resolveServerOptions();
	if (!serverOptions) {
		if (!warnedMissingCli) {
			warnedMissingCli = true;
			void vscode.window.showWarningMessage(
				"Point CLI not found. Run bun install in this project, install @hatchingpoint/point globally, or set point.cliPath.",
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

	for (const root of workspaceRoots()) {
		const local = resolveLocalCli(root);
		if (local) return local;
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

function workspaceRoots() {
	const roots = new Set();
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		roots.add(folder.uri.fsPath);
	}
	const activeDoc = vscode.window.activeTextEditor?.document.uri.fsPath;
	if (activeDoc) {
		let dir = path.dirname(activeDoc);
		for (let depth = 0; depth < 8; depth += 1) {
			roots.add(dir);
			const parent = path.dirname(dir);
			if (parent === dir) break;
			dir = parent;
		}
	}
	return [...roots];
}

function resolveLocalCli(workspaceRoot) {
	const localPackageCli = path.join(workspaceRoot, LOCAL_POINT_CLI_REL);
	if (fs.existsSync(localPackageCli)) {
		return { command: "bun", argsPrefix: [localPackageCli] };
	}
	const localBin = path.join(workspaceRoot, LOCAL_POINT_BIN_REL);
	if (fs.existsSync(localBin)) {
		return { command: localBin, argsPrefix: [] };
	}
	const launcher = path.join(workspaceRoot, ".point/lsp.mjs");
	if (fs.existsSync(launcher)) {
		return { command: "bun", argsPrefix: [launcher, "lsp"] };
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

module.exports = { activate, deactivate, resolveCli, resolveServerOptions, findOnPath, resolveLocalCli, workspaceRoots };
