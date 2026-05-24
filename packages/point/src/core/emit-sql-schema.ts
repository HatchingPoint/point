import type {
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticTypeExpression,
} from "../semantic/ast.ts";
import { toPascalCase } from "../semantic/naming.ts";

export type SqlDialect = "postgres" | "sqlite";

export interface SqlSchemaColumn {
	name: string;
	sqlType: string;
	comment?: string;
	primaryKey?: boolean;
	notNull?: boolean;
	defaultSql?: string;
	references?: { table: string; column: string };
}

export interface SqlSchemaTable {
	recordName: string;
	tableName: string;
	columns: SqlSchemaColumn[];
}

export interface SqlSchemaEmitOptions {
	dialect?: SqlDialect;
	moduleName?: string;
	migration?: { sequence: number; label: string };
}

const PRIMITIVE_SQL_TYPES = new Set(["Text", "Bool", "Int", "Float", "Instant"]);

export function toSqlIdentifier(label: string): string {
	const words = label.match(/[A-Za-z0-9]+/g) ?? [];
	return words.map((word) => word.toLowerCase()).join("_");
}

function recordNameSet(program: PointSemanticProgram): Set<string> {
	return new Set(
		program.declarations
			.filter((declaration): declaration is PointSemanticRecordDeclaration => declaration.kind === "record")
			.map((declaration) => toPascalCase(declaration.name)),
	);
}

export function findRecordDeclaration(
	program: PointSemanticProgram,
	typeName: string,
): PointSemanticRecordDeclaration | undefined {
	return program.declarations.find(
		(declaration): declaration is PointSemanticRecordDeclaration =>
			declaration.kind === "record" && toPascalCase(declaration.name) === typeName,
	);
}

export function resolveForeignKeyColumn(record: PointSemanticRecordDeclaration): string | undefined {
	const idField = record.fields.find((field) => toSqlIdentifier(field.label) === "id" && field.type.name === "Text");
	return idField ? "id" : undefined;
}

function unwrapMaybeType(type: PointSemanticTypeExpression): { inner: PointSemanticTypeExpression; nullable: boolean } {
	if (type.name === "Maybe" && type.args[0]) {
		return { inner: type.args[0], nullable: true };
	}
	return { inner: type, nullable: false };
}

function mapScalarSqlType(typeName: string, dialect: SqlDialect): string | undefined {
	if (typeName === "Text") return "TEXT";
	if (typeName === "Bool") return dialect === "sqlite" ? "INTEGER" : "BOOLEAN";
	if (typeName === "Int") return dialect === "sqlite" ? "INTEGER" : "BIGINT";
	if (typeName === "Float") return dialect === "sqlite" ? "REAL" : "DOUBLE PRECISION";
	if (typeName === "Instant") {
		return dialect === "sqlite" ? "TEXT" : "TIMESTAMP WITH TIME ZONE";
	}
	return undefined;
}

