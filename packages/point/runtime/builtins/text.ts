export function trim(value: string): string {
	return value.trim();
}

export function lowercase(value: string): string {
	return value.toLowerCase();
}

export function contains(value: string, search: string): boolean {
	return value.includes(search);
}

export function stripPrefix(value: string, prefix: string): string {
	if (!value.startsWith(prefix)) {
		return value;
	}

	return value.slice(prefix.length);
}
