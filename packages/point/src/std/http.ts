type PointStdError = { message: string };

type HttpFetchOptions = {
	method?: string;
	headers?: Record<string, string>;
	body?: string;
};

export type HttpResponseSnapshot = {
	status: number;
	body: string;
	error?: string;
};

async function readResponseText(response: Response): Promise<string | PointStdError> {
	if (!response.ok) {
		return { message: `HTTP ${response.status}: ${response.statusText}` };
	}
	return response.text();
}

function parseFetchOptions(optionsJson: string): HttpFetchOptions {
	if (!optionsJson.trim()) return {};
	const parsed = JSON.parse(optionsJson) as HttpFetchOptions;
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("HTTP fetch options must be a JSON object.");
	}
	return parsed;
}

export function serializeHttpResponse(snapshot: HttpResponseSnapshot): string {
	return JSON.stringify(snapshot);
}

export async function httpFetch(url: string, optionsJson = "{}"): Promise<string> {
	try {
		const options = parseFetchOptions(optionsJson);
		const response = await fetch(url, {
			method: options.method ?? "GET",
			headers: options.headers,
			body: options.body,
		});
		return serializeHttpResponse({
			status: response.status,
			body: await response.text(),
		});
	} catch (error) {
		return serializeHttpResponse({
			status: 0,
			body: "",
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

export function httpAssertStatus(responseJson: string, expectedStatus: number): boolean {
	try {
		const parsed = JSON.parse(responseJson) as HttpResponseSnapshot;
		if (parsed.error) return false;
		return parsed.status === expectedStatus;
	} catch {
		return false;
	}
}

export function httpAssertJsonBody(responseJson: string, expectedJson: string): boolean {
	try {
		const parsed = JSON.parse(responseJson) as HttpResponseSnapshot;
		if (parsed.error) return false;
		const actual = JSON.parse(parsed.body);
		const expected = JSON.parse(expectedJson);
		return JSON.stringify(actual) === JSON.stringify(expected);
	} catch {
		return false;
	}
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
