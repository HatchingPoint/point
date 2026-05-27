import { readFileSync, writeFileSync } from "node:fs";

export type PointRuntimeFsError = { message: string };

export function readFile(path: string): string | PointRuntimeFsError {
	try {
		return readFileSync(path, "utf8");
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export function writeFile(path: string, contents: string): null | PointRuntimeFsError {
	try {
		writeFileSync(path, contents, "utf8");
		return null;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}
