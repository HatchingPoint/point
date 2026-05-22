from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from email.utils import format_datetime


def now() -> str:
	return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def instantNow() -> str:
	return now()


def parseInstant(value: str) -> str | dict[str, str]:
	try:
		normalized = value.replace("Z", "+00:00") if value.endswith("Z") else value
		parsed = datetime.fromisoformat(normalized)
		return parsed.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
	except ValueError:
		return {"message": f"Invalid instant: {value}"}


def formatInstant(value: str) -> str:
	return formatTime(value)


async def sleep(ms: int) -> None:
	await asyncio.sleep(ms / 1000)


def formatTime(value: str) -> str:
	try:
		normalized = value.replace("Z", "+00:00") if value.endswith("Z") else value
		parsed = datetime.fromisoformat(normalized)
		return format_datetime(parsed, usegmt=True)
	except ValueError:
		return value
