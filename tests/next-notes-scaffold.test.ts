import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadPairedScaffoldManifest, measurePairedScaffoldCase, readScaffoldVariantFile } from "../scripts/paired-scaffold-context.ts";

const NEXT_DIR = join(import.meta.dir, "../benchmarks/next-notes");

describe("next-notes paired scaffold", () => {
	test("manifest maps notes agent-app case", () => {
		const manifest = loadPairedScaffoldManifest("next-notes");
		expect(Object.keys(manifest.caseMapping)).toEqual(["notes-add-detail"]);
	});

	test("golden includes detail route loader", () => {
		expect(readScaffoldVariantFile("next-notes", "golden", "lib/getNote.ts")).toContain("getNote");
		expect(readScaffoldVariantFile("next-notes", "golden", "app/notes/[id]/page.tsx")).toContain("NoteDetail");
	});

	test("broken detail-add mirrors missing loader module", () => {
		expect(readScaffoldVariantFile("next-notes", "broken-detail-add", "lib/getNote.ts")).toBeNull();
		expect(readScaffoldVariantFile("next-notes", "broken-detail-add", "components/NoteDetail.tsx")).toContain("getNote");
	});

	test("measured TS context bundle is non-trivial", () => {
		const metrics = measurePairedScaffoldCase("next-notes", "notes-add-detail");
		expect(metrics.brokenContextTokens).toBeGreaterThan(200);
		expect(metrics.filesMissing).toContain("lib/getNote.ts");
	});

	test("README documents variants", () => {
		const readme = readFileSync(join(NEXT_DIR, "README.md"), "utf8");
		expect(readme).toContain("broken-detail-add");
	});
});
