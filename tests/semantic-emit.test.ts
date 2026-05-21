import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { parsePointSourceLegacy } from "../packages/point/src/core/test-only/index.ts";

const repoRoot = join(import.meta.dir, "..");
const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];

async function discoverFixtures(): Promise<string[]> {
	const fixtures = new Set<string>();
	for (const pattern of FIXTURE_PATTERNS) {
		const glob = new Glob(pattern);
		for await (const path of glob.scan({ cwd: repoRoot, onlyFiles: true })) {
			if (!path.includes("/generated/")) fixtures.add(path.replaceAll("\\", "/"));
		}
	}
	return [...fixtures].sort((a, b) => a.localeCompare(b));
}

describe("semantic emit", () => {
	test("emit backends consume core AST only", () => {
		const program = parsePointSource(`module Math

calculation double
  input value: Int
  output doubled: Int
  doubled is value * 2
`);
		expect(program.kind).toBe("coreProgram");
		expect(checkPointCore(program)).toEqual([]);
		expect(emitPointCoreTypeScript(program)).toContain("export function double");
		expect(emitPointCoreJavaScript(program)).toContain("export function double");
		expect(emitPointCoreJavaScript(program)).not.toContain(": number");
	});

	test("TypeScript and JavaScript emit match legacy pipeline for all fixtures", async () => {
		for (const fixture of await discoverFixtures()) {
			const source = readFileSync(join(repoRoot, fixture), "utf8");
			const legacy = parsePointSourceLegacy(source);
			const ast = parsePointSource(source);
			expect(emitPointCoreTypeScript(ast)).toBe(emitPointCoreTypeScript(legacy));
			expect(emitPointCoreJavaScript(ast)).toBe(emitPointCoreJavaScript(legacy));
		}
	});
});
