import type { PointCoreDiagnostic } from "../core/check.ts";
import { mapRecordFieldToSqlColumn } from "../core/emit-sql-schema.ts";
import { toPascalCase } from "./naming.ts";
import type {
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticTypeExpression,
} from "./ast.ts";

const UNSUPPORTED_SQL_ROOT_TYPES = new Set(["Handler", "Variant"]);

function isUnsupportedSqlType(type: PointSemanticTypeExpression, recordNames: Set<string>): boolean {
	if (UNSUPPORTED_SQL_ROOT_TYPES.has(type.name)) return true;
	if (type.name === "List" || type.name === "Variant") return false;
	if (recordNames.has(type.name)) return false;
	if (["Text", "Bool", "Int", "Float"].includes(type.name)) return false;
	return true;
}

function unsupportedTypeLabel(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map((arg) => unsupportedTypeLabel(arg)).join(", ")}>`;
}

export function checkSemanticSqlSchema(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const records = program.declarations.filter(
		(declaration): declaration is PointSemanticRecordDeclaration => declaration.kind === "record",
	);
	const recordNames = new Set(records.map((record) => toPascalCase(record.name)));
	for (const record of records) {
		for (const field of record.fields) {
			if (isUnsupportedSqlType(field.type, recordNames)) {
				diagnostics.push({
					code: "record-sql-unsupported-type",
					message: `Record ${record.name} field "${field.label}" uses type ${unsupportedTypeLabel(field.type)} which build-schema cannot map yet`,
					severity: "error",
					ref: `point://semantic/${program.module ?? "anonymous"}/record.${record.name}`,
					repair: "Use Text, Bool, Int, Float, List<T>, or another record type for schema-backed fields.",
					span: field.span,
				});
				continue;
			}
			if (!mapRecordFieldToSqlColumn(field.label, field.type, recordNames)) {
				diagnostics.push({
					code: "record-sql-unsupported-type",
					message: `Record ${record.name} field "${field.label}" cannot be mapped to SQL`,
					severity: "error",
					ref: `point://semantic/${program.module ?? "anonymous"}/record.${record.name}`,
					repair: "Use Text, Bool, Int, Float, List<T>, or another record type for schema-backed fields.",
					span: field.span,
				});
			}
		}
	}
	return diagnostics;
}
