import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

function toPointPath(value: string): string {
	return value.replaceAll("\\", "/");
}

export function pathJoin(left: string, right: string): string {
	return toPointPath(join(left, right));
}

export function pathBasename(value: string): string {
	return basename(value);
}

export function pathDirname(value: string): string {
	return toPointPath(dirname(value));
}

export function pathExtname(value: string): string {
	return extname(value);
}

export function pathResolve(value: string): string {
	return toPointPath(resolve(value));
}

export function pathIsAbsolute(value: string): boolean {
	return isAbsolute(value);
}
