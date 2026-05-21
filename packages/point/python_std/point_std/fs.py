from __future__ import annotations

from pathlib import Path


def readFile(path: str) -> str | dict[str, str]:
	try:
		return Path(path).read_text(encoding="utf-8")
	except Exception as error:
		return {"message": str(error)}


def writeFile(path: str, contents: str) -> None | dict[str, str]:
	try:
		Path(path).write_text(contents, encoding="utf-8")
		return None
	except Exception as error:
		return {"message": str(error)}
