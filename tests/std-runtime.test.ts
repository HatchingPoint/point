import { describe, expect, test } from "bun:test";
import { httpGet, httpPost } from "@hatchingpoint/point/std/http";
import { jsonParse, jsonStringify } from "@hatchingpoint/point/std/json";

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
});
