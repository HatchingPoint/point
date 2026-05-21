from __future__ import annotations


def _split_lines(text: str) -> list[str]:
	normalized = text.replace("\r\n", "\n")
	if len(normalized) == 0:
		return []
	lines = normalized.split("\n")
	if lines and lines[-1] == "":
		lines.pop()
	return lines


def streamJoinLines(lines: list[str]) -> str:
	if len(lines) == 0:
		return ""
	return "\n".join(lines) + "\n"


async def streamReadText(source: str) -> str | dict[str, str]:
	return source


async def streamWriteText(sink: str, contents: str) -> None | dict[str, str]:
	return None


async def streamReadLines(source: str) -> list[str] | dict[str, str]:
	text = await streamReadText(source)
	if isinstance(text, dict):
		return text
	return _split_lines(text)


async def streamWriteLines(sink: str, lines: list[str]) -> None | dict[str, str]:
	return await streamWriteText(sink, streamJoinLines(lines))