function formatTypeExpression(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map((arg) => formatTypeExpression(arg)).join(", ")}>`;
}

export function mapRecordFieldToSqlColumn(
	fieldLabel: string,
	type: PointSemanticTypeExpression,
	recordNameSet: Set<string>,
	program: PointSemanticProgram,
	dialect: SqlDialect = "postgres",
): SqlSchemaColumn | undefined {
	const { inner, nullable } = unwrapMaybeType(type);
	const columnName = toSqlIdentifier(fieldLabel);
	const scalarType = mapScalarSqlType(inner.name, dialect);
	if (scalarType) {
		const isId = columnName === "id" && inner.name === "Text";
		const column: SqlSchemaColumn = {
			name: columnName,
			sqlType: scalarType,
			primaryKey: isId,
			notNull: isId ? true : nullable ? false : inner.name === "Bool" ? true : undefined,
		};
		if (inner.name === "Bool" && !nullable) column.defaultSql = dialect === "sqlite" ? "0" : "FALSE";
		if (inner.name === "Instant" && dialect === "sqlite") {
			column.comment = "Point Instant — store ISO-8601 text in sqlite";
		}
		return column;
	}
	if (inner.name === "List") {
		const listInner = inner.args[0];
		const innerLabel = listInner ? formatTypeExpression(listInner) : "unknown";
		if (listInner && recordNameSet.has(listInner.name)) {
			return {
				name: columnName,
				sqlType: "TEXT",
				comment: `Point List<${innerLabel}> — non-relational JSON text`,
			};
		}
		return {
			name: columnName,
			sqlType: "TEXT",
			comment: `Point List<${innerLabel}> — store JSON text`,
		};
	}
	if (recordNameSet.has(inner.name)) {
		const targetRecord = findRecordDeclaration(program, inner.name);
		const pkColumn = targetRecord ? resolveForeignKeyColumn(targetRecord) : undefined;
		if (!pkColumn) return undefined;
		const fkColumnName = `${columnName}_id`;
		return {
			name: fkColumnName,
			sqlType: "TEXT",
			notNull: nullable ? false : undefined,
			references: { table: toSqlIdentifier(targetRecord!.name), column: pkColumn },
			comment: `Point record ${inner.name} foreign key`,
		};
	}
	return undefined;
}

export function buildSqlSchemaTables(program: PointSemanticProgram, dialect: SqlDialect = "postgres"): SqlSchemaTable[] {
	const records = program.declarations.filter(
		(declaration): declaration is PointSemanticRecordDeclaration => declaration.kind === "record",
	);
	const names = recordNameSet(program);
	return records.map((record) => ({
		recordName: record.name,
		tableName: toSqlIdentifier(record.name),
		columns: record.fields.flatMap((field) => {
			const column = mapRecordFieldToSqlColumn(field.label, field.type, names, program, dialect);
			return column ? [column] : [];
		}),
	}));
}

function formatColumnDefinition(column: SqlSchemaColumn, dialect: SqlDialect): string {
	const parts = [`${column.name} ${column.sqlType}`];
	if (column.primaryKey) parts.push("PRIMARY KEY");
	if (column.notNull) parts.push("NOT NULL");
	if (column.defaultSql) parts.push(`DEFAULT ${column.defaultSql}`);
	if (column.references) {
		if (dialect === "postgres") {
			parts.push(`REFERENCES ${column.references.table}(${column.references.column})`);
		} else {
			parts.push(`REFERENCES ${column.references.table}(${column.references.column})`);
		}
	}
	return parts.join(" ");
}

export function emitPointSqlSchema(program: PointSemanticProgram, options: SqlSchemaEmitOptions = {}): string {
	const dialect = options.dialect ?? "postgres";
	const lines: string[] = [
		"-- Generated by Point build-schema. Do not edit directly.",
		...(options.moduleName ?? program.module ? [`-- Point module: ${options.moduleName ?? program.module}`] : []),
		`-- Dialect: ${dialect}`,
		"-- Apply with your migration tool (Flyway, golang-migrate, psql, sqlite3). Point does not run migrations.",
		"",
	];
	if (options.migration) {
		const padded = String(options.migration.sequence).padStart(3, "0");
		lines.unshift(
			`-- Migration ${padded}_${options.migration.label}`,
			`-- Re-run is idempotent (CREATE TABLE IF NOT EXISTS).`,
			"",
		);
	}
	const tables = buildSqlSchemaTables(program, dialect);
	if (tables.length === 0) {
		lines.push("-- No record blocks found in this module.");
		return `${lines.join("\n")}\n`;
	}
	for (const table of tables) {
		lines.push(`-- record ${table.recordName}`);
		if (table.columns.length === 0) {
			lines.push(`-- Skipped ${table.tableName}: no mappable columns`);
			lines.push("");
			continue;
		}
		for (const column of table.columns) {
			if (column.comment) lines.push(`-- ${column.name}: ${column.comment}`);
		}
		lines.push(`CREATE TABLE IF NOT EXISTS ${table.tableName} (`);
		lines.push(
			table.columns
				.map((column, index) => `  ${formatColumnDefinition(column, dialect)}${index < table.columns.length - 1 ? "," : ""}`)
				.join("\n"),
		);
		lines.push(");", "");
	}
	return `${lines.join("\n")}\n`;
}

export function migrationFileName(sequence: number, label: string): string {
	return `${String(sequence).padStart(3, "0")}_${label}.sql`;
}
