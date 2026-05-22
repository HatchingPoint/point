import { toIdentifier } from "./naming.ts";

type FieldLike = { name: string; semanticName?: string };

type FieldAliasCandidate = {
	field: FieldLike;
	label: string;
	alias: string;
	aliasDistance: number;
	labelDistance: number;
	leadingWordMatch: boolean;
};

export type FieldAliasResolution =
	| { kind: "none" }
	| { kind: "unique"; fieldName: string; label: string }
	| { kind: "ambiguous"; labels: string[] };

export function resolveFieldAlias(fields: FieldLike[], accessName: string): FieldAliasResolution {
	const candidates = buildCandidates(fields, accessName);
	const accepted = candidates.filter(
		(candidate) => candidate.leadingWordMatch && candidate.aliasDistance <= aliasDistanceThreshold(candidate.alias),
	);
	if (accepted.length === 0) return { kind: "none" };
	const bestDistance = Math.min(...accepted.map((candidate) => candidate.aliasDistance));
	const best = accepted.filter((candidate) => candidate.aliasDistance === bestDistance);
	if (best.length === 1) {
		const candidate = best[0]!;
		return { kind: "unique", fieldName: candidate.field.name, label: candidate.label };
	}
	return { kind: "ambiguous", labels: best.map((candidate) => candidate.label).sort((left, right) => left.localeCompare(right)) };
}

export function suggestFieldLabel(fields: FieldLike[], accessName: string): string | null {
	const candidates = buildCandidates(fields, accessName);
	if (candidates.length === 0) return null;
	const best = candidates
		.sort((left, right) => suggestionScore(accessName, left) - suggestionScore(accessName, right) || left.label.localeCompare(right.label))[0]!;
	return suggestionScore(accessName, best) <= 8 ? best.label : null;
}

function buildCandidates(fields: FieldLike[], accessName: string): FieldAliasCandidate[] {
	const accessWords = splitWords(accessName);
	const accessKey = normalizeKey(accessName);
	return fields.map((field) => {
		const label = field.semanticName ?? field.name;
		const alias = toIdentifier(label);
		const aliasWords = splitWords(alias);
		const leadingWordMatch =
			(accessWords.length > 0 && aliasWords.length > 0 && accessWords[0] === aliasWords[0]) ||
			(accessWords.length === 1 && aliasWords.length > 1 && accessWords[0]!.startsWith(aliasWords[0]!));
		return {
			field,
			label,
			alias,
			aliasDistance: levenshteinDistance(accessKey, normalizeKey(alias)),
			labelDistance: levenshteinDistance(accessKey, normalizeKey(label)),
			leadingWordMatch,
		};
	});
}

function aliasDistanceThreshold(alias: string): number {
	return Math.max(3, Math.floor(alias.length * 0.5));
}

function suggestionScore(accessName: string, candidate: FieldAliasCandidate): number {
	const accessKey = normalizeKey(accessName);
	const labelKey = normalizeKey(candidate.label);
	const lengthPenalty = Math.floor(Math.abs(accessKey.length - labelKey.length) / 2);
	const shortLabelPenalty = accessKey.length >= 6 && labelKey.length <= 4 ? 2 : 0;
	return candidate.labelDistance + lengthPenalty + shortLabelPenalty;
}

function splitWords(value: string): string[] {
	const normalized = value.replace(/[^A-Za-z0-9]+/g, " ").trim();
	if (!normalized) return [];
	const chunks = normalized.match(/[A-Z]+(?=[A-Z][a-z0-9]|\b)|[A-Z]?[a-z0-9]+/g) ?? [];
	return chunks.map((chunk) => chunk.toLowerCase());
}

function normalizeKey(value: string): string {
	return value.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
}

function levenshteinDistance(left: string, right: string): number {
	if (left === right) return 0;
	if (left.length === 0) return right.length;
	if (right.length === 0) return left.length;
	let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
	for (let row = 1; row <= left.length; row += 1) {
		const current = [row];
		for (let column = 1; column <= right.length; column += 1) {
			const substitution = previous[column - 1]! + (left[row - 1] === right[column - 1] ? 0 : 1);
			const insertion = current[column - 1]! + 1;
			const deletion = previous[column]! + 1;
			current[column] = Math.min(substitution, insertion, deletion);
		}
		previous = current;
	}
	return previous[right.length]!;
}
