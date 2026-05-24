import { Database } from "bun:sqlite";

type PointStdError = { message: string };

function openDatabase(): Database | PointStdError {
	const configured = process.env.POINT_SQL_DATABASE ?? process.env.DATABASE_URL ?? ":memory:";
	if (/^postgres(ql)?:/i.test(configured)) {
		return {
			message:
				"std.sql uses SQLite only — declare external postgres driver for PostgreSQL (see docs/site/ecosystem/database-interop.md)",
		};
	}
	const path = configured.replace(/^sqlite:/i, "");
	try {
		return new Database(path);
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

function validateParameterizedQuery(sql: string, paramCount: number): PointStdError | undefined {
	const trimmed = sql.trim();
	if (trimmed.length === 0) {
		return { message: "SQL query must not be empty" };
	}
	const withoutTrailingSemicolon = trimmed.replace(/;\s*$/, "");
	if (withoutTrailingSemicolon.includes(";")) {
		return { message: "multiple SQL statements are not allowed" };
	}
	const placeholders = (withoutTrailingSemicolon.match(/\?/g) ?? []).length;
	if (placeholders !== paramCount) {
		return {
			message: `parameterized query requires ${paramCount} ? placeholders, found ${placeholders}`,
		};
	}
	return undefined;
}

export function sqlQueryRaw(sql: string, params: string[]): string | PointStdError {
	const validation = validateParameterizedQuery(sql, params.length);
	if (validation) {
		return validation;
	}

	const dbResult = openDatabase();
	if ("message" in dbResult) {
		return dbResult;
	}

	const queryText = sql.trim().replace(/;\s*$/, "");
	try {
		const rows = dbResult.query(queryText).all(...params);
		return JSON.stringify(rows);
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

/** Decode JSON row text from sqlQueryRaw into a runtime array (for typed List<Record> externals). */
export function sqlJsonRowsList(raw: string | PointStdError): unknown[] | PointStdError {
	if (typeof raw === "object" && raw !== null && "message" in raw) {
		return raw;
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return { message: "SQL rows JSON must be an array" };
		}
		return parsed;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}
