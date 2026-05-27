export type PointRuntimeAiError = { message: string };

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 1024;

function missingApiKey(name: string): PointRuntimeAiError {
	return { message: `Missing ${name} - set it with std.env before calling provider actions` };
}

function normalizeApiKey(apiKey: string | null | undefined): string | PointRuntimeAiError {
	if (apiKey == null || apiKey.trim() === "") return { message: "Missing API key" };
	return apiKey.trim();
}

async function readResponseText(response: Response): Promise<string | PointRuntimeAiError> {
	if (!response.ok) {
		const detail = await response.text();
		const suffix = detail.trim() ? `: ${detail.trim()}` : "";
		return { message: `HTTP ${response.status}: ${response.statusText}${suffix}` };
	}
	return response.text();
}

function buildOpenaiChatBody(prompt: string, model: string, stream: boolean): string {
	return JSON.stringify({
		model,
		stream,
		messages: [{ role: "user", content: prompt }],
	});
}

function buildAnthropicMessageBody(prompt: string, model: string, stream: boolean): string {
	return JSON.stringify({
		model,
		stream,
		max_tokens: DEFAULT_MAX_TOKENS,
		messages: [{ role: "user", content: prompt }],
	});
}

function extractOpenaiCompletion(response: string): string | PointRuntimeAiError {
	try {
		const parsed = JSON.parse(response) as { choices?: Array<{ message?: { content?: string | null } }> };
		const content = parsed.choices?.[0]?.message?.content;
		if (typeof content !== "string") return { message: "OpenAI response missing message content" };
		return content;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

function extractAnthropicCompletion(response: string): string | PointRuntimeAiError {
	try {
		const parsed = JSON.parse(response) as { content?: Array<{ type?: string; text?: string }> };
		const text = parsed.content?.find((block) => block.type === "text")?.text;
		if (typeof text !== "string") return { message: "Anthropic response missing text content" };
		return text;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

function extractOpenaiStreamText(response: string): string | PointRuntimeAiError {
	const chunks: string[] = [];
	for (const line of response.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("data:")) continue;
		const payload = trimmed.slice("data:".length).trim();
		if (!payload || payload === "[DONE]") continue;
		try {
			const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string | null } }> };
			const delta = parsed.choices?.[0]?.delta?.content;
			if (typeof delta === "string" && delta.length > 0) chunks.push(delta);
		} catch {
			return { message: "Invalid OpenAI stream chunk" };
		}
	}
	if (chunks.length === 0) return { message: "OpenAI stream returned no text deltas" };
	return chunks.join("");
}

function extractAnthropicStreamText(response: string): string | PointRuntimeAiError {
	const chunks: string[] = [];
	for (const line of response.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("data:")) continue;
		const payload = trimmed.slice("data:".length).trim();
		if (!payload || payload === "[DONE]") continue;
		try {
			const parsed = JSON.parse(payload) as { type?: string; delta?: { type?: string; text?: string } };
			if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
				const delta = parsed.delta.text;
				if (typeof delta === "string" && delta.length > 0) chunks.push(delta);
			}
		} catch {
			return { message: "Invalid Anthropic stream chunk" };
		}
	}
	if (chunks.length === 0) return { message: "Anthropic stream returned no text deltas" };
	return chunks.join("");
}

async function postProviderRequest(url: string, headers: Record<string, string>, body: string): Promise<string | PointRuntimeAiError> {
	try {
		return await readResponseText(
			await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...headers,
				},
				body,
			}),
		);
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export async function openaiComplete(apiKey: string | null | undefined, prompt: string, model: string): Promise<string | PointRuntimeAiError> {
	const normalized = normalizeApiKey(apiKey);
	if (typeof normalized !== "string") return missingApiKey("OPENAI_API_KEY");
	const response = await postProviderRequest(
		OPENAI_CHAT_URL,
		{ Authorization: `Bearer ${normalized}` },
		buildOpenaiChatBody(prompt, model, false),
	);
	if (typeof response !== "string") return response;
	return extractOpenaiCompletion(response);
}

export async function openaiStream(apiKey: string | null | undefined, prompt: string, model: string): Promise<string | PointRuntimeAiError> {
	const normalized = normalizeApiKey(apiKey);
	if (typeof normalized !== "string") return missingApiKey("OPENAI_API_KEY");
	const response = await postProviderRequest(
		OPENAI_CHAT_URL,
		{ Authorization: `Bearer ${normalized}` },
		buildOpenaiChatBody(prompt, model, true),
	);
	if (typeof response !== "string") return response;
	return extractOpenaiStreamText(response);
}

export async function anthropicComplete(apiKey: string | null | undefined, prompt: string, model: string): Promise<string | PointRuntimeAiError> {
	const normalized = normalizeApiKey(apiKey);
	if (typeof normalized !== "string") return missingApiKey("ANTHROPIC_API_KEY");
	const response = await postProviderRequest(
		ANTHROPIC_MESSAGES_URL,
		{
			"x-api-key": normalized,
			"anthropic-version": ANTHROPIC_VERSION,
		},
		buildAnthropicMessageBody(prompt, model, false),
	);
	if (typeof response !== "string") return response;
	return extractAnthropicCompletion(response);
}

export async function anthropicStream(apiKey: string | null | undefined, prompt: string, model: string): Promise<string | PointRuntimeAiError> {
	const normalized = normalizeApiKey(apiKey);
	if (typeof normalized !== "string") return missingApiKey("ANTHROPIC_API_KEY");
	const response = await postProviderRequest(
		ANTHROPIC_MESSAGES_URL,
		{
			"x-api-key": normalized,
			"anthropic-version": ANTHROPIC_VERSION,
		},
		buildAnthropicMessageBody(prompt, model, true),
	);
	if (typeof response !== "string") return response;
	return extractAnthropicStreamText(response);
}
