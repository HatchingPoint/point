import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

export function pathJoin(left: string, right: string): string {
	return join(left, right);
}

export function pathBasename(value: string): string {
	return basename(value);
}

export function pathDirname(value: string): string {
	return dirname(value);
}

export function pathExtname(value: string): string {
	return extname(value);
}

export function pathResolve(value: string): string {
	return resolve(value);
}

export function pathIsAbsolute(value: string): boolean {
	return isAbsolute(value);
}
