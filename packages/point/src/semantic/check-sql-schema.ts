import type { PointCoreDiagnostic } from "../core/check.ts";
import {
	findRecordDeclaration,
	mapRecordFieldToSqlColumn,
	resolveForeignKeyColumn,
	type SqlDialect,
} from "../core/emit-sql-schema.ts";
import { toPascalCase } from "./naming.ts";
import type {
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticTypeExpression,
} from "./ast.ts";

const UNSUPPORTED_SQL_ROOT_TYPES = new Set(["Handler", "Variant"]);

function unwrapMaybeType(type: PointSemanticTypeExpression): PointSemanticTypeExpression {
	if (type.name === "Maybe" && type.args[0]) return type.args[0];
	return type;
}

function isUnsupportedSqlType(type: PointSemanticTypeExpression, recordNames: Set<string>): boolean {
	const inner = unwrapMaybeType(type);
	if (UNSUPPORTED_SQL_ROOT_TYPES.has(inner.name)) return true;
	if (inner.name === "List" || inner.name === "Variant") return false;
	if (inner.name === "Maybe") return false;
	if (inner.name === "Instant" || inner.name === "Duration") return false;
	if (recordNames.has(inner.name)) return false;
	if (["Text", "Bool", "Int", "Float"].includes(inner.name)) return false;
	return true;
}

function unsupportedTypeLabel(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map((arg) => unsupportedTypeLabel(arg)).join(", ")}>`;
}

function sqlSchemaDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	recordName: string,
	repair: string,
	span?: PointSemanticProgram["declarations"][number]["span"],
): PointCoreDiagnostic {
	return {
		code,
		message,
		severity: "error",
		ref: `point://semantic/${moduleName}/record.${recordName}`,
		repair,
		span: span ?? null,
	};
}

export function mergeSemanticProgramsForSchema(programs: PointSemanticProgram[]): {
	program: PointSemanticProgram;
	diagnostics: PointCoreDiagnostic[];
} {
	const diagnostics: PointCoreDiagnostic[] = [];
	const records: PointSemanticRecordDeclaration[] = [];
	const seen = new Map<string, string>();

	for (const program of programs) {
		const moduleName = program.module ?? "anonymous";
		for (const declaration of program.declarations) {
			if (declaration.kind !== "record") continue;
			const pascalName = toPascalCase(declaration.name);
			const existingModule = seen.get(pascalName);
			if (existingModule && existingModule !== moduleName) {
				diagnostics.push(
					sqlSchemaDiagnostic(
						"record-sql-duplicate-table",
						`Record ${declaration.name} is declared in both ${existingModule} and ${moduleName}; build-schema cannot merge duplicate table names`,
						moduleName,
						declaration.name,
						"Rename one record or split schema builds per module.",
						declaration.span,
					),
				);
				continue;
			}
			seen.set(pascalName, moduleName);
			records.push(declaration);
		}
	}

	return {
		program: {
			module: programs.map((program) => program.module).filter(Boolean).join("+") || "Schema",
			uses: [],
			declarations: records,
		},
		diagnostics,
	};
}

export function checkSemanticSqlSchema(
	program: PointSemanticProgram,
	dialect: SqlDialect = "postgres",
): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const records = program.declarations.filter(
		(declaration): declaration is PointSemanticRecordDeclaration => declaration.kind === "record",
	);
	const recordNames = new Set(records.map((record) => toPascalCase(record.name)));
	const moduleName = program.module ?? "anonymous";

	for (const record of records) {
		for (const field of record.fields) {
			if (isUnsupportedSqlType(field.type, recordNames)) {
				diagnostics.push(
					sqlSchemaDiagnostic(
						"record-sql-unsupported-type",
						`Record ${record.name} field "${field.label}" uses type ${unsupportedTypeLabel(field.type)} which build-schema cannot map yet`,
						moduleName,
						record.name,
						"Use Text, Bool, Int, Float, Instant, Duration, Maybe<T>, List<T>, or another record type for schema-backed fields.",
						field.span,
					),
				);
				continue;
			}

			const inner = unwrapMaybeType(field.type);
			if (recordNames.has(inner.name)) {
				const targetRecord = findRecordDeclaration(program, inner.name);
				const pkColumn = targetRecord ? resolveForeignKeyColumn(targetRecord) : undefined;
				if (!pkColumn) {
					diagnostics.push(
						sqlSchemaDiagnostic(
							"record-sql-fk-ambiguous",
							`Record ${record.name} field "${field.label}" references ${inner.name} but that record has no id: Text primary key for build-schema foreign keys`,
							moduleName,
							record.name,
							`Add id: Text to record ${targetRecord?.name ?? inner.name} or store JSON instead of a relational reference.`,
							field.span,
						),
					);
					continue;
				}
			}

			if (!mapRecordFieldToSqlColumn(field.label, field.type, recordNames, program, dialect)) {
				diagnostics.push(
					sqlSchemaDiagnostic(
						"record-sql-unsupported-type",
						`Record ${record.name} field "${field.label}" cannot be mapped to SQL`,
						moduleName,
						record.name,
						"Use Text, Bool, Int, Float, Instant, Duration, Maybe<T>, List<T>, or another record type for schema-backed fields.",
						field.span,
					),
				);
			}
		}
	}
	return diagnostics;
}
