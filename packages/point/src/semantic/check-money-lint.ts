import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSemanticProgram, PointSemanticTypeExpression } from "./ast.ts";

const MONEY_FIELD_PATTERN = /(?:^|\s)(?:amount|price|cost|cents)(?:\s|$)/i;

export function checkSemanticMoneyLint(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";

	for (const declaration of program.declarations) {
		if (declaration.kind !== "record") continue;
		for (const field of declaration.fields) {
			if (field.type.name !== "Float") continue;
			if (!MONEY_FIELD_PATTERN.test(field.label)) continue;
			const path = `record.${declaration.name}.field.${field.label}`;
			diagnostics.push({
				code: "float-money-field",
				message: `Record ${declaration.name} field ${field.label} uses Float; prefer Int cents with std/money`,
				path,
				ref: `point://semantic/${moduleName}/${path}`,
				severity: "error",
				span: field.span ?? declaration.span ?? null,
				expected: "Int",
				actual: formatSemanticType(field.type),
				repair: `Use Int cents for money fields and std/money.point helpers (amount cents, currency) instead of Float on ${field.label}.`,
				relatedRefs: [`point://semantic/${moduleName}/record.${declaration.name}`, "point://semantic/Money/record.Money"],
			});
		}
	}

	return diagnostics;
}

function formatSemanticType(type: PointSemanticTypeExpression): string {
	if (type.name === "Or") return type.args.map(formatSemanticType).join(" or ");
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatSemanticType).join(", ")}>`;
}
