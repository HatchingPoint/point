import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createPointCoreIndex } from "../packages/point/src/core/context.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/app/sse-dashboard/sse-dashboard.point";
const generated = join(repoRoot, "generated/sse-dashboard.js");

function readSseEvents(body: ReadableStream<Uint8Array>, maxEvents = 3): Promise<string[]> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	const events: string[] = [];
	return (async () => {
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
	})();
}

describe("sse routes", () => {
	test("requires on connect stream from action", () => {
		const program = parsePointSource(`module Broken

record Metric Pulse
  value: Text

sse route pulses
  path "/sse/metrics"
  event Metric Pulse
  on disconnect return none
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-sse-route-handler")).toBe(true);
	});

	test("rejects non-record event types at check time", () => {
		const program = parsePointSource(`module Broken

sse route bad
  path "/sse/bad"
  event Text
  on connect stream from action noop
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-sse-route-event")).toBe(true);
	});

	test("emits SSE response handler integrated with HTTP bootstrap", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, source)).text());
		const emitted = emitPointCoreJavaScript(program);
		expect(emitted).toContain("pointPumpStreamToSseResponse");
		expect(emitted).toContain('url.pathname === "/sse/metrics"');
	});

	test("unknown subscribe to sse reports diagnostic", () => {
		const program = parsePointSource(`module Broken

record Metric Pulse
  value: Text

view feed
  subscribe to sse missing route
  render "x"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-sse-subscribe-route")).toBe(true);
	});

	test("index includes sse route semantic ref with network effects", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, source)).text());
		const index = createPointCoreIndex(program);
		const sseRoute = index.refs.find((symbol) => symbol.ref === "point://semantic/SseDashboard/sseRoute.metric pulses");
		expect(sseRoute).toBeDefined();
		expect(sseRoute?.effects).toEqual(["network"]);
	});
});

describe("sse-dashboard service", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let baseUrl = "";

	beforeAll(async () => {
		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} build ${source} ${generated}`.cwd(repoRoot).quiet();
		const generatedSource = await Bun.file(generated).text();
		expect(generatedSource).toContain("pointPumpStreamToSseResponse");
		const module = await import(generated);
		server = module.startRoutesServer();
		baseUrl = `http://localhost:${server.port}`;
	});

	afterAll(() => {
		server?.stop(true);
	});

	test("GET /sse/metrics streams JSON SSE events", async () => {
		const response = await fetch(`${baseUrl}/sse/metrics`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
		const events = await readSseEvents(response.body!);
		expect(events.length).toBeGreaterThan(0);
		expect(JSON.parse(events[0]!)).toEqual({ value: "pulse-0" });
	});
});
