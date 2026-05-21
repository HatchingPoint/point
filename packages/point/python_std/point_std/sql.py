from __future__ import annotations

import json
import os
import re
import sqlite3
from typing import Any


def _open_database() -> sqlite3.Connection | dict[str, str]:
	configured = os.environ.get("POINT_SQL_DATABASE") or os.environ.get("DATABASE_URL") or ":memory:"
	if re.match(r"^postgres(ql)?:", configured, re.IGNORECASE):
		return {
			"message": "std.sql uses SQLite only — declare external postgres driver for PostgreSQL (see docs/site/ecosystem/database-interop.md)",
		}
	path = re.sub(r"^sqlite:", "", configured, flags=re.IGNORECASE)
	try:
		connection = sqlite3.connect(path)
		connection.row_factory = sqlite3.Row
		return connection
	except Exception as error:
		return {"message": str(error)}


def _validate_parameterized_query(sql: str, param_count: int) -> dict[str, str] | None:
	trimmed = sql.strip()
	if len(trimmed) == 0:
		return {"message": "SQL query must not be empty"}
	without_trailing_semicolon = re.sub(r";\s*$", "", trimmed)
	if ";" in without_trailing_semicolon:
		return {"message": "multiple SQL statements are not allowed"}
	placeholders = len(re.findall(r"\?", without_trailing_semicolon))
	if placeholders != param_count:
		return {
			"message": f"parameterized query requires {param_count} ? placeholders, found {placeholders}",
		}
	return None


def _rows_to_json(rows: list[sqlite3.Row]) -> str:
	payload: list[dict[str, Any]] = [dict(row) for row in rows]
	return json.dumps(payload, separators=(",", ":"))


def sqlQueryRaw(sql: str, params: list[str]) -> str | dict[str, str]:
	validation = _validate_parameterized_query(sql, len(params))
	if validation is not None:
		return validation

	db_result = _open_database()
	if isinstance(db_result, dict):
		return db_result

	query_text = re.sub(r";\s*$", "", sql.strip())
	try:
		cursor = db_result.execute(query_text, params)
		if query_text.lstrip().upper().startswith("SELECT"):
			rows = cursor.fetchall()
			return _rows_to_json(rows)
		db_result.commit()
		return "[]"
	except Exception as error:
		return {"message": str(error)}
	finally:
		db_result.close()
