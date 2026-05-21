export function now(): string {
	return new Date().toISOString();
}

export async function sleep(ms: number): Promise<void> {
	await Bun.sleep(ms);
}

export function formatTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toUTCString();
}
