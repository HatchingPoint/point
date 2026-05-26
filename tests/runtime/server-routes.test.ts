import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { registerRuntimeRoutes } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const experimentRoot = join(repoRoot, "experiments/point-only");
const experimentSourcePath = join(experimentRoot, "src/app.point");

async function checkedProgram(source: string, input = "inline.point") {
	const program = parsePointSource(source, { cwd: repoRoot, input });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

async function pointFilesUnder(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true });
	return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
}

describe("runtime route registry", () => {
	test("registers routes and middleware from a checked program", async () => {
		const program = await checkedProgram(`module RuntimeRoutes

record Auth Headers
  authorization: Text

record Item Response
  item: Text
  authenticated: Bool

middleware require auth
  input headers: Auth Headers
  output response: Maybe Text
  when headers.authorization != "ok" return "unauthorized"
  otherwise return none

route get item
  method GET
  path "/items/:item"
  before require auth
  input item: Text
  input headers: Auth Headers
  output response: Item Response
  return json { item: item, authenticated: true }
`);
		const registry = registerRuntimeRoutes(program);
		expect(registry.routes).toEqual([{ method: "GET", path: "/items/:item", name: "get item" }]);

		const unauthorized = await registry.fetch(new Request("http://point.test/items/book"));
		expect(unauthorized.status).toBe(401);
		expect(await unauthorized.text()).toBe("unauthorized");

		const ok = await registry.fetch(new Request("http://point.test/items/book", { headers: { authorization: "ok" } }));
		expect(ok.status).toBe(200);
		expect(await ok.json()).toEqual({ item: "book", authenticated: true });
	});

	test("experiment app exposes deploy readiness JSON through runtime route registry", async () => {
		const source = await readFile(experimentSourcePath, "utf8");
		const program = await checkedProgram(source, experimentSourcePath);
		const registry = registerRuntimeRoutes(program);
		expect(registry.routes).toContainEqual({ method: "GET", path: "/readiness", name: "get readiness" });

		const response = await registry.fetch(new Request("http://point.test/readiness"));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ score: 100, label: "ready", tone: "positive" });
	});

	test("experiment app does not contain emitted Bun.serve strings", async () => {
		const files = await pointFilesUnder(experimentRoot);
		for (const file of files) {
			const source = await readFile(file, "utf8");
			expect(source).not.toContain("Bun.serve");
		}
	});
});
