from __future__ import annotations

import asyncio
import json
import urllib.error
import urllib.request

OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MAX_TOKENS = 1024


def _missing_api_key(name: str) -> dict[str, str]:
	return {"message": f"Missing {name} — set it with std.env before calling provider actions"}


def _normalize_api_key(api_key: str | None) -> str | dict[str, str]:
	if api_key is None or api_key.strip() == "":
		return {"message": "Missing API key"}
	return api_key.strip()


def _read_response_text(response: urllib.response.addinfourl) -> str | dict[str, str]:
	status = getattr(response, "status", response.getcode())
	reason = getattr(response, "reason", "")
	if status < 200 or status >= 300:
		detail = response.read().decode("utf-8").strip()
		suffix = f": {detail}" if detail else ""
		return {"message": f"HTTP {status}: {reason}{suffix}"}
	return response.read().decode("utf-8")


def _post_provider_request(
	url: str,
	headers: dict[str, str],
	body: str,
) -> str | dict[str, str]:
	request = urllib.request.Request(
		url,
		data=body.encode("utf-8"),
		method="POST",
		headers={"Content-Type": "application/json", **headers},
	)
	try:
		with urllib.request.urlopen(request) as response:
			return _read_response_text(response)
	except urllib.error.HTTPError as error:
		detail = error.read().decode("utf-8").strip()
		suffix = f": {detail}" if detail else ""
		return {"message": f"HTTP {error.code}: {error.reason}{suffix}"}
	except Exception as error:
		return {"message": str(error)}


def _build_openai_chat_body(prompt: str, model: str, stream: bool) -> str:
	return json.dumps(
		{
			"model": model,
			"stream": stream,
			"messages": [{"role": "user", "content": prompt}],
		},
		separators=(",", ":"),
	)


def _build_anthropic_message_body(prompt: str, model: str, stream: bool) -> str:
	return json.dumps(
		{
			"model": model,
			"stream": stream,
			"max_tokens": DEFAULT_MAX_TOKENS,
			"messages": [{"role": "user", "content": prompt}],
		},
		separators=(",", ":"),
	)


def _extract_openai_completion(response: str) -> str | dict[str, str]:
	try:
		parsed = json.loads(response)
		content = parsed.get("choices", [{}])[0].get("message", {}).get("content")
		if not isinstance(content, str):
			return {"message": "OpenAI response missing message content"}
		return content
	except Exception as error:
		return {"message": str(error)}


def _extract_anthropic_completion(response: str) -> str | dict[str, str]:
	try:
		parsed = json.loads(response)
		blocks = parsed.get("content", [])
		for block in blocks:
			if block.get("type") == "text" and isinstance(block.get("text"), str):
				return block["text"]
		return {"message": "Anthropic response missing text content"}
	except Exception as error:
		return {"message": str(error)}


def _extract_openai_stream_text(response: str) -> str | dict[str, str]:
	chunks: list[str] = []
	for line in response.split("\n"):
		trimmed = line.strip()
		if not trimmed.startswith("data:"):
			continue
		payload = trimmed[len("data:") :].strip()
		if not payload or payload == "[DONE]":
			continue
		try:
			parsed = json.loads(payload)
			delta = parsed.get("choices", [{}])[0].get("delta", {}).get("content")
			if isinstance(delta, str) and len(delta) > 0:
				chunks.append(delta)
		except Exception:
			return {"message": "Invalid OpenAI stream chunk"}
	if len(chunks) == 0:
		return {"message": "OpenAI stream returned no text deltas"}
	return "".join(chunks)


def _extract_anthropic_stream_text(response: str) -> str | dict[str, str]:
	chunks: list[str] = []
	for line in response.split("\n"):
		trimmed = line.strip()
		if not trimmed.startswith("data:"):
			continue
		payload = trimmed[len("data:") :].strip()
		if not payload or payload == "[DONE]":
			continue
		try:
			parsed = json.loads(payload)
			if parsed.get("type") == "content_block_delta" and parsed.get("delta", {}).get("type") == "text_delta":
				delta = parsed.get("delta", {}).get("text")
				if isinstance(delta, str) and len(delta) > 0:
					chunks.append(delta)
		except Exception:
			return {"message": "Invalid Anthropic stream chunk"}
	if len(chunks) == 0:
		return {"message": "Anthropic stream returned no text deltas"}
	return "".join(chunks)


async def openaiComplete(api_key: str | None, prompt: str, model: str) -> str | dict[str, str]:
	normalized = _normalize_api_key(api_key)
	if not isinstance(normalized, str):
		return _missing_api_key("OPENAI_API_KEY")
	response = await asyncio.to_thread(
		_post_provider_request,
		OPENAI_CHAT_URL,
		{"Authorization": f"Bearer {normalized}"},
		_build_openai_chat_body(prompt, model, False),
	)
	if not isinstance(response, str):
		return response
	return _extract_openai_completion(response)


async def openaiStream(api_key: str | None, prompt: str, model: str) -> str | dict[str, str]:
	normalized = _normalize_api_key(api_key)
	if not isinstance(normalized, str):
		return _missing_api_key("OPENAI_API_KEY")
	response = await asyncio.to_thread(
		_post_provider_request,
		OPENAI_CHAT_URL,
		{"Authorization": f"Bearer {normalized}"},
		_build_openai_chat_body(prompt, model, True),
	)
	if not isinstance(response, str):
		return response
	return _extract_openai_stream_text(response)


async def anthropicComplete(api_key: str | None, prompt: str, model: str) -> str | dict[str, str]:
	normalized = _normalize_api_key(api_key)
	if not isinstance(normalized, str):
		return _missing_api_key("ANTHROPIC_API_KEY")
	response = await asyncio.to_thread(
		_post_provider_request,
		ANTHROPIC_MESSAGES_URL,
		{"x-api-key": normalized, "anthropic-version": ANTHROPIC_VERSION},
		_build_anthropic_message_body(prompt, model, False),
	)
	if not isinstance(response, str):
		return response
	return _extract_anthropic_completion(response)


async def anthropicStream(api_key: str | None, prompt: str, model: str) -> str | dict[str, str]:
	normalized = _normalize_api_key(api_key)
	if not isinstance(normalized, str):
		return _missing_api_key("ANTHROPIC_API_KEY")
	response = await asyncio.to_thread(
		_post_provider_request,
		ANTHROPIC_MESSAGES_URL,
		{"x-api-key": normalized, "anthropic-version": ANTHROPIC_VERSION},
		_build_anthropic_message_body(prompt, model, True),
	)
	if not isinstance(response, str):
		return response
	return _extract_anthropic_stream_text(response)
