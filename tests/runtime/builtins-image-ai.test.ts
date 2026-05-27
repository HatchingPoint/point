import { describe, expect, test } from "bun:test";

import {
	anthropicComplete,
	anthropicStream,
	dispatchRuntimeStdCall,
	imageMetadata,
	imageResize,
	openaiComplete,
	openaiStream,
	resolveRuntimeStdBuiltin,
	runtimeStdDispatch,
} from "../../packages/point/runtime/index.ts";

function withFetchStub<T>(handler: typeof fetch, run: () => T | Promise<T>): Promise<T> {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = handler;
	return Promise.resolve(run()).finally(() => {
		globalThis.fetch = originalFetch;
	});
}

describe("runtime image and ai builtins", () => {
	test("image helpers mirror std.image error behavior and dispatch surface", async () => {
		const metadata = await imageMetadata("__missing_runtime_image__.png");
		expect(metadata).toEqual({ message: expect.any(String) });
		const resized = await imageResize("__missing_runtime_image__.png", 32, 32, "png");
		expect(resized).toEqual({ message: expect.any(String) });

		expect(Object.keys(runtimeStdDispatch["std.image"]).sort()).toEqual(["imageMetadata", "imageResize"]);
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/image", "imageMetadata")).toBe(imageMetadata);
		expect(await dispatchRuntimeStdCall("imageMetadata", ["__missing_runtime_image__.png"])).toEqual({ message: expect.any(String) });
	});

	test("ai helpers parse OpenAI and Anthropic completion and stream responses", async () => {
		await withFetchStub(
			async (input, init) => {
				const url = String(input);
				const headers = new Headers(init?.headers);
				const body = JSON.parse(String(init?.body ?? "{}")) as { stream?: boolean };
				if (url.includes("openai.com")) {
					expect(headers.get("authorization")).toBe("Bearer openai-key");
					if (body.stream) {
						return new Response('data: {"choices":[{"delta":{"content":"hel"}}]}\n\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n');
					}
					return new Response(JSON.stringify({ choices: [{ message: { content: "openai completion" } }] }));
				}
				expect(headers.get("x-api-key")).toBe("anthropic-key");
				expect(headers.get("anthropic-version")).toBe("2023-06-01");
				if (body.stream) {
					return new Response('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ant"}}\n\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hropic"}}\n');
				}
				return new Response(JSON.stringify({ content: [{ type: "text", text: "anthropic completion" }] }));
			},
			async () => {
				expect(await openaiComplete("openai-key", "prompt", "gpt-test")).toBe("openai completion");
				expect(await openaiStream("openai-key", "prompt", "gpt-test")).toBe("hello");
				expect(await anthropicComplete("anthropic-key", "prompt", "claude-test")).toBe("anthropic completion");
				expect(await anthropicStream("anthropic-key", "prompt", "claude-test")).toBe("anthropic");
			},
		);
	});

	test("ai helpers return provider errors and dispatch raw imports", async () => {
		expect(await openaiComplete(null, "prompt", "gpt-test")).toEqual({
			message: "Missing OPENAI_API_KEY - set it with std.env before calling provider actions",
		});
		expect(await anthropicComplete("", "prompt", "claude-test")).toEqual({
			message: "Missing ANTHROPIC_API_KEY - set it with std.env before calling provider actions",
		});

		expect(Object.keys(runtimeStdDispatch["std.ai"]).sort()).toEqual([
			"anthropicComplete",
			"anthropicStream",
			"openaiComplete",
			"openaiStream",
		]);
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/ai", "openaiComplete")).toBe(openaiComplete);

		await withFetchStub(
			async () => new Response(JSON.stringify({ choices: [{ message: { content: "dispatched" } }] })),
			async () => {
				expect(await dispatchRuntimeStdCall("openaiComplete", ["key", "prompt", "model"])).toBe("dispatched");
			},
		);
	});
});
