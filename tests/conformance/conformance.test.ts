import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { join } from "node:path";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython } from "../../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";
import { parseSemanticSource } from "../../packages/point/src/semantic/parse.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const FIXTURE_PATTERNS = [
	"examples/**/*.point",
	"std/**/*.point",
	"compiler/**/*.point",
	"tests/conformance/fixtures/**/*.point",
];

const PHASE_14_20_BLOCKS = {
	"stream route": {
		example: "examples/api/stream-echo.point",
		fixture: "tests/conformance/fixtures/stream-route.point",
		tests: ["tests/stream-routes.test.ts", "tests/process-stream.test.ts"],
	},
	pipeline: {
		example: "examples/pipelines/document-ingest.point",
		fixture: "tests/conformance/fixtures/pipeline.point",
		tests: ["tests/pipeline.test.ts"],
	},
	prompt: {
		example: "examples/prompts/support-greeting.point",
		fixture: "tests/conformance/fixtures/prompt.point",
		tests: ["tests/prompt-library.test.ts"],
	},
	session: {
		example: "examples/agents/support-chat.point",
		fixture: "tests/conformance/fixtures/session.point",
		tests: ["tests/session-stream.test.ts"],
	},
	layout: {
		example: "examples/app/dashboard/dashboard.point",
		fixture: "tests/conformance/fixtures/layout-navigation.point",
		tests: ["tests/point-core.test.ts", "tests/rich-view-components.test.ts"],
	},
	navigation: {
		example: "examples/app/dashboard/dashboard.point",
		fixture: "tests/conformance/fixtures/layout-navigation.point",
		tests: ["tests/client-navigation.test.ts"],
	},
	"database actions": {
		example: "examples/app/notes/notes.point",
		fixture: "tests/conformance/fixtures/database-actions.point",
		tests: [],
	},
	schedule: {
		example: "examples/tools/health-check-schedule.point",
		fixture: "tests/conformance/fixtures/schedule.point",
		tests: ["tests/schedule-emit.test.ts"],
	},
	guard: {
		example: "examples/pipelines/guarded-output.point",
		fixture: "tests/conformance/fixtures/guard.point",
		tests: ["tests/guard-output.test.ts"],
	},
} as const;

const P22_CROSS_DOMAIN_BLOCKS = {
	"cart rule": {
		example: "examples/cart-total.point",
		fixture: "tests/conformance/fixtures/cart-total.point",
	},
	route: {
		example: "examples/route.point",
		fixture: "tests/conformance/fixtures/route.point",
	},
	workflow: {
		example: "examples/workflow.point",
		fixture: "tests/conformance/fixtures/workflow.point",
	},
	"rich view": {
		example: "examples/app/dashboard/dashboard.point",
		fixture: "tests/conformance/fixtures/rich-view.point",
	},
} as const;

const MINIMAL_FIXTURE_EMIT_EXPECTATIONS: Record<
	string,
	{ js?: string[]; ts?: string[]; py?: string[] }
> = {
	"tests/conformance/fixtures/stream-route.point": {
		js: ["Bun.serve", "websocket"],
		ts: ["Bun.serve", "websocket"],
	},
	"tests/conformance/fixtures/pipeline.point": {
		js: ["textIngestPipeline", "pointPipelineEmitLog"],
		ts: ["textIngestPipeline", "pointPipelineEmitLog"],
		py: ["fetchTextBody", "pipeline blocks are not supported"],
	},
	"tests/conformance/fixtures/prompt.point": {
		ts: ["SupportContext"],
		py: ["SupportContext"],
	},
	"tests/conformance/fixtures/session.point": {
		ts: ["supportChatSessionCreate", "supportChatSessionStreamResponse"],
		py: ["ChatMessage"],
	},
	"tests/conformance/fixtures/layout-navigation.point": {
		ts: ["createBrowserRouter", "mountAppRoutes", "AppShellLayoutSlots"],
	},
	"tests/conformance/fixtures/database-actions.point": {
		js: ["listNotesRows", "sqlQueryRaw"],
		ts: ["listNotesRows", "sqlQueryRaw"],
		py: ["listNotesRows", "sqlQueryRaw"],
	},
	"tests/conformance/fixtures/schedule.point": {
		js: ["startPointSchedules", "healthPingStatus"],
		ts: ["startPointSchedules", "healthPingStatus"],
		py: ["healthPingStatus"],
	},
	"tests/conformance/fixtures/guard.point": {
		js: ["outputPathsGuard"],
		ts: ["outputPathsGuard"],
	},
	"tests/conformance/fixtures/cart-total.point": {
		js: ["cartTotal", "lineTotal"],
		ts: ["cartTotal", "lineTotal"],
		py: ["cartTotal", "lineTotal"],
	},
	"tests/conformance/fixtures/route.point": {
		js: ["getUser"],
		ts: ["getUser"],
	},
	"tests/conformance/fixtures/workflow.point": {
		js: ["signupFlow"],
		ts: ["signupFlow"],
	},
	"tests/conformance/fixtures/rich-view.point": {
		ts: ["settingsFormView", "point-form-field"],
	},
};

