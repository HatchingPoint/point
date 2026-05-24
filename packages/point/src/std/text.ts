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

export function textFromInt(value: number): string {
	return String(value);
}

export function textPadStart(value: string, length: number, fill: string): string {
	const padChar = fill.length > 0 ? fill.slice(0, 1) : " ";
	return value.padStart(length, padChar);
}
