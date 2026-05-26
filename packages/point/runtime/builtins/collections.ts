export function listLength<T>(items: readonly T[]): number {
	return items.length;
}

export function countMatching<T>(items: readonly T[], predicate: (item: T) => boolean): number {
	let count = 0;
	for (const item of items) {
		if (predicate(item)) count += 1;
	}
	return count;
}

export function maxInt(left: number, right: number): number {
	return Math.max(Math.trunc(left), Math.trunc(right));
}

export function roundInt(value: number): number {
	return Math.round(value);
}

export function clampInt(value: number, min: number, max: number): number {
	const lower = Math.trunc(min);
	const upper = Math.trunc(max);
	const current = Math.trunc(value);
	return Math.min(Math.max(current, lower), upper);
}
