from __future__ import annotations

import asyncio
import os
import subprocess
from collections.abc import AsyncIterator


def _parse_env_entries(entries: list[str]) -> dict[str, str]:
	env = dict(os.environ)
	for entry in entries:
		separator = entry.find("=")
		if separator <= 0:
			continue
		env[entry[:separator]] = entry[separator + 1 :]
	return env


def _normalize_command(command: str, args: list[str]) -> list[str]:
	if os.name != "nt":
		return [command, *args]
	if command.lower() == "echo":
		return ["cmd", "/d", "/s", "/c", f"echo {' '.join(args)}"]
	return [command, *args]


def _normalize_output(value: str) -> str:
	return value.replace("\r\n", "\n").replace("\r", "\n")


async def processSpawn(
	command: str,
	args: list[str],
	env_entries: list[str],
) -> dict[str, str | int] | dict[str, str]:
	try:
		completed = await asyncio.to_thread(
			subprocess.run,
			_normalize_command(command, args),
			capture_output=True,
			text=True,
			env=_parse_env_entries(env_entries),
		)
		return {
			"stdout": _normalize_output(completed.stdout),
			"stderr": _normalize_output(completed.stderr),
			"exitCode": completed.returncode,
		}
	except Exception as error:
		return {"message": str(error)}


def _split_stdout_lines(text: str, carry: str) -> tuple[list[str], str]:
	combined = f"{carry}{text.replace(chr(13) + chr(10), chr(10))}"
	parts = combined.split("\n")
	remainder = parts.pop() if parts else ""
	return [line.rstrip("\r") for line in parts], remainder


async def processStreamLines(
	command: str,
	args: list[str],
	env_entries: list[str],
) -> AsyncIterator[str]:
	proc: subprocess.Popen[str] | None = None
	try:
		proc = subprocess.Popen(
			_normalize_command(command, args),
			stdout=subprocess.PIPE,
			stderr=subprocess.PIPE,
			text=True,
			env=_parse_env_entries(env_entries),
		)
		assert proc.stdout is not None
		remainder = ""
		while True:
			chunk = await asyncio.to_thread(proc.stdout.read, 4096)
			if chunk == "":
				break
			lines, remainder = _split_stdout_lines(chunk, remainder)
			for line in lines:
				yield line
		if remainder:
			yield remainder.rstrip("\r")
		if proc.stderr is not None:
			await asyncio.to_thread(proc.stderr.read)
		await asyncio.to_thread(proc.wait)
	except Exception:
		return
	finally:
		if proc is not None and proc.poll() is None:
			proc.kill()
