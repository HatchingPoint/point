import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
	findIntegrationTests,
	isIntegrationTestName,
	runPointIntegrationTests,
} from "../packages/point/src/core/integration-test.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { httpAssertJsonBody, httpAssertStatus, httpFetch } from "@hatchingpoint/point/std/http";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const middlewareDemo = "examples/api/middleware-integration.point";

describe("integration test naming", () => {
	test("isIntegrationTestName matches semantic integration test actions", () => {
		expect(isIntegrationTestName("integration test missing auth")).toBe(true);
		expect(isIntegrationTestName("integrationTestMissingAuth")).toBe(true);
		expect(isIntegrationTestName("test missing auth")).toBe(false);
	});

  test("findIntegrationTests discovers Bool actions in middleware integration module", async () => {
    const program = parsePointSource(await Bun.file(join(repoRoot, middlewareDemo)).text());
		const tests = findIntegrationTests(program);
		expect(tests.map((entry) => entry.semantic?.name ?? entry.name)).toEqual([
			"integration test missing auth",
			"integration test valid get item",
			"integration test create item",
		]);
	});
});

describe("http integration helpers", () => {
	test("httpFetch returns status and body snapshot text", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => new Response('{"ok":true}', { status: 201, statusText: "Created" });
		try {
			const snapshot = await httpFetch("https://example.test/items", '{"method":"POST","body":"{}"}');
			expect(httpAssertStatus(snapshot, 201)).toBe(true);
			expect(httpAssertJsonBody(snapshot, '{"ok":true}')).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("assert helpers return false on network snapshot errors", () => {
		const snapshot = JSON.stringify({ status: 0, body: "", error: "connection refused" });
		expect(httpAssertStatus(snapshot, 200)).toBe(false);
		expect(httpAssertJsonBody(snapshot, '{"ok":true}')).toBe(false);
	});
});

describe("point test integration", () => {
  test("runPointIntegrationTests passes middleware integration HTTP assertions", async () => {
		const result = await runPointIntegrationTests(middlewareDemo, repoRoot);
		expect(result.ok).toBe(true);
		expect(result.baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
		expect(result.tests).toHaveLength(3);
		expect(result.tests.every((entry) => entry.ok)).toBe(true);
	});

  test("CLI runs integration tests for middleware integration module", async () => {
		const result = await Bun.$`bun ${pointCli} test integration ${middlewareDemo}`.cwd(repoRoot).quiet();
		expect(result.exitCode).toBe(0);
		const payload = JSON.parse(result.stdout.toString()) as { ok: boolean; tests: Array<{ ok: boolean }> };
		expect(payload.ok).toBe(true);
		expect(payload.tests).toHaveLength(3);
	});
});
