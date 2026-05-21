import {
	analyzePointSource,
	completionsForPosition,
	definitionForPosition,
	formatPointDocument,
	hoverForPosition,
	lspPositionToPoint,
	outlineSymbols,
	prepareRenameAtPosition,
	renameSymbolInDocument,
	type LspRange,
} from "./analyze.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LspReader, writeMessage, type JsonRpcMessage } from "./protocol.ts";

type DocumentState = { version: number; text: string };

const documents = new Map<string, DocumentState>();

function lspVersion(): string {
	try {
		const pkgPath = join(import.meta.dir, "../../package.json");
		return (JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string }).version;
	} catch {
		return "0.0.0";
	}
}

export async function runPointLspServer(): Promise<void> {
	const reader = new LspReader();
	for await (const message of reader.messages()) {
		await handleMessage(message);
	}
}

async function handleMessage(message: JsonRpcMessage): Promise<void> {
	if (message.method === "initialize") {
		respond(message.id, {
			capabilities: {
				textDocumentSync: 1,
				documentSymbolProvider: true,
				definitionProvider: true,
				hoverProvider: true,
				documentFormattingProvider: true,
				completionProvider: { triggerCharacters: [".", " "] },
				renameProvider: { prepareProvider: true },
			},
			serverInfo: { name: "point-lsp", version: lspVersion() },
		});
		return;
	}

	if (message.method === "initialized" || message.method === "exit") {
		return;
	}

	if (message.method === "shutdown") {
		respond(message.id, null);
		return;
	}

	if (message.method === "textDocument/didOpen") {
		const params = message.params as { textDocument: { uri: string; version: number; text: string } };
		documents.set(params.textDocument.uri, { version: params.textDocument.version, text: params.textDocument.text });
		publishDiagnostics(params.textDocument.uri);
		return;
	}

	if (message.method === "textDocument/didChange") {
		const params = message.params as {
			textDocument: { uri: string; version: number };
			contentChanges: Array<{ text: string }>;
		};
		const change = params.contentChanges[0];
		if (!change) return;
		documents.set(params.textDocument.uri, { version: params.textDocument.version, text: change.text });
		publishDiagnostics(params.textDocument.uri);
		return;
	}

	if (message.method === "textDocument/didClose") {
		const params = message.params as { textDocument: { uri: string } };
		documents.delete(params.textDocument.uri);
		notify("textDocument/publishDiagnostics", { uri: params.textDocument.uri, diagnostics: [] });
		return;
	}

	if (message.method === "textDocument/documentSymbol") {
		const params = message.params as { textDocument: { uri: string } };
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, []);
			return;
		}
		const analysis = analyzePointSource(document.text);
		respond(message.id, outlineSymbols(analysis.symbols));
		return;
	}

	if (message.method === "textDocument/definition") {
		const params = message.params as { textDocument: { uri: string }; position: { line: number; character: number } };
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, null);
			return;
		}
		const point = lspPositionToPoint(params.position.line, params.position.character);
		const analysis = analyzePointSource(document.text);
		const range = definitionForPosition(analysis.symbols, point.line, point.column);
		respond(message.id, range ? { uri: params.textDocument.uri, range } : null);
		return;
	}

	if (message.method === "textDocument/hover") {
		const params = message.params as { textDocument: { uri: string }; position: { line: number; character: number } };
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, null);
			return;
		}
		const point = lspPositionToPoint(params.position.line, params.position.character);
		const hover = hoverForPosition(document.text, point.line, point.column);
		respond(message.id, hover ? { contents: { kind: "markdown", value: hover.contents } } : null);
		return;
	}

	if (message.method === "textDocument/formatting") {
		const params = message.params as { textDocument: { uri: string } };
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, []);
			return;
		}
		const formatted = formatPointDocument(document.text);
		if (formatted === document.text) {
			respond(message.id, []);
			return;
		}
		respond(message.id, [
			{
				range: fullDocumentRange(document.text),
				newText: formatted,
			},
		]);
		return;
	}

	if (message.method === "textDocument/completion") {
		const params = message.params as {
			textDocument: { uri: string };
			position: { line: number; character: number };
		};
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, { isIncomplete: false, items: [] });
			return;
		}
		const point = lspPositionToPoint(params.position.line, params.position.character);
		const items = completionsForPosition(document.text, point.line, point.column);
		respond(message.id, { isIncomplete: false, items });
		return;
	}

	if (message.method === "textDocument/prepareRename") {
		const params = message.params as {
			textDocument: { uri: string };
			position: { line: number; character: number };
		};
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, null);
			return;
		}
		const point = lspPositionToPoint(params.position.line, params.position.character);
		const prepared = prepareRenameAtPosition(document.text, point.line, point.column);
		respond(message.id, prepared);
		return;
	}

	if (message.method === "textDocument/rename") {
		const params = message.params as {
			textDocument: { uri: string };
			position: { line: number; character: number };
			newName: string;
		};
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			respond(message.id, null);
			return;
		}
		const point = lspPositionToPoint(params.position.line, params.position.character);
		const edit = renameSymbolInDocument(document.text, point.line, point.column, params.newName);
		if (!edit) {
			respond(message.id, null);
			return;
		}
		documents.set(params.textDocument.uri, { version: document.version, text: edit.newText });
		publishDiagnostics(params.textDocument.uri);
		respond(message.id, {
			changes: {
				[params.textDocument.uri]: [edit],
			},
		});
		return;
	}

	if (message.id !== undefined) {
		respond(message.id, null);
	}
}

function publishDiagnostics(uri: string): void {
	const document = documents.get(uri);
	if (!document) return;
	const analysis = analyzePointSource(document.text);
	notify("textDocument/publishDiagnostics", { uri, diagnostics: analysis.diagnostics });
}

function fullDocumentRange(text: string): LspRange {
	const lines = text.split(/\r?\n/);
	const lastLine = Math.max(0, lines.length - 1);
	const lastCharacter = lines[lastLine]?.length ?? 0;
	return {
		start: { line: 0, character: 0 },
		end: { line: lastLine, character: lastCharacter },
	};
}

function respond(id: number | string | null | undefined, result: unknown): void {
	if (id === undefined) return;
	writeMessage({ jsonrpc: "2.0", id, result });
}

function notify(method: string, params: unknown): void {
	writeMessage({ jsonrpc: "2.0", method, params });
}
