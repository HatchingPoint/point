import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { createPointRuntimeFetchHandler, registerRuntimeRoutes, startPointRuntimeServer } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");

async function checkedProgram(relativePath: string) {
	const input = join(repoRoot, relativePath);
	const program = parsePointSource(await readFile(input, "utf8"), { cwd: repoRoot, input });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime HTTP server", () => {
	test("discovers route metadata without emitted JavaScript", async () => {
		const program = await checkedProgram("examples/route.point");
		const registry = registerRuntimeRoutes(program);

		expect(registry.routes).toEqual([{ method: "GET", path: "/users/:id", name: "get user" }]);
	});

	test("serves route handlers through the runtime fetch handler", async () => {
		const program = await checkedProgram("examples/route.point");
		const handler = createPointRuntimeFetchHandler(program);

		const response = await handler(new Request("http://point.test/users/alice"));

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("alice");
	});

	test("returns 404 for missing runtime routes", async () => {
		const program = await checkedProgram("examples/route.point");
		const handler = createPointRuntimeFetchHandler(program);

		const response = await handler(new Request("http://point.test/missing"));

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "Not found" });
	});

	test("starts a Bun-backed runtime server", async () => {
		const program = await checkedProgram("examples/route.point");
		const server = startPointRuntimeServer(program, { hostname: "127.0.0.1" });
		try {
			const response = await fetch(`http://127.0.0.1:${server.port}/users/42`);

			expect(response.status).toBe(200);
			expect(await response.text()).toBe("42");
		} finally {
			server.stop(true);
		}
	});
});
