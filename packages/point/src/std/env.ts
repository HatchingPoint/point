export function envGet(name: string): string | null {
	const value = process.env[name];
	return value === undefined ? null : value;
}

export function envGetOrDefault(name: string, defaultValue: string): string {
	return process.env[name] ?? defaultValue;
}
