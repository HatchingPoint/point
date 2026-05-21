import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
	checkDocs,
	discoverDocsSiteMarkdown,
	extractPointFileReferences,
	extractPointSnippets,
} from "../packages/point/src/core/check-docs.ts";

describe("point check-docs", () => {
	test("extracts fenced point snippets with line numbers", () => {
		const markdown = `# Guide

\`\`\`point
label score status
  input score: Int
  output Text
  when score >= 90 return "excellent"
  otherwise return "keep going"
\`\`\`
`;
		const snippets = extractPointSnippets(markdown, "docs/site/guide/example.md");
		expect(snippets).toHaveLength(1);
		expect(snippets[0]?.line).toBe(3);
		expect(snippets[0]?.code).toContain('label score status');
	});

	test("resolves existing point file references relative to repo root", () => {
		const references = extractPointFileReferences(
			"Run `point check examples/math.point` and read `examples/math.point`.",
			"docs/site/guide/quick-start.md",
			process.cwd(),
		);
		expect(references).toEqual(["examples/math.point"]);
	});

	test("ignores hypothetical point filenames that do not exist", () => {
		const references = extractPointFileReferences(
			"Create `readiness.point` and run `point check readiness.point`.",
			"docs/site/guide/quick-start.md",
			process.cwd(),
		);
		expect(references).toEqual([]);
	});

	test("checks snippets and referenced files in a temp docs tree", async () => {
		const root = await mkdtemp(join(tmpdir(), "point-check-docs-"));
		try {
			await mkdir(join(root, "docs/site/guide"), { recursive: true });
			await mkdir(join(root, "examples"), { recursive: true });
			await writeFile(
				join(root, "examples/math.point"),
				await Bun.file("examples/math.point").text(),
			);
			await writeFile(
				join(root, "docs/site/guide/example.md"),
				`# Example

\`\`\`point
label score status
  input score: Int
  output Text
  when score >= 90 return "excellent"
  otherwise return "keep going"
\`\`\`

See \`examples/math.point\`.
`,
			);

			const result = await checkDocs({ cwd: root });
			expect(result.ok).toBe(true);
			expect(result.items.some((item) => item.kind === "snippet")).toBe(true);
			expect(result.items.some((item) => item.kind === "file" && item.label === "examples/math.point")).toBe(true);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test("reports parse errors for invalid fenced snippets", async () => {
		const root = await mkdtemp(join(tmpdir(), "point-check-docs-"));
		try {
			await mkdir(join(root, "docs/site/bad"), { recursive: true });
			await writeFile(
				join(root, "docs/site/bad/parse-error.md"),
				`\`\`\`point
rule broken
  return score
\`\`\`
`,
			);

			const result = await checkDocs({ cwd: root });
			expect(result.ok).toBe(false);
			expect(result.items[0]?.diagnostics[0]?.code).toBe("parse-error");
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test("reports diagnostics for invalid fenced snippets", async () => {
		const root = await mkdtemp(join(tmpdir(), "point-check-docs-"));
		try {
			await mkdir(join(root, "docs/site/bad"), { recursive: true });
			await writeFile(
				join(root, "docs/site/bad/invalid.md"),
				`\`\`\`point
rule broken
  input value: Missing Type
  output score: Int
  score starts at 0
  return score
\`\`\`
`,
			);

			const result = await checkDocs({ cwd: root });
			expect(result.ok).toBe(false);
			expect(result.items[0]?.diagnostics.length).toBeGreaterThan(0);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test("passes on current docs/site content", async () => {
		const files = await discoverDocsSiteMarkdown("docs/site", process.cwd());
		expect(files.length).toBeGreaterThan(0);
		const result = await checkDocs({ cwd: process.cwd() });
		expect(result.ok).toBe(true);
	});

	test("runs through the CLI", async () => {
		const result = await Bun.$`bun packages/point/src/cli.ts check-docs`.quiet();
		expect(result.stdout.toString()).toContain("Point docs check passed:");
	});
});
