import { describe, expect, test } from "bun:test";

import { createPointRuntimeFetchHandler, renderPointViewToHtml, startPointRuntimeServer } from "../../packages/point/runtime/index.ts";
import {
	collectRuntimeStreamRoutes,
	parseStreamMessage,
	pumpProcessStreamToWebSocket,
} from "../../packages/point/runtime/stream-routes.ts";
import { interpretCoreStreamActionAsync } from "../../packages/point/runtime/interpreter/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

const terminalProgramSource = `module RuntimeTerminal

external point std process
  stream lines raw(command: Text, args: List<Text>, env: List<Text>): Text from "@hatchingpoint/point/std/process" as processStreamLines

record Script Line
  stream: Text
  text: Text

action run demo shell
  output line: Text
  touches process
  yield stream lines raw("echo", ["alpha"], [])

stream route runner
  path "/ws/runner"
  message Script Line
  on connect stream from action run demo shell
  on disconnect return none

view script terminal panel
  terminal subscribe to stream runner
  when connecting render "Connecting to subprocess stream..."
  when disconnected render "Disconnected"

page home page
  title "Terminal"
  main render script terminal panel()

navigation app
  path "/" page home page
  bootstrap router
`;

const logProgramSource = `module RuntimeLogStream

external point std process
  stream lines raw(command: Text, args: List<Text>, env: List<Text>): Text from "@hatchingpoint/point/std/process" as processStreamLines

record Log Line
  line: Text

action tail demo logs
  output line: Text
  touches process
  yield stream lines raw("echo", ["log-line"], [])

stream route logs
  path "/ws/logs"
  message Log Line
  on connect stream from action tail demo logs
  on disconnect return none

view log stream panel
  subscribe to stream logs
  when connecting render "Connecting to log stream..."
  when disconnected render "Stream disconnected"
  each line in messages render line.line

page log page
  title "Logs"
  main render log stream panel()

navigation app
  path "/" page log page
  bootstrap router
`;

const echoProgramSource = `module RuntimeStreamEcho

record Chat Message
  text: Text

stream route echo
  path "/ws/echo"
  message Chat Message
  on connect return "ready"
  on message message return message
  on disconnect return none
`;

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

function waitForWebSocketMessage(ws: WebSocket): Promise<string> {
	return new Promise((resolve, reject) => {
		ws.onmessage = (event) => resolve(String(event.data));
		ws.onerror = () => reject(new Error("WebSocket error"));
	});
}

function waitForWebSocketOpen(ws: WebSocket): Promise<void> {
	return new Promise((resolve, reject) => {
		ws.onopen = () => resolve();
		ws.onerror = () => reject(new Error("WebSocket failed to open"));
	});
}

describe("runtime stream routes", () => {
	test("parseStreamMessage extracts declared record fields", () => {
		expect(parseStreamMessage(JSON.stringify({ text: "hello", extra: "ignored" }), ["text"])).toEqual({ text: "hello" });
	});

	test("collectRuntimeStreamRoutes resolves handlers and stream actions", () => {
		const program = checkedProgram(echoProgramSource);
		const routes = collectRuntimeStreamRoutes(program);
		expect(routes).toHaveLength(1);
		expect(routes[0]?.path).toBe("/ws/echo");
		expect(routes[0]?.connectHandler).toBeTruthy();
		expect(routes[0]?.messageHandler).toBeTruthy();
	});

	test("startPointRuntimeServer upgrades stream routes and echoes messages", async () => {
		const program = checkedProgram(echoProgramSource);
		const server = startPointRuntimeServer(program);
		try {
			const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws/echo`);
			await waitForWebSocketOpen(ws);
			expect(await waitForWebSocketMessage(ws)).toBe("ready");
			ws.send(JSON.stringify({ text: "hello" }));
			expect(JSON.parse(await waitForWebSocketMessage(ws))).toEqual({ text: "hello" });
			ws.close();
		} finally {
			server.stop(true);
		}
	});

	test("connect stream action pumps process chunks over WebSocket", async () => {
		const program = checkedProgram(terminalProgramSource);
		const route = collectRuntimeStreamRoutes(program)[0];
		expect(route?.connectStreamAction).toBeTruthy();
		const messages: string[] = [];
		const ws = {
			readyState: WebSocket.OPEN,
			bufferedAmount: 0,
			send(value: string) {
				messages.push(value);
			},
		} as unknown as Parameters<typeof pumpProcessStreamToWebSocket>[0];
		const source = await interpretCoreStreamActionAsync(program, route!.connectStreamAction!);
		await pumpProcessStreamToWebSocket(ws, source, route!.messageFields);
		const payloads = messages.map((message) => JSON.parse(message));
		expect(payloads.some((payload) => payload.stream === "stdout" && payload.text === "alpha")).toBe(true);
		expect(payloads.some((payload) => payload.stream === "exit")).toBe(true);
	});

	test("pumpProcessStreamToWebSocket wraps generic line payloads", async () => {
		const messages: string[] = [];
		const ws = {
			readyState: WebSocket.OPEN,
			bufferedAmount: 0,
			send(value: string) {
				messages.push(value);
			},
		 } as unknown as Parameters<typeof pumpProcessStreamToWebSocket>[0];
		async function* lines() {
			yield "one";
			yield "two";
		}
		await pumpProcessStreamToWebSocket(ws, lines(), ["line"]);
		expect(messages.map((message) => JSON.parse(message))).toEqual([{ line: "one" }, { line: "two" }]);
	});
});

describe("runtime SSR websocket subscribe", () => {
	test("terminal subscribe renders terminal shell and client script", async () => {
		const program = checkedProgram(terminalProgramSource);
		const html = renderPointViewToHtml(program, "script terminal panel");
		expect(html).toContain("point-ws-subscribe");
		expect(html).toContain("point-terminal");
		expect(html).toContain("/ws/runner");
		expect(html).toContain("Connecting to subprocess stream");

		const handler = createPointRuntimeFetchHandler(program);
		const page = await handler(new Request("http://point.test/"));
		const pageHtml = await page.text();
		expect(pageHtml).toContain("data-point-ws-subscribe");
		expect(pageHtml).toContain("new WebSocket");
		expect(pageHtml).toContain("point-terminal-line");
	});

	test("subscribe to stream renders list shell for each messages", () => {
		const program = checkedProgram(logProgramSource);
		const html = renderPointViewToHtml(program, "log stream panel");
		expect(html).toContain("data-point-ws-messages");
		expect(html).toContain("/ws/logs");
		expect(html).toContain("Connecting to log stream");
	});
});
