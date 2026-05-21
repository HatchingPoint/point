from __future__ import annotations

import json
from typing import Any


def _compact_json(value: Any) -> str:
	return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def jsonParse(value: str) -> str | dict[str, str]:
	try:
		return _compact_json(json.loads(value))
	except Exception as error:
		return {"message": str(error)}


def jsonStringify(value: str) -> str:
	return _compact_json(json.loads(value))
