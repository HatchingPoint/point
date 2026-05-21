from __future__ import annotations

import os


def envGet(name: str) -> str | None:
	value = os.environ.get(name)
	return value if value is not None else None
