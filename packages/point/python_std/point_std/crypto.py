from __future__ import annotations

import base64
import hashlib
import hmac
import json
from typing import Any


def _base64url_encode(value: str) -> str:
	return base64.urlsafe_b64encode(value.encode("utf-8")).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> str:
	padding = "=" * ((4 - len(value) % 4) % 4)
	return base64.urlsafe_b64decode(value + padding).decode("utf-8")


def _normalize_bearer_token(token: str | None) -> str:
	if token is None:
		return ""
	trimmed = token.strip()
	if trimmed.startswith("Bearer "):
		return trimmed[len("Bearer ") :].strip()
	return trimmed


def cryptoSha256(value: str) -> str:
	return hashlib.sha256(value.encode("utf-8")).hexdigest()


def cryptoHmacSha256(value: str, secret: str) -> str:
	return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def cryptoJwtSign(payload: str, secret: str) -> str:
	json.loads(payload)
	header = _base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")))
	body = _base64url_encode(payload)
	data = f"{header}.{body}"
	signature = hmac.new(secret.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).digest()
	signature_text = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
	return f"{data}.{signature_text}"


def cryptoJwtVerify(token: str | None, secret: str) -> str | dict[str, str]:
	normalized = _normalize_bearer_token(token)
	if not normalized:
		return {"message": "Missing JWT"}
	parts = normalized.split(".")
	if len(parts) != 3:
		return {"message": "Invalid JWT"}
	header, body, signature = parts
	data = f"{header}.{body}"
	expected = hmac.new(secret.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).digest()
	expected_text = base64.urlsafe_b64encode(expected).decode("ascii").rstrip("=")
	if len(expected_text) != len(signature) or not hmac.compare_digest(expected_text, signature):
		return {"message": "Invalid JWT signature"}
	try:
		payload = _base64url_decode(body)
		json.loads(payload)
		return payload
	except Exception as error:
		return {"message": str(error)}


def cryptoJwtIsValid(token: str | None, secret: str) -> bool:
	return isinstance(cryptoJwtVerify(token, secret), str)


sha256Hash = cryptoSha256
hmacSha256 = cryptoHmacSha256
jwtSign = cryptoJwtSign
jwtVerify = cryptoJwtVerify
checkJwtValid = cryptoJwtIsValid
