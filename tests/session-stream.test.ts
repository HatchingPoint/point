import { expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { checkPointCore, emitPointCoreTypeScript, parsePointSource } from "../packages/point/src/core/index.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

const repoRoot = join(import.meta.dir, "..");
const exampleSource = "examples/agents/support-chat.point";

test("session parses message record, messages list, and stream binding", () => {
	const program = parsePointSource(`module SessionParse

variant Message Role
  Pending
  User
  Assistant

record Chat Message
  role: Message Role
  content: Text

action mock summarize
  input prompt: Text
  input model: Text
  output text: Text or Error
  touches none
  return "Echo: " + prompt

session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action mock summarize
`);

	const session = program.semanticSource?.declarations.find((declaration) => declaration.kind === "session");
	expect(session).toMatchObject({
		kind: "session",
		name: "support chat",
		messageRecordName: "Chat Message",
		streamActionName: "mock summarize",
	});
});

test("session check rejects unknown stream action and message record", () => {
	const missingAction = parsePointSource(`module BrokenSession

record Chat Message
  role: Text
  content: Text

session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action missing action
`);
	expect(checkPointCore(missingAction).some((diagnostic) => diagnostic.code === "unknown-session-stream-action")).toBe(true);

	const missingRecord = parsePointSource(`module BrokenRecord

action mock summarize
  input prompt: Text
  output text: Text or Error
  touches none
  return prompt

session support chat
  message Missing Message
  messages messages: List<Missing Message>
  stream response from action mock summarize
`);
	expect(checkPointCore(missingRecord).some((diagnostic) => diagnostic.code === "unknown-session-message-record")).toBe(true);
});

test("session emits state machine and stream iterator", () => {
	const program = parsePointSource(`module SessionEmit

variant Message Role
  Pending
  User
  Assistant

record Chat Message
  role: Message Role
  content: Text

action mock summarize
  input prompt: Text
  input model: Text
  output text: Text or Error
  touches none
  return "Echo: " + prompt

session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action mock summarize
`);

	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("export type supportChatSessionEvent");
	expect(emitted).toContain('phase: "chunk"');
	expect(emitted).toContain("point.session.event.v1");
	expect(emitted).toContain("export type supportChatSessionState");
	expect(emitted).toContain("export function supportChatSessionCreate");
	expect(emitted).toContain("export function supportChatSessionAddUserMessage");
	expect(emitted).toContain("export async function* supportChatSessionStreamResponse");
	expect(emitted).toContain('{ role: { kind: "User" }, content }');
	expect(emitted).toContain('{ role: { kind: "Pending" }, content: "" }');
	expect(emitted).toContain("await mockSummarizeText(prompt, model)");
});

test("session stream iterator runs with mock provider action", async () => {
	const program = parsePointSource(`module SessionRuntime

variant Message Role
  Pending
  User
  Assistant

record Chat Message
  role: Message Role
  content: Text

action mock summarize
  input prompt: Text
  input model: Text
  output text: Text or Error
  touches none
  return "Echo: " + prompt

session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action mock summarize
`);

	const emitted = emitPointCoreTypeScript(program);
	const events: Array<Record<string, unknown>> = [];
	const tmpDir = join(import.meta.dir, "tmp");
	await mkdir(tmpDir, { recursive: true });
	const modulePath = join(tmpDir, `session-runtime-${Date.now()}.ts`);
	await Bun.write(modulePath, emitted);
	const mod = await import(modulePath);

	let state = mod.supportChatSessionCreate();
	state = mod.supportChatSessionAddUserMessage(state, "Hello");
	const iterator = mod.supportChatSessionStreamResponse(state, "user question", "mock-model", (event: Record<string, unknown>) => {
		events.push(event);
	});

	let result = await iterator.next();
	while (!result.done) {
		result = await iterator.next();
	}
	const finalState = result.value;

	expect(events[0]).toMatchObject({
		schemaVersion: "point.session.event.v1",
		session: "support chat",
		phase: "start",
	});
	expect(events.some((event) => event.phase === "chunk" && event.delta === "Echo:")).toBe(true);
	expect(events.some((event) => event.phase === "complete")).toBe(true);
	const lastMessage = finalState.messages[finalState.messages.length - 1];
	expect(lastMessage).toMatchObject({ role: { kind: "Assistant" }, content: "Echo: user question" });
	expect(mod.pointSessionEventJson(events[0])).toBe(JSON.stringify(events[0]));
});

test("validates support-chat example", async () => {
	const program = parsePointSource(await Bun.file(join(repoRoot, exampleSource)).text());
	expect(checkPointCore(program)).toEqual([]);
});

test("indexes session semantic refs", async () => {
	const program = parsePointSource(await Bun.file(join(repoRoot, exampleSource)).text());
	const semantic = program.semanticSource!;
	const moduleName = semantic.module ?? "anonymous";
	const index = createSemanticIndex(semantic);
	expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/session.support chat`);
	expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/session.support chat.stream.summarize support`);
	const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/session.support chat`);
	expect(explanation.found).toBe(true);
	expect(explanation.relatedRefs).toContain(`point://semantic/${moduleName}/session.support chat.stream.summarize support`);
});

test("session stream action can use mocked fetch provider", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () =>
		new Response(
			[
				'data: {"choices":[{"delta":{"content":"Support"}}]}',
				'data: {"choices":[{"delta":{"content":" reply"}}]}',
				"data: [DONE]",
			].join("\n"),
			{ status: 200 },
		);

	try {
		const program = parsePointSource(`module ProviderSession

external point std ai
  openai stream raw(key: Maybe<Text>, prompt: Text, model: Text): Text or Error from "@hatchingpoint/point/std/ai" as openaiStream

variant Message Role
  Pending
  User
  Assistant

record Chat Message
  role: Message Role
  content: Text

action summarize with openai
  input prompt: Text
  input model: Text
  output text: Text or Error
  touches network
  return openai stream raw("sk-test", prompt, model)

session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action summarize with openai
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		const tmpDir = join(import.meta.dir, "tmp");
		await mkdir(tmpDir, { recursive: true });
		const modulePath = join(tmpDir, `session-provider-${Date.now()}.ts`);
		await Bun.write(modulePath, emitted);
		const mod = await import(modulePath);
		let state = mod.supportChatSessionCreate();
		state = mod.supportChatSessionAddUserMessage(state, "Need help");
		const events: Array<Record<string, unknown>> = [];
		const iterator = mod.supportChatSessionStreamResponse(state, "Need help", "gpt-4o-mini", (event: Record<string, unknown>) => {
			events.push(event);
		});
		let result = await iterator.next();
		while (!result.done) {
			result = await iterator.next();
		}
		expect(events.some((event) => event.phase === "chunk")).toBe(true);
		expect(result.value.messages.at(-1)?.content).toBe("Support reply");
	} finally {
		globalThis.fetch = originalFetch;
	}
});
