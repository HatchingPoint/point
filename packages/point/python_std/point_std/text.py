from __future__ import annotations


def textLength(value: str) -> int:
	return len(value)


def textContains(value: str, search: str) -> bool:
	return search in value


def textSplit(value: str, separator: str) -> list[str]:
	return value.split(separator)


def textTrim(value: str) -> str:
	return value.strip()


def textFromInt(value: int) -> str:
	return str(value)


def textPadStart(value: str, length: int, fill: str) -> str:
	pad_char = fill[:1] if fill else " "
	return value.rjust(length, pad_char)
