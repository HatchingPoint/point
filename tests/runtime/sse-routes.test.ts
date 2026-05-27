import { describe, expect, test } from "bun:test";

import { createPointRuntimeFetchHandler, renderPointViewToHtml, startPointRuntimeServer } from "../../packages/point/runtime/index.ts";
import { collectRuntimeSseRoutes, pumpStreamToSseResponse, wrapStreamLine } from "../../packages/point/runtime/sse-routes.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

const sseProgramSource = `module SsrSse

external point std process
  stream lines raw(command: Text, args: List<Text>, env: List<Text>): Text from "@hatchingpoint/point/std/process" as processStreamLines

record Metric Pulse
  value: Text

action stream metric pulses
  output line: Text
  touches process
  yield stream lines raw("echo", ["one"], [])

sse route metric pulses
  path "/sse/metrics"
  event Metric Pulse
  on connect stream from action stream metric pulses
  on disconnect return none

view live pulse feed
  subscribe to sse metric pulses
  when connecting render "Connecting"
  when disconnected render "Feed ended"
  each pulse in messages render pulse.value

page home page
  title "Live"
  main render live pulse feed()

navigation app
  path "/" page home page
  bootstrap router
`;

function checkedProgram(source: string = sseProgramSource) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

async function readSseEvents(body: ReadableStream<Uint8Array>, maxEvents = 2): Promise<string[]> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	const events: string[] = [];
	while (events.length < maxEvents) {
		const chunk = await reader.read();
		if (chunk.done) break;
		buffer += decoder.decode(chunk.value, { stream: true });
		const parts = buffer.split("\n\n");
		buffer = parts.pop() ?? "";
		for (const part of parts) {
			const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
			if (dataLine) events.push(dataLine.slice("data: ".length));
			if (events.length >= maxEvents) break;
		}
	}
	reader.cancel();
	return events;
}

describe("runtime SSE routes", () => {
	test("wrapStreamLine maps single-field events", () => {
		expect(wrapStreamLine("pulse-0", ["value"])).toEqual({ value: "pulse-0" });
	});

	test("collectRuntimeSseRoutes resolves connect stream actions", () => {
		const program = checkedProgram();
		const routes = collectRuntimeSseRoutes(program);
		expect(routes).toHaveLength(1);
		expect(routes[0]?.path).toBe("/sse/metrics");
		expect(routes[0]?.connectStreamAction).toBeTruthy();
	});

	test("GET sse path streams JSON events", async () => {
		const program = checkedProgram();
		const server = startPointRuntimeServer(program);
		try {
			const response = await fetch(`http://127.0.0.1:${server.port}/sse/metrics`);
			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toContain("text/event-stream");
			const events = await readSseEvents(response.body!);
			expect(events.length).toBeGreaterThan(0);
			expect(JSON.parse(events[0]!)).toEqual({ value: "one" });
		} finally {
			server.stop(true);
		}
	});

	test("pumpStreamToSseResponse encodes async line sources", async () => {
		async function* lines() {
			yield "alpha";
			yield "beta";
		}
		const response = await pumpStreamToSseResponse(lines(), ["value"]);
		const events = await readSseEvents(response.body!);
		expect(events.map((event) => JSON.parse(event))).toEqual([{ value: "alpha" }, { value: "beta" }]);
	});
});

describe("runtime SSR subscribe to sse", () => {
	test("renders sse subscribe shell with client script on pages", async () => {
		const program = checkedProgram();
		const html = renderPointViewToHtml(program, "live pulse feed");
		expect(html).toContain("point-sse-subscribe");
		expect(html).toContain("data-point-sse-subscribe");
		expect(html).toContain("/sse/metrics");
		expect(html).toContain("Connecting");

		const handler = createPointRuntimeFetchHandler(program);
		const page = await handler(new Request("http://point.test/"));
		const pageHtml = await page.text();
		expect(pageHtml).toContain("data-point-sse-subscribe");
		expect(pageHtml).toContain("new EventSource");
	});
});
