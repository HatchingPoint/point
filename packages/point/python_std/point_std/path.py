from __future__ import annotations

import os


def pathJoin(left: str, right: str) -> str:
	return os.path.join(left, right)


def pathBasename(value: str) -> str:
	return os.path.basename(value)


def pathDirname(value: str) -> str:
	return os.path.dirname(value)


def pathExtname(value: str) -> str:
	return os.path.splitext(value)[1]


def pathResolve(value: str) -> str:
	return os.path.abspath(value)


def pathIsAbsolute(value: str) -> bool:
	return os.path.isabs(value)
