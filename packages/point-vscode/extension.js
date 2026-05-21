const vscode = require("vscode");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");

function activate(context) {
	const diagnostics = vscode.languages.createDiagnosticCollection("point");
	context.subscriptions.push(diagnostics);

	const refresh = (document) => {
		if (document.languageId !== "point" || document.isUntitled) return;
		const result = runPoint(["check-json", document.fileName], document);
		if (!result) {
			diagnostics.delete(document.uri);
			return;
		}
		try {
			const parsed = JSON.parse(result);
			diagnostics.set(
				document.uri,
				(parsed.diagnostics || []).map((diagnostic) => {
					const span = diagnostic.span;
					const range = span
						? new vscode.Range(span.start.line - 1, span.start.column - 1, span.end.line - 1, span.end.column - 1)
						: new vscode.Range(0, 0, 0, 1);
					const item = new vscode.Diagnostic(range, diagnostic.message, vscode.DiagnosticSeverity.Error);
					item.code = diagnostic.code;
					item.source = diagnostic.ref;
					return item;
				}),
			);
		} catch {
			diagnostics.delete(document.uri);
		}
	};

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(refresh),
		vscode.workspace.onDidOpenTextDocument(refresh),
	);
	if (vscode.window.activeTextEditor) refresh(vscode.window.activeTextEditor.document);

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider("point", {
			provideDefinition(document, position) {
				const index = loadIndex(document);
				const symbol = symbolAtLine(index, position.line + 1);
				if (!symbol || !symbol.span) return undefined;
				return new vscode.Location(document.uri, new vscode.Position(symbol.span.start.line - 1, symbol.span.start.column - 1));
			},
		}),
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider("point", {
			provideDocumentSymbols(document) {
				const index = loadIndex(document);
				return (index.refs || [])
					.filter((symbol) => ["record", "calculation", "rule", "label", "action", "policy", "external", "view", "route", "workflow", "command"].includes(symbol.kind) && symbol.span)
					.map((symbol) => {
						const range = new vscode.Range(
							symbol.span.start.line - 1,
							symbol.span.start.column - 1,
							symbol.span.end.line - 1,
							symbol.span.end.column - 1,
						);
						return new vscode.DocumentSymbol(symbol.name, symbol.ref, vscode.SymbolKind.Function, range, range);
					});
			},
		}),
	);
}

function deactivate() {}

function loadIndex(document) {
	const result = runPoint(["index", document.fileName], document);
	if (!result) return { refs: [] };
	try {
		return JSON.parse(result);
	} catch {
		return { refs: [] };
	}
}

function symbolAtLine(index, line) {
	return (index.refs || []).find((symbol) => symbol.span && symbol.span.start.line <= line && symbol.span.end.line >= line);
}

function workspaceCwd(document) {
	const folder = vscode.workspace.getWorkspaceFolder(document.uri);
	return folder?.uri.fsPath ?? path.dirname(document.fileName);
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

function runPoint(args, document) {
	const resolved = resolveCli();
	if (!resolved) {
		if (!warnedMissingCli) {
			warnedMissingCli = true;
			void vscode.window.showWarningMessage(
				"Point CLI not found. Install Bun + clone the repo, npm i -g @hatchingpoint/point, or set point.cliPath in settings.",
			);
		}
		return null;
	}

	const cwd = workspaceCwd(document);
	const spawnArgs = [...resolved.argsPrefix, ...args];
	const result = cp.spawnSync(resolved.command, spawnArgs, {
		encoding: "utf8",
		cwd,
		env: process.env,
	});

	if (result.error) return null;
	if (result.status !== 0 && !result.stdout) return null;
	return result.stdout || null;
}

module.exports = { activate, deactivate, resolveCli, findOnPath };
