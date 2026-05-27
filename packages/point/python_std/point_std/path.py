from __future__ import annotations

import os


def _to_point_path(value: str) -> str:
	return value.replace("\\", "/")


def pathJoin(left: str, right: str) -> str:
	return _to_point_path(os.path.join(left, right))


def pathBasename(value: str) -> str:
	return os.path.basename(value)


def pathDirname(value: str) -> str:
	return _to_point_path(os.path.dirname(value))


def pathExtname(value: str) -> str:
	return os.path.splitext(value)[1]


def pathResolve(value: str) -> str:
	return _to_point_path(os.path.abspath(value))


def pathIsAbsolute(value: str) -> bool:
	return os.path.isabs(value)
