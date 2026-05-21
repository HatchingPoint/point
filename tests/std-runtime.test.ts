import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { envGet } from "@hatchingpoint/point/std/env";
import { readFile, writeFile } from "@hatchingpoint/point/std/fs";
import { httpGet, httpPost } from "@hatchingpoint/point/std/http";
import { jsonParse, jsonStringify } from "@hatchingpoint/point/std/json";
import { formatTime, now, sleep } from "@hatchingpoint/point/std/time";
import { textContains, textLength, textSplit, textTrim } from "@hatchingpoint/point/std/text";

describe("@hatchingpoint/point std runtime shims", () => {
	test("jsonParse and jsonStringify round-trip JSON text", () => {
		const input = '{"name":"Point","count":2}';
		expect(jsonParse(input)).toBe(input);
		expect(jsonStringify(input)).toBe(input);
	});

	test("jsonParse returns Point error shape on invalid JSON", () => {
		const result = jsonParse("{");
		expect(result).toEqual({ message: expect.any(String) });
	});

	test("httpGet and httpPost use fetch and return response text", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (input, init) => {
			const url = String(input);
			if (url === "https://example.test/get") {
				return new Response("get-ok", { status: 200 });
			}
			if (url === "https://example.test/post" && init?.method === "POST") {
				const body = typeof init.body === "string" ? init.body : "";
				return new Response(`post:${body}`, { status: 200 });
			}
			return new Response("missing", { status: 404, statusText: "Not Found" });
		};

		try {
			expect(await httpGet("https://example.test/get")).toBe("get-ok");
			expect(await httpPost("https://example.test/post", "payload")).toBe("post:payload");
			expect(await httpGet("https://example.test/missing")).toEqual({ message: "HTTP 404: Not Found" });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("text helpers expose basic string operations", () => {
		expect(textLength("Point")).toBe(5);
		expect(textContains("Point language", "lang")).toBe(true);
		expect(textContains("Point language", "json")).toBe(false);
		expect(textSplit("a,b,c", ",")).toEqual(["a", "b", "c"]);
		expect(textTrim("  hello  ")).toBe("hello");
	});

	test("envGet returns process env values or null", () => {
		const key = "POINT_STD_RUNTIME_TEST";
		const original = process.env[key];
		process.env[key] = "ready";
		try {
			expect(envGet(key)).toBe("ready");
			delete process.env[key];
			expect(envGet(key)).toBeNull();
		} finally {
			if (original === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = original;
			}
		}
	});

	test("readFile and writeFile round-trip file contents", () => {
		const dir = mkdtempSync(join(tmpdir(), "point-std-fs-"));
		const path = join(dir, "sample.txt");
		try {
			expect(writeFile(path, "hello fs")).toBeUndefined();
			expect(readFile(path)).toBe("hello fs");
			expect(readFile(join(dir, "missing.txt"))).toEqual({ message: expect.any(String) });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	test("time helpers expose now, sleep, and formatTime", async () => {
		const iso = "2026-05-21T12:00:00.000Z";
		expect(now()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(formatTime(iso)).toBe(new Date(iso).toUTCString());
		expect(formatTime("not-a-date")).toBe("not-a-date");
		const start = Date.now();
		await sleep(10);
		expect(Date.now() - start).toBeGreaterThanOrEqual(5);
	});
});
