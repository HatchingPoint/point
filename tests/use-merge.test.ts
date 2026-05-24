import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filteredPublicCoreDeclarations, filterDeclarationsReferencedIn, isNameMentionedInSource } from "../packages/point/src/core/use-merge.ts";
import { parseSemanticSource } from "../packages/point/src/semantic/parse.ts";

const repoRoot = join(import.meta.dir, "..");

describe("selective use merge", () => {
	test("isNameMentionedInSource respects word boundaries", () => {
		expect(isNameMentionedInSource("return instant now()", "instant now")).toBe(true);
		expect(isNameMentionedInSource("use time", "time")).toBe(true);
		expect(isNameMentionedInSource("timeout value", "time")).toBe(false);
	});

	test("instant-demo pulls subset of std/time declarations", () => {
		const importer = readFileSync(join(repoRoot, "examples/tools/instant-demo.point"), "utf8");
		const dependency = readFileSync(join(repoRoot, "std/time.point"), "utf8");
		const dependencyProgram = parseSemanticSource(dependency, { inputPath: "std/time.point", cwd: repoRoot });
		const filtered = filterDeclarationsReferencedIn(importer, dependencyProgram.declarations);
		expect(filtered.length).toBeLessThan(dependencyProgram.declarations.length);
		expect(filtered.some((declaration) => declaration.kind === "calculation" && declaration.name === "instant now")).toBe(true);
		expect(filtered.some((declaration) => declaration.kind === "calculation" && declaration.name === "format instant")).toBe(true);
		expect(filtered.some((declaration) => declaration.kind === "calculation" && declaration.name === "format instant in timezone")).toBe(false);
	});

	test("money-demo keeps money helpers from linked std module", () => {
		const importer = readFileSync(join(repoRoot, "examples/tools/money-demo.point"), "utf8");
		const dependency = readFileSync(join(repoRoot, "std/money.point"), "utf8");
		const merged = filteredPublicCoreDeclarations(importer, dependency, "std/money.point", repoRoot);
		expect(merged.some((declaration) => declaration.kind === "function" && declaration.name.includes("money"))).toBe(true);
	});
});
