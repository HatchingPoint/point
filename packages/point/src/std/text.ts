export function textLength(value: string): number {
	return value.length;
}

export function textContains(value: string, search: string): boolean {
	return value.includes(search);
}

export function textSplit(value: string, separator: string): string[] {
	return value.split(separator);
}

export function textTrim(value: string): string {
	return value.trim();
}
