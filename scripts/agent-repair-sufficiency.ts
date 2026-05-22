import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PointCoreDiagnostic } from "../packages/point/src/core/check.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

export type AgentRepairCase = {
	id: string;
	brokenFile: string;
	fixedFile: string;
	/** Field name as it appears in check-json expected list (camelCase for semantic records). */
	chosenField: string;
};

export type CheckJsonPayload = {
	schemaVersion: string;
	ok: boolean;
	diagnostics: PointCoreDiagnostic[];
};

export type SufficiencyResult = {
	id: string;
	passed: boolean;
	diagnosticCode: string;
	contextChars: number;
	estimatedTokens: number;
	expectedIncludesFix: boolean;
	checkPassesAfterRepair: boolean;
	ref?: string;
};

const FIXTURES_DIR = join(import.meta.dir, "../tests/fixtures/agent-repair");

export const AGENT_REPAIR_CASES: AgentRepairCase[] = [
	{
		id: "unknown-field-rule",
		brokenFile: "unknown-field-broken.point",
		fixedFile: "unknown-field-fixed.point",
		chosenField: "hasBundleId",
	},
	{
		id: "label-unknown-field",
		brokenFile: "label-unknown-field-broken.point",
		fixedFile: "label-unknown-field-fixed.point",
		chosenField: "active",
	},
];

export function estimateTokens(text: string): number {
	return Math.max(1, Math.round(text.length / 4));
}

export function loadFixture(name: string): string {
	return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

export function runCheckJson(source: string): CheckJsonPayload {
	const program = parsePointSource(source);
	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	return {
		schemaVersion: "point.core.check.v1",
		ok: diagnostics.length === 0,
		diagnostics,
	};
}

export function serializeCheckJson(payload: CheckJsonPayload): string {
	return JSON.stringify(payload, null, 2);
}

/** Replace the diagnostic line with the corresponding golden line (simulates picking the right field from expected). */
export function applyLineRepairFromGolden(brokenSource: string, fixedSource: string, diagnostic: PointCoreDiagnostic): string {
	if (!diagnostic.span) {
		throw new Error("Diagnostic missing span");
	}
	const brokenLines = brokenSource.split("\n");
	const fixedLines = fixedSource.split("\n");
	const lineIndex = diagnostic.span.start.line - 1;
	if (fixedLines[lineIndex] === undefined) {
		throw new Error(`Fixed file missing line ${diagnostic.span.start.line}`);
	}
	brokenLines[lineIndex] = fixedLines[lineIndex]!;
	return brokenLines.join("\n");
}

export function expectedListIncludesFixField(diagnostic: PointCoreDiagnostic, chosenField: string): boolean {
	if (!diagnostic.expected) return false;
	const expected = Array.isArray(diagnostic.expected) ? diagnostic.expected : [diagnostic.expected];
	const normalizedChoice = chosenField.replace(/\s+/g, "").toLowerCase();
	return expected.some((candidate) => candidate.replace(/\s+/g, "").toLowerCase() === normalizedChoice);
}

export function assertDiagnosticIsAgentReady(diagnostic: PointCoreDiagnostic): void {
	if (!diagnostic.ref.startsWith("point://semantic/")) {
		throw new Error(`Expected semantic ref, got ${diagnostic.ref}`);
	}
	if (!diagnostic.repair?.trim()) {
		throw new Error("Missing repair hint");
	}
	if (!diagnostic.expected || (Array.isArray(diagnostic.expected) && diagnostic.expected.length === 0)) {
		throw new Error("Missing expected field list");
	}
	if (!diagnostic.span) {
		throw new Error("Missing source span");
	}
}

export function evaluateRepairSufficiency(testCase: AgentRepairCase): SufficiencyResult {
	const brokenSource = loadFixture(testCase.brokenFile);
	const fixedSource = loadFixture(testCase.fixedFile);
	const payload = runCheckJson(brokenSource);
	const diagnostic = payload.diagnostics[0];
	if (!diagnostic) {
		return {
			id: testCase.id,
			passed: false,
			diagnosticCode: "none",
			contextChars: 0,
			estimatedTokens: 0,
			expectedIncludesFix: false,
			checkPassesAfterRepair: false,
		};
	}

	const contextJson = serializeCheckJson({ schemaVersion: payload.schemaVersion, ok: false, diagnostics: [diagnostic] });
	const expectedIncludesFix = expectedListIncludesFixField(diagnostic, testCase.chosenField);

	let checkPassesAfterRepair = false;
	try {
		assertDiagnosticIsAgentReady(diagnostic);
		const repaired = applyLineRepairFromGolden(brokenSource, fixedSource, diagnostic);
		const repairedProgram = parsePointSource(repaired);
		checkPassesAfterRepair = checkPointCore(repairedProgram).length === 0;
	} catch {
		checkPassesAfterRepair = false;
	}

	const passed = expectedIncludesFix && checkPassesAfterRepair;

	return {
		id: testCase.id,
		passed,
		diagnosticCode: diagnostic.code,
		contextChars: contextJson.length,
		estimatedTokens: estimateTokens(contextJson),
		expectedIncludesFix,
		checkPassesAfterRepair,
		ref: diagnostic.ref,
	};
}

export function runRepairSufficiencyBenchmark(): SufficiencyResult[] {
	return AGENT_REPAIR_CASES.map(evaluateRepairSufficiency);
}
