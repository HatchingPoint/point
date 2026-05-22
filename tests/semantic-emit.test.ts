import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { parsePointSourceLegacy } from "../packages/point/src/core/test-only/index.ts";

const repoRoot = join(import.meta.dir, "..");
const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];
const LEGACY_PARITY_SKIP = new Set([
	"examples/adopters/hatchingpoint/readiness-widget.point",
	"examples/adopters/hatchingpoint/readiness-page.point",
	"examples/adopters/hatchingpoint/store-readiness.point",
	"examples/api/middleware-demo.point",
	"examples/api/middleware-integration.point",
	"examples/api/stream-echo.point",
	"examples/app/dashboard/dashboard.point",
	"examples/full-stack-template/src/app.point",
	"examples/app/log-viewer/log-viewer.point",
	"examples/app/notes/notes.point",
	"examples/app/todo.point",
	"examples/pure/math-only.point",
	"examples/tools/health-check-schedule.point",
	"examples/prompts/support-greeting.point",
	"examples/pipelines/document-ingest.point",
	"examples/pipelines/guarded-output.point",
	"examples/agents/support-chat.point",
	"examples/variants/order-status.point",
	"examples/workflow-retry.point",
	"examples/workflow.point",
	"examples/catalog/price-lookup.point",
	"examples/std-usage.point",
	"examples/tools/instant-demo.point",
	"examples/view.point",
	"std/process.point",
	"std/http.point",
	"std/time.point",
]);

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

function stripJavaScriptSourceMapTags(source: string): string {
	return source.replace(/\s+\/\/ @point \d+/g, "");
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
		expect(emitPointCorePython(program)).toContain("def doubleDoubled(value: int) -> int:");
	});

	test("TypeScript and JavaScript emit match legacy pipeline for all fixtures", async () => {
		const routeServiceFixtures = new Set([
			"examples/adopters/hatchingpoint/store-readiness.point",
			"examples/api/middleware-demo.point",
		]);
		for (const fixture of await discoverFixtures()) {
			if (LEGACY_PARITY_SKIP.has(fixture)) continue;
			const source = readFileSync(join(repoRoot, fixture), "utf8");
			const legacy = parsePointSourceLegacy(source);
			const ast = parsePointSource(source);
			expect(emitPointCoreTypeScript(ast)).toBe(emitPointCoreTypeScript(legacy));
			if (!routeServiceFixtures.has(fixture)) {
				expect(stripJavaScriptSourceMapTags(emitPointCoreJavaScript(ast))).toBe(stripJavaScriptSourceMapTags(emitPointCoreJavaScript(legacy)));
			}
		}
	});
});
