export function now(): string {
	return new Date().toISOString();
}

export function instantNow(): string {
	return now();
}

export function parseInstant(value: string): string | { message: string } {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return { message: `Invalid instant: ${value}` };
	}
	return date.toISOString();
}

export function formatInstant(value: string): string {
	return formatTime(value);
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
