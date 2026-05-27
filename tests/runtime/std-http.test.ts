import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { httpAssertJsonBody, httpAssertStatus, httpFetch, httpGet, httpPost, interpretCoreProgramEntryAsync } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../../packages/point/src/core/cli.ts";
import {
	type PointCoreProgram,
} from "../../packages/point/src/core/index.ts";
import { readPointLock } from "../../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..", "..");

function withFetchStub<T>(handler: typeof fetch, run: () => T | Promise<T>): Promise<T> {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = handler;
	return Promise.resolve(run()).finally(() => {
		globalThis.fetch = originalFetch;
	});
}

function functionName(program: PointCoreProgram, semanticName: string): string {
	const declaration = program.declarations.find(
		(candidate) => candidate.kind === "function" && candidate.semantic?.name === semanticName,
	);
	if (!declaration || declaration.kind !== "function") throw new Error(`Missing function ${semanticName}`);
	return declaration.name;
}

describe("runtime std.http", () => {
	test("runtime-owned helpers fetch snapshots and assert response bodies", async () => {
		await withFetchStub(
			async (_input, init) =>
				new Response(JSON.stringify({ ok: true, method: init?.method ?? "GET", body: init?.body ?? "" }), {
					status: 201,
					headers: { "content-type": "application/json" },
				}),
			async () => {
				const snapshot = await httpFetch("https://point.test/items", JSON.stringify({ method: "POST", body: "payload" }));

				expect(httpAssertStatus(snapshot, 201)).toBe(true);
				expect(httpAssertJsonBody(snapshot, JSON.stringify({ ok: true, method: "POST", body: "payload" }))).toBe(true);
				expect(httpAssertStatus(snapshot, 200)).toBe(false);
			},
		);
	});

	test("runtime-owned get and post helpers return text or Point error records", async () => {
		await withFetchStub(
			async (_input, init) => {
				if (init?.method === "POST") return new Response(`posted:${init.body}`, { status: 200 });
				return new Response("missing", { status: 404, statusText: "Not Found" });
			},
			async () => {
				expect(await httpPost("https://point.test/items", "one")).toBe("posted:one");
				expect(await httpGet("https://point.test/missing")).toEqual({ message: "HTTP 404: Not Found" });
			},
		);
	});

	test("Point modules using std.http execute through the runtime interpreter", async () => {
		const source = `module RuntimeStdHttp

use std.http

action fetch snapshot
  input url: Text
  output snapshot: Text
  touches network
  return await httpFetchSnapshot(url, "{\\"method\\":\\"GET\\"}")

calculation status ok
  input snapshot: Text
  output passed: Bool
  passed is httpAssertStatusPassed(snapshot, 200)

calculation body ok
  input snapshot: Text
  output passed: Bool
  passed is httpAssertJsonBodyPassed(snapshot, "{\\"ok\\":true}")
`; 
		const lock = await readPointLock(repoRoot);
		const coreFile = buildCoreFileFromSource("tests/runtime/std-http.inline.point", source, lock, repoRoot);
		const program = programWithDependencyDeclarations(coreFile, await createModuleGraphForFile(coreFile, lock, repoRoot), repoRoot);
		expect(checkPointCore(program)).toEqual([]);

		await withFetchStub(
			async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }),
			async () => {
				const snapshot = await interpretCoreProgramEntryAsync(program, functionName(program, "fetch snapshot"), ["https://point.test/api"]);

				expect(typeof snapshot).toBe("string");
				expect(await interpretCoreProgramEntryAsync(program, functionName(program, "status ok"), [snapshot])).toBe(true);
				expect(await interpretCoreProgramEntryAsync(program, functionName(program, "body ok"), [snapshot])).toBe(true);
			},
		);
	});
});