const FUZZ_INVALID_INPUTS = [
	"not module\nrecord Foo\n  x: Text\n",
	"module Broken\npipeline\n",
	"module Broken\nlayout\n",
	"module Broken\nsession chat\n",
	"module Broken\nprompt greeting\n",
	"module Broken\nschedule tick\n",
	"module Broken\nnavigation app\n",
	"module Broken\nstream route echo\n  path\n",
	"module Broken\nguard paths\n  allow\n",
];

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

describe("Point conformance fixtures", () => {
	test(
		"project check-all and build-all succeed with JavaScript emit",
		async () => {
			const check = await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
			expect(check.exitCode).toBe(0);
			const build = await Bun.$`bun packages/point/src/cli.ts build-all`.quiet();
			expect(build.exitCode).toBe(0);
			const buildTs = await Bun.$`bun packages/point/src/cli.ts build-ts-all`.quiet();
			expect(buildTs.exitCode).toBe(0);
		},
		120_000,
	);

	test("discovered fixtures include core language examples", async () => {
		const fixtures = await discoverFixtures();
		expect(fixtures.length).toBeGreaterThan(20);
		expect(fixtures).toContain("examples/math.point");
		expect(fixtures).toContain("examples/variants/order-status.point");
		expect(fixtures).toContain("examples/cart-total.point");
		expect(fixtures).toContain("examples/app/todo.point");
		expect(fixtures).toContain("examples/adopters/hatchingpoint/store-readiness.point");
		expect(fixtures).toContain("examples/adopters/hatchingpoint/readiness-widget.point");
		expect(fixtures).toContain("examples/adopters/hatchingpoint/readiness-page.point");
		expect(fixtures).toContain("examples/adopters/starter-labs/subscription-tier.point");
		expect(fixtures).toContain("examples/starter-template/src/app.point");
		expect(fixtures).toContain("compiler/passes/naming-lint.point");
	});

	test("discovered fixtures include Phase 14-20 semantic blocks", async () => {
		const fixtures = await discoverFixtures();
		for (const [block, coverage] of Object.entries(PHASE_14_20_BLOCKS)) {
			expect(fixtures).toContain(coverage.example);
			expect(fixtures).toContain(coverage.fixture);
			void block;
		}
	});

	test("discovered fixtures include Phase 22 cross-domain blocks", async () => {
		const fixtures = await discoverFixtures();
		for (const [block, coverage] of Object.entries(P22_CROSS_DOMAIN_BLOCKS)) {
			expect(fixtures).toContain(coverage.example);
			expect(fixtures).toContain(coverage.fixture);
			void block;
		}
	});

	test("representative fixtures emit JavaScript via default build", async () => {
		for (const fixture of ["examples/math.point", "examples/cart-total.point", "compiler/passes/naming-lint.point"]) {
			const base = fixture.split("/").pop()?.replace(/\.point$/, "") ?? "program";
			const jsOut = `generated/${base}.js`;
			const build = await Bun.$`bun packages/point/src/cli.ts build ${fixture} ${jsOut}`.quiet();
			expect(build.exitCode).toBe(0);
			const generated = await Bun.file(jsOut).text();
			expect(generated).not.toContain(": number");
			expect(generated).not.toContain("interface ");
		}
	});

	for (const [fixture, expectations] of Object.entries(MINIMAL_FIXTURE_EMIT_EXPECTATIONS)) {
		test(`minimal fixture ${fixture} checks and emits JS/TS snapshots`, async () => {
			const source = await Bun.file(join(repoRoot, fixture)).text();
			const program = parsePointSource(source);
			expect(checkPointCore(program)).toEqual([]);

			if (expectations.js) {
				const js = emitPointCoreJavaScript(program);
				for (const snippet of expectations.js) expect(js).toContain(snippet);
			}
			if (expectations.ts) {
				const ts = emitPointCoreTypeScript(program);
				for (const snippet of expectations.ts) expect(ts).toContain(snippet);
			}
			if (expectations.py) {
				const py = emitPointCorePython(program);
				for (const snippet of expectations.py) expect(py).toContain(snippet);
			}
		});
	}
});

describe("semantic parser fuzz", () => {
	for (const [index, source] of FUZZ_INVALID_INPUTS.entries()) {
		test(`rejects malformed semantic input ${index + 1}`, () => {
			expect(() => parseSemanticSource(source)).toThrow();
		});
	}

	test("handles random garbage without hanging", () => {
		const garbage = Array.from({ length: 40 }, (_, index) => `line ${index} ${Math.random().toString(36).slice(2)}`).join("\n");
		try {
			const program = parseSemanticSource(`module Fuzz\n${garbage}`);
			expect(program.kind).toBe("semanticProgram");
		} catch {
			expect(true).toBe(true);
		}
	});
});
