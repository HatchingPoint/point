type PointStdError = { message: string };

async function readResponseText(response: Response): Promise<string | PointStdError> {
	if (!response.ok) {
		return { message: `HTTP ${response.status}: ${response.statusText}` };
	}
	return response.text();
}

export async function httpGet(url: string): Promise<string | PointStdError> {
	try {
		return await readResponseText(await fetch(url));
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export async function httpPost(url: string, body: string): Promise<string | PointStdError> {
	try {
		return await readResponseText(
			await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "text/plain; charset=utf-8" },
				body,
			}),
		);
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}
