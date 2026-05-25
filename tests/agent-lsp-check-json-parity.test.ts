import { describe, expect, test } from "bun:test";
import { analyzePointSource } from "../packages/point/src/lsp/analyze.ts";
import { AGENT_REPAIR_CASES, loadFixture, runCheckJson } from "../scripts/agent-repair-sufficiency.ts";

/** Phase 26–27 codes plus platform UI kit repair codes spot-checked for LSP ↔ CLI parity. */
const LSP_PARITY_CASE_IDS = new Set([
	"middleware-input-unavailable",
	"middleware-input-type-mismatch",
	"pipeline-step-type-mismatch",
	"float-money-field",
	"missing-variant-case",
	"invalid-view-bind-target",
	"invalid-bind-select-target",
	"invalid-bind-textarea-target",
	"toast-without-submit",
	"unknown-sse-subscribe-route",
	"invalid-chart-field",
	"refresh-without-load",
	"invalid-refresh-interval",
	"invalid-table-link-column",
	"terminal-unknown-stream",
	"invalid-datagrid-sort-column",
	"invalid-datagrid-filter-column",
	"invalid-datagrid-page-size",
	"unknown-field-rule",
	"missing-await",
	"operator-type-mismatch",
	"arity-mismatch",
]);

const parityCases = AGENT_REPAIR_CASES.filter((testCase) => LSP_PARITY_CASE_IDS.has(testCase.id));

describe("LSP vs check-json diagnostic parity", () => {
	for (const testCase of parityCases) {
		test(`${testCase.id}: code and repair match CLI check-json`, async () => {
			const source = loadFixture(testCase.brokenFile);
			const checkJson = runCheckJson(source, testCase.brokenFile);
			const lsp = await analyzePointSource(source);

			expect(checkJson.ok).toBe(false);
			expect(lsp.diagnostics.length).toBeGreaterThan(0);

			const cliDiagnostic = checkJson.diagnostics[0]!;
			const lspDiagnostic = lsp.diagnostics[0]!;

			expect(lspDiagnostic.code).toBe(cliDiagnostic.code);
			expect(lspDiagnostic.ref).toBe(cliDiagnostic.ref);
			expect(lspDiagnostic.repair).toBe(cliDiagnostic.repair?.trim());
			expect(lspDiagnostic.message).toContain(cliDiagnostic.message);
			if (cliDiagnostic.repair?.trim()) {
				expect(lspDiagnostic.message).toContain(cliDiagnostic.repair.trim());
			}
			expect(lspDiagnostic.source).toBe("point");
		});
	}

	test("parity matrix covers platform UI and Phase 26–27 agent-repair codes", () => {
		for (const code of [
			"middleware-input-unavailable",
			"middleware-input-type-mismatch",
			"pipeline-step-type-mismatch",
			"float-money-field",
			"missing-variant-case",
			"invalid-view-bind-target",
			"toast-without-submit",
			"invalid-chart-field",
			"invalid-datagrid-sort-column",
			"invalid-datagrid-filter-column",
			"invalid-datagrid-page-size",
			"unknown-load-action",
		]) {
			expect(parityCases.some((testCase) => testCase.expectedCode === code)).toBe(true);
		}
	});
});
