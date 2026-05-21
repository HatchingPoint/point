import { readFileSync, writeFileSync } from "node:fs";

type PointStdError = { message: string };

export function readFile(path: string): string | PointStdError {
	try {
		return readFileSync(path, "utf8");
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export function writeFile(path: string, contents: string): void | PointStdError {
	try {
		writeFileSync(path, contents, "utf8");
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}
