from __future__ import annotations

import json
from typing import Any


def _compact_json(value: Any) -> str:
	return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def yamlParse(value: str) -> str | dict[str, str]:
	try:
		import yaml
	except ImportError:
		return {"message": "PyYAML is required for std.yaml in Python emit"}
	try:
		parsed = yaml.safe_load(value)
		return _compact_json(parsed)
	except Exception as error:
		return {"message": str(error)}


def yamlStringify(value: str) -> str:
	import yaml

	return yaml.safe_dump(json.loads(value), sort_keys=False)
