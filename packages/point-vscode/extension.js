const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");

function activate(context) {
	const diagnostics = vscode.languages.createDiagnosticCollection("point");
	context.subscriptions.push(diagnostics);

	const refresh = (document) => {
		if (document.languageId !== "point" || document.isUntitled) return;
		const result = runPoint(["check-json", document.fileName]);
		if (!result) return;
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
	};

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(refresh));
	if (vscode.window.activeTextEditor) refresh(vscode.window.activeTextEditor.document);

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider("point", {
			provideDefinition(document, position) {
				const index = loadIndex(document.fileName);
				const symbol = symbolAtLine(index, position.line + 1);
				if (!symbol || !symbol.span) return undefined;
				return new vscode.Location(document.uri, new vscode.Position(symbol.span.start.line - 1, symbol.span.start.column - 1));
			},
		}),
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider("point", {
			provideDocumentSymbols(document) {
				const index = loadIndex(document.fileName);
				return (index.refs || [])
					.filter((symbol) => ["record", "calculation", "rule", "label", "action", "policy", "external"].includes(symbol.kind) && symbol.span)
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

function loadIndex(fileName) {
	const result = runPoint(["index", fileName]);
	return result ? JSON.parse(result) : { refs: [] };
}

function symbolAtLine(index, line) {
	return (index.refs || []).find((symbol) => symbol.span && symbol.span.start.line <= line && symbol.span.end.line >= line);
}

function runPoint(args) {
	const cli = path.resolve(__dirname, "../point/src/cli.ts");
	const result = cp.spawnSync("bun", [cli, ...args], { encoding: "utf8" });
	return result.stdout || null;
}

module.exports = { activate, deactivate };
