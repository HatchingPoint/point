export function envGet(name: string): string | null {
	const value = process.env[name];
	return value === undefined ? null : value;
}
