import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { parsePointSourceLegacy } from "../packages/point/src/core/test-only/index.ts";
import { serializeCoreProgram, stripSpans } from "../packages/point/src/core/serialize.ts";
import {
	desugarSemanticImports,
	desugarSemanticProgram,
	parseSemanticSource,
} from "../packages/point/src/semantic/index.ts";

const repoRoot = join(import.meta.dir, "..");
const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];
const LEGACY_PARITY_SKIP = new Set([
	"examples/adopters/hatchingpoint/readiness-widget.point",
	"examples/adopters/hatchingpoint/readiness-page.point",
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
	"std/process.point",
	"std/http.point",
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

describe("semantic desugar", () => {
	test("parsePointSource uses in-memory desugar pipeline", () => {
		const source = readFileSync(join(repoRoot, "examples/math.point"), "utf8");
		expect(stripSpans(parsePointSource(source))).toEqual(stripSpans(desugarSemanticProgram(parseSemanticSource(source))));
	});

	test("desugared core AST matches legacy pipeline for all fixtures", async () => {
		for (const fixture of await discoverFixtures()) {
			if (LEGACY_PARITY_SKIP.has(fixture)) continue;
			const source = readFileSync(join(repoRoot, fixture), "utf8");
			const legacy = parsePointSourceLegacy(source);
			const desugared = desugarSemanticProgram(parseSemanticSource(source));
			expect(stripSpans(desugared)).toEqual(stripSpans(legacy));
		}
	});

	test("desugarSemanticImports builds import declarations", () => {
		const catalog = desugarSemanticProgram(parseSemanticSource(readFileSync(join(repoRoot, "examples/multi-file/catalog.point"), "utf8")));
		const orderSemantic = parseSemanticSource(readFileSync(join(repoRoot, "examples/multi-file/order.point"), "utf8"));
		const imports = desugarSemanticImports(orderSemantic.uses, () => ({
			from: "./catalog",
			names: catalog.declarations
				.filter((declaration) => declaration.kind === "type" || declaration.kind === "function")
				.map((declaration) => declaration.name),
		}));
		expect(stripSpans(imports)).toEqual([
			{
				kind: "import",
				names: ["Product", "productLineTotal"],
				from: "./catalog",
			},
		]);
	});
});
