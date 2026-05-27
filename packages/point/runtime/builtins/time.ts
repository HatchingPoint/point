export type PointRuntimeBuiltinError = { message: string };

export function now(): string {
	return new Date().toISOString();
}

export function instantNow(): string {
	return now();
}

export function parseInstant(value: string): string | PointRuntimeBuiltinError {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return { message: `Invalid instant: ${value}` };
	}
	return date.toISOString();
}

export function formatInstant(value: string): string {
	return formatTime(value);
}

export function formatInstantInTimezone(value: string, timezone: string): string | PointRuntimeBuiltinError {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return { message: `Invalid instant: ${value}` };
	}
	try {
		return new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			timeZoneName: "short",
		}).format(date);
	} catch {
		return { message: `Invalid timezone: ${timezone}` };
	}
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

export function durationFromSeconds(seconds: number): number {
	return Math.trunc(seconds);
}

export function durationToSeconds(duration: number): number {
	return Math.trunc(duration);
}

export function durationFromMinutes(minutes: number): number {
	return Math.trunc(minutes) * 60;
}
