import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticBinding,
	PointSemanticProgram,
} from "./ast.ts";
import { toPascalCase } from "./naming.ts";

type OnVariantReturnStatement = { kind: "onVariantReturn"; caseLabel: string; span?: PointSourceSpan };

export function checkSemanticVariants(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const variantCases = new Map<string, string[]>();

	for (const declaration of program.declarations) {
		if (declaration.kind !== "variant") continue;
		variantCases.set(declaration.name, declaration.cases.map((variantCase) => toPascalCase(variantCase.label)));
	}

	for (const declaration of program.declarations) {
		if (declaration.kind !== "label" && declaration.kind !== "rule" && declaration.kind !== "calculation") continue;
		const dispatchCases = onVariantReturnStatements(declaration.body);
		if (dispatchCases.length === 0) continue;

		const variantInput = onlyVariantInput(declaration.inputs, variantCases);
		if (!variantInput) continue;
		const declaredCases = variantCases.get(variantInput.type.name) ?? [];
		if (declaredCases.length === 0) continue;

		const coveredCases = new Set(dispatchCases.map((statement) => toPascalCase(statement.caseLabel)));
		const missingCases = declaredCases.filter((caseName) => !coveredCases.has(caseName));
		if (missingCases.length === 0) continue;

		const path = `${declaration.kind}.${declaration.name}`;
		const ref = `point://semantic/${moduleName}/${path}`;
		const isOutcomeVariantType = variantInput.type.name.endsWith(" Outcome");
		const uncoveredList = missingCases.join(", ");
		const branchesHint = missingCases.map((caseName) => `on ${caseName} return ...`).join("; ");
		if (isOutcomeVariantType) {
			diagnostics.push({
				code: "action-outcome-not-exhaustive",
				message: `${declaration.kind} ${declaration.name} is missing outcome dispatch cases: ${uncoveredList}`,
				path,
				ref,
				severity: "error",
				span: dispatchCases[0]?.span ?? declaration.span ?? null,
				expected: declaredCases,
				actual: [...coveredCases].sort().join(", "),
				repair: `Add outcome dispatch branches for uncovered cases: ${branchesHint}.`,
				relatedRefs: [ref, `point://semantic/${moduleName}/variant.${variantInput.type.name}`],
			});
		} else {
			diagnostics.push({
				code: "missing-variant-case",
				message: `${declaration.kind} ${declaration.name} is missing variant cases: ${uncoveredList}`,
				path,
				ref,
				severity: "error",
				span: dispatchCases[0]?.span ?? declaration.span ?? null,
				expected: declaredCases,
				actual: [...coveredCases].sort().join(", "),
				repair: `Add branches for uncovered cases: ${branchesHint}.`,
				relatedRefs: [ref, `point://semantic/${moduleName}/variant.${variantInput.type.name}`],
			});
		}
	}

	return diagnostics;
}

function onVariantReturnStatements(statements: readonly unknown[]): OnVariantReturnStatement[] {
	return statements.filter(
		(statement): statement is OnVariantReturnStatement =>
			typeof statement === "object" &&
			statement !== null &&
			"kind" in statement &&
			(statement as { kind?: string }).kind === "onVariantReturn" &&
			"caseLabel" in statement &&
			typeof (statement as { caseLabel?: unknown }).caseLabel === "string",
	);
}

function onlyVariantInput(
	inputs: readonly PointSemanticBinding[],
	variantCases: ReadonlyMap<string, string[]>,
): PointSemanticBinding | null {
	const matches = inputs.filter((input) => variantCases.has(input.type.name));
	return matches.length === 1 ? matches[0]! : null;
}
