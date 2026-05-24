import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const POINT_ROADMAP_ANALYZE_SCHEMA = "point.roadmap.analyze.v1" as const;

export interface PointRoadmapPhaseSummary {
	number: number;
	file: string;
	status: string;
	openCriteria: number;
	doneCriteria: number;
}

export interface PointRoadmapAuditGap {
	primitive: string;
	status: string;
	decision: string;
}

export interface PointRoadmapAnalysis {
	schemaVersion: typeof POINT_ROADMAP_ANALYZE_SCHEMA;
	generatedAt: string;
	activePhases: PointRoadmapPhaseSummary[];
	completedPhases: PointRoadmapPhaseSummary[];
	candidateBacklog: string[];
	auditGaps: PointRoadmapAuditGap[];
	agentRepairCases: number;
	examplePointFiles: number;
	stdPointFiles: number;
	deferredMentions: string[];
	nextSuggestedPhaseNumber: number;
	expansionHints: string[];
}

function countCriteria(markdown: string): { open: number; done: number } {
	const lines = markdown.split("\n");
	let open = 0;
	let done = 0;
	for (const line of lines) {
		if (/^- \[ \]/.test(line)) open += 1;
		if (/^- \[x\]/i.test(line)) done += 1;
	}
	return { open, done };
}

function extractStatus(markdown: string): string {
	const match = markdown.match(/^\*\*Status:\*\*\s*(.+)$/m);
	return match?.[1]?.trim() ?? "unknown";
}

function extractPhaseNumber(filename: string): number | undefined {
	const match = filename.match(/^phase(\d+)-plan\.md$/);
	return match ? Number.parseInt(match[1] ?? "", 10) : undefined;
}

function extractBacklogLines(markdown: string): string[] {
	const lines: string[] = [];
	for (const line of markdown.split("\n")) {
		const trimmed = line.trim();
		if (/^-\s+\*\*Phase \d+/.test(trimmed)) lines.push(trimmed.replace(/^-\s+/, ""));
		if (/^-\s+\*\*Later:/.test(trimmed)) lines.push(trimmed.replace(/^-\s+/, ""));
		if (/^-\s+\*\*Defer/.test(trimmed)) lines.push(trimmed.replace(/^-\s+/, ""));
		if (/^\d+\.\s+`.+`/.test(trimmed) && /Phase \d+/i.test(trimmed)) lines.push(trimmed);
	}
	return lines;
}

function parseAuditGaps(markdown: string): PointRoadmapAuditGap[] {
	const gaps: PointRoadmapAuditGap[] = [];
	for (const line of markdown.split("\n")) {
		if (!line.startsWith("|") || line.includes("Primitive")) continue;
		const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
		if (cells.length < 3) continue;
		const primitive = cells[0]?.replace(/`/g, "") ?? "";
		const status = cells[1] ?? "";
		const decision = cells[2]?.replace(/\*\*/g, "") ?? "";
		if (!primitive || primitive.includes("---")) continue;
		gaps.push({ primitive, status, decision });
	}
	return gaps;
}

async function countGlob(root: string, pattern: RegExp): Promise<number> {
	let count = 0;
	async function walk(dir: string): Promise<void> {
		let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === "node_modules" || entry.name === ".git") continue;
				await walk(path);
				continue;
			}
			if (entry.isFile() && pattern.test(entry.name)) count += 1;
		}
	}
	await walk(root);
	return count;
}

export async function analyzePointRoadmap(repoRoot = process.cwd()): Promise<PointRoadmapAnalysis> {
	const docsDir = join(repoRoot, "docs");
	const docsEntries = await readdir(docsDir);
	const phaseFiles = docsEntries.filter((name) => /^phase\d+-plan\.md$/.test(name)).sort((a, b) => {
		const left = extractPhaseNumber(a) ?? 0;
		const right = extractPhaseNumber(b) ?? 0;
		return left - right;
	});

	const phases: PointRoadmapPhaseSummary[] = [];
	const candidateBacklog: string[] = [];
	const deferredMentions: string[] = [];

	for (const file of phaseFiles) {
		const number = extractPhaseNumber(file);
		if (!number) continue;
		const markdown = await readFile(join(docsDir, file), "utf8");
		const { open, done } = countCriteria(markdown);
		phases.push({
			number,
			file,
			status: extractStatus(markdown),
			openCriteria: open,
			doneCriteria: done,
		});
		candidateBacklog.push(...extractBacklogLines(markdown));
		for (const line of markdown.split("\n")) {
			if (/defer/i.test(line) && line.trim().startsWith("-")) deferredMentions.push(`${file}: ${line.trim()}`);
		}
	}

	const auditPath = join(docsDir, "language-primitive-audit.md");
	const auditMarkdown = await readFile(auditPath, "utf8").catch(() => "");
	const auditGaps = parseAuditGaps(auditMarkdown);

	let agentRepairCases = 0;
	try {
		const benchmark = JSON.parse(await readFile(join(repoRoot, "benchmarks/agent-repair-cases.json"), "utf8")) as { cases?: unknown[] };
		agentRepairCases = benchmark.cases?.length ?? 0;
	} catch {
		agentRepairCases = 0;
	}

	const examplePointFiles = await countGlob(join(repoRoot, "examples"), /\.point$/);
	const stdPointFiles = await countGlob(join(repoRoot, "std"), /\.point$/);

	const activePhases = phases.filter((phase) => {
		const status = phase.status.toLowerCase();
		const looksComplete = /complete|shipped|superseded|done/.test(status);
		const looksActive = /active|in progress|draft|parallel|running/.test(status);
		if (looksComplete) return false;
		if (looksActive) return true;
		return phase.number >= 26 && phase.openCriteria > 0;
	});
	const completedPhases = phases.filter((phase) => {
		const status = phase.status.toLowerCase();
		return /complete|shipped|done/.test(status) && phase.openCriteria === 0;
	});

	const maxPhase = phases.reduce((max, phase) => Math.max(max, phase.number), 0);
	const expansionHints = [
		"Prefer semantic block extensions over new syntax (point-principles-gate.md).",
		"Split language vs agent-loop vs emit-target tracks when file ownership would conflict.",
		"Each new phase needs success criteria checkboxes, non-goals, and file ownership if parallel.",
		"Update language-primitive-audit.md when closing a primitive gap.",
	];

	const uniqueBacklog = [...new Set([...candidateBacklog, ...auditGaps.filter((gap) => /defer/i.test(gap.decision)).map((gap) => `${gap.primitive}: ${gap.decision}`)])];

	return {
		schemaVersion: POINT_ROADMAP_ANALYZE_SCHEMA,
		generatedAt: new Date().toISOString(),
		activePhases,
		completedPhases,
		candidateBacklog: uniqueBacklog,
		auditGaps,
		agentRepairCases,
		examplePointFiles,
		stdPointFiles,
		deferredMentions: deferredMentions.slice(0, 40),
		nextSuggestedPhaseNumber: maxPhase + 1,
		expansionHints,
	};
}

export function formatPointRoadmapAnalysis(analysis: PointRoadmapAnalysis): string {
	return `${JSON.stringify(analysis, null, 2)}\n`;
}
