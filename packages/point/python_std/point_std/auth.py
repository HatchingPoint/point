from __future__ import annotations

from point_std.crypto import (
	cryptoJwtIsValid,
	cryptoJwtSign,
	cryptoJwtVerify,
)


def authBearerToken(authorization: str | None) -> str:
	if authorization is None:
		return ""
	trimmed = authorization.strip()
	if trimmed.startswith("Bearer "):
		return trimmed[len("Bearer ") :].strip()
	return trimmed


def authJwtOk(authorization: str | None, secret: str) -> bool:
	return cryptoJwtIsValid(authorization, secret)


def authSignJwt(payload: str, secret: str) -> str:
	return cryptoJwtSign(payload, secret)


def authVerifyJwt(authorization: str | None, secret: str) -> str | dict[str, str]:
	return cryptoJwtVerify(authorization, secret)


def authUnauthorizedJson() -> str:
	return '{"error":"unauthorized"}'
