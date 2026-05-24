from __future__ import annotations

import asyncio
import urllib.error
import urllib.request


def _read_response(response: urllib.response.addinfourl) -> str | dict[str, str]:
	status = getattr(response, "status", response.getcode())
	reason = getattr(response, "reason", "")
	if status < 200 or status >= 300:
		return {"message": f"HTTP {status}: {reason}"}
	return response.read().decode("utf-8")


def _http_get_sync(url: str) -> str | dict[str, str]:
	try:
		with urllib.request.urlopen(url, timeout=10) as response:
			return _read_response(response)
	except urllib.error.HTTPError as error:
		return {"message": f"HTTP {error.code}: {error.reason}"}
	except Exception as error:
		return {"message": str(error)}


def _http_post_sync(url: str, body: str) -> str | dict[str, str]:
	request = urllib.request.Request(
		url,
		data=body.encode("utf-8"),
		method="POST",
		headers={"Content-Type": "text/plain; charset=utf-8"},
	)
	try:
		with urllib.request.urlopen(request, timeout=10) as response:
			return _read_response(response)
	except urllib.error.HTTPError as error:
		return {"message": f"HTTP {error.code}: {error.reason}"}
	except Exception as error:
		return {"message": str(error)}


async def httpGet(url: str) -> str | dict[str, str]:
	return await asyncio.to_thread(_http_get_sync, url)


async def httpPost(url: str, body: str) -> str | dict[str, str]:
	return await asyncio.to_thread(_http_post_sync, url, body)
