import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore, emitPointCoreTypeScript, parsePointSource } from "../packages/point/src/core/index.ts";
import {
	anthropicComplete,
	anthropicStream,
	openaiComplete,
	openaiStream,
} from "@hatchingpoint/point/std/ai";

describe("std.ai provider runtime", () => {
	test("openaiComplete and openaiStream call fetch with chat completion payloads", async () => {
		const originalFetch = globalThis.fetch;
		const calls: Array<{ url: string; init?: RequestInit }> = [];
		globalThis.fetch = async (input, init) => {
			const url = String(input);
			calls.push({ url, init });
			if (url === "https://api.openai.com/v1/chat/completions") {
				const body = JSON.parse(String(init?.body)) as { stream?: boolean };
				if (body.stream) {
					return new Response(
						[
							'data: {"choices":[{"delta":{"content":"Hel"}}]}',
							'data: {"choices":[{"delta":{"content":"lo"}}]}',
							"data: [DONE]",
						].join("\n"),
						{ status: 200 },
					);
				}
				return new Response(
					JSON.stringify({ choices: [{ message: { content: "Hello from OpenAI" } }] }),
					{ status: 200 },
				);
			}
			return new Response("missing", { status: 404, statusText: "Not Found" });
		};

		try {
			expect(await openaiComplete("sk-test", "Say hi", "gpt-4o-mini")).toBe("Hello from OpenAI");
			expect(await openaiStream("sk-test", "Say hi", "gpt-4o-mini")).toBe("Hello");

			expect(calls).toHaveLength(2);
			expect(calls[0]?.url).toBe("https://api.openai.com/v1/chat/completions");
			expect(calls[0]?.init?.method).toBe("POST");
			expect(calls[0]?.init?.headers).toMatchObject({
				Authorization: "Bearer sk-test",
				"Content-Type": "application/json",
			});
			expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
				model: "gpt-4o-mini",
				stream: false,
				messages: [{ role: "user", content: "Say hi" }],
			});
			expect(JSON.parse(String(calls[1]?.init?.body)).stream).toBe(true);
			expect(await openaiComplete(null, "Say hi", "gpt-4o-mini")).toEqual({
				message: "Missing OPENAI_API_KEY — set it with std.env before calling provider actions",
			});
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("anthropicComplete and anthropicStream call fetch with messages payloads", async () => {
		const originalFetch = globalThis.fetch;
		const calls: Array<{ url: string; init?: RequestInit }> = [];
		globalThis.fetch = async (input, init) => {
			const url = String(input);
			calls.push({ url, init });
			if (url === "https://api.anthropic.com/v1/messages") {
				const body = JSON.parse(String(init?.body)) as { stream?: boolean };
				if (body.stream) {
					return new Response(
						[
							'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}',
							'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}',
							"data: [DONE]",
						].join("\n"),
						{ status: 200 },
					);
				}
				return new Response(
					JSON.stringify({ content: [{ type: "text", text: "Hello from Anthropic" }] }),
					{ status: 200 },
				);
			}
			return new Response("missing", { status: 404, statusText: "Not Found" });
		};

		try {
			expect(await anthropicComplete("sk-ant-test", "Say hi", "claude-3-5-haiku-20241022")).toBe(
				"Hello from Anthropic",
			);
			expect(await anthropicStream("sk-ant-test", "Say hi", "claude-3-5-haiku-20241022")).toBe("Hello");

			expect(calls).toHaveLength(2);
			expect(calls[0]?.init?.headers).toMatchObject({
				"x-api-key": "sk-ant-test",
				"anthropic-version": "2023-06-01",
				"Content-Type": "application/json",
			});
			expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
				model: "claude-3-5-haiku-20241022",
				stream: false,
				max_tokens: 1024,
				messages: [{ role: "user", content: "Say hi" }],
			});
			expect(await anthropicComplete(undefined, "Say hi", "claude-3-5-haiku-20241022")).toEqual({
				message: "Missing ANTHROPIC_API_KEY — set it with std.env before calling provider actions",
			});
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});

describe("std.ai semantic module", () => {
	test("std/ai.point checks and emits boring provider glue", () => {
		const source = readFileSync(join(import.meta.dir, "../std/ai.point"), "utf8");
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('import { openaiComplete as openaiCompleteRaw } from "@hatchingpoint/point/std/ai"');
		expect(emitted).toContain('import { envGet as envGetRaw } from "@hatchingpoint/point/std/env"');
		expect(emitted).toContain('return openaiCompleteRaw(envGetRaw("OPENAI_API_KEY"), prompt, model)');
		expect(emitted).toContain("export async function completeTextWithOpenaiText");
		expect(emitted).toContain("export async function streamTextWithAnthropicText");
	});
});
