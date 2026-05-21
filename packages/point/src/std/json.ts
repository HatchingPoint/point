export type PointStdError = { message: string };

export function jsonParse(value: string): string | PointStdError {
	try {
		return JSON.stringify(JSON.parse(value));
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export function jsonStringify(value: string): string {
	return JSON.stringify(JSON.parse(value));
}
