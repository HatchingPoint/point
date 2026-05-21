import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	analyzePointSource,
	definitionForPosition,
	formatPointDocument,
	hoverForPosition,
	outlineSymbols,
	pointSpanToLspRange,
	symbolAtPoint,
} from "../packages/point/src/lsp/analyze.ts";

const mathSource = readFileSync(join(import.meta.dir, "../examples/math.point"), "utf8");

describe("point lsp", () => {
	test("maps diagnostics and outline symbols for valid source", () => {
		const analysis = analyzePointSource(mathSource);
		expect(analysis.diagnostics).toEqual([]);
		expect(outlineSymbols(analysis.symbols).map((symbol) => symbol.name)).toContain("score status");
	});

	test("reports parse errors as diagnostics", () => {
		const analysis = analyzePointSource("module Broken\n\nnot valid syntax here\n");
		expect(analysis.diagnostics.length).toBeGreaterThan(0);
		expect(analysis.diagnostics[0]?.code).toBe("parse-error");
	});

	test("converts Point spans to LSP ranges", () => {
		const range = pointSpanToLspRange({ start: { line: 3, column: 1 }, end: { line: 3, column: 10 } });
		expect(range).toEqual({ start: { line: 2, character: 0 }, end: { line: 2, character: 9 } });
	});

	test("finds definition and hover at a semantic symbol", () => {
		const analysis = analyzePointSource(mathSource);
		const scoreStatus = analysis.symbols.find((symbol) => symbol.name === "score status");
		expect(scoreStatus?.span).toBeTruthy();
		const point = { line: scoreStatus!.span!.start.line, column: scoreStatus!.span!.start.column };
		const definition = definitionForPosition(analysis.symbols, point.line, point.column);
		expect(definition).toEqual(pointSpanToLspRange(scoreStatus!.span!));
		const hover = hoverForPosition(mathSource, point.line, point.column);
		expect(hover?.contents).toContain("score status");
	});

	test("selects the smallest symbol span at a position", () => {
		const analysis = analyzePointSource(mathSource);
		const scoreStatus = analysis.symbols.find((symbol) => symbol.name === "score status");
		const point = { line: scoreStatus!.span!.start.line, column: scoreStatus!.span!.start.column + 2 };
		const symbol = symbolAtPoint(analysis.symbols, point.line, point.column);
		expect(symbol?.name).toBe("score status");
	});

	test("formats a document through the LSP helper", () => {
		const messy = "module Messy\n\nrecord User\nname: Text\n";
		const formatted = formatPointDocument(messy);
		expect(formatted).toContain("record User");
		expect(formatted).not.toBe(messy);
	});
});
