import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createPointCoreIndex } from "../packages/point/src/core/context.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/api/stream-echo.point";
const generated = join(repoRoot, "generated/stream-echo.js");

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

describe("stream routes", () => {
	test("rejects non-record message types at check time", () => {
		const program = parsePointSource(`module Broken

stream route bad
  path "/ws"
  message Text
  on message message return "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-stream-route-message")).toBe(true);
	});

	test("requires on message handler", () => {
		const program = parsePointSource(`module Broken

record Chat Message
  text: Text

stream route chat
  path "/ws"
  message Chat Message
  on connect return "ready"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-stream-route-handler")).toBe(true);
	});

	test("emits Bun WebSocket handlers integrated with HTTP bootstrap", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, source)).text());
		const emitted = emitPointCoreJavaScript(program);
		expect(emitted).toContain("createPointRouteWebSocketHandlers");
		expect(emitted).toContain('url.pathname === "/ws"');
		expect(emitted).toContain("echoStreamRouteConnect");
		expect(emitted).toContain("echoStreamRouteMessage");
		expect(emitted).toContain("echoStreamRouteDisconnect");
	});

	test("check-json surfaces stream route diagnostics with semantic refs", async () => {
		const program = parsePointSource(`module Broken

stream route bad
  path "/ws"
  message Text
  on message message return "ok"
`);
		const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
		const diagnostic = diagnostics.find((candidate) => candidate.code === "invalid-stream-route-message");
		expect(diagnostic?.ref).toBe("point://semantic/Broken/streamRoute.bad");
		expect(diagnostic?.repair).toContain("record type");
	});

	test("index includes stream route semantic ref with network effects", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, source)).text());
		const index = createPointCoreIndex(program);
		const streamRoute = index.refs.find((symbol) => symbol.ref === "point://semantic/StreamEcho/streamRoute.echo");
		expect(streamRoute).toBeDefined();
		expect(streamRoute?.effects).toEqual(["network"]);
	});
});

describe("stream-echo WebSocket service", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let wsUrl = "";

	beforeAll(async () => {
		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} build ${source} ${generated}`.cwd(repoRoot).quiet();
		const generatedSource = await Bun.file(generated).text();
		expect(generatedSource).toContain("createPointRouteWebSocketHandlers");
		const module = await import(generated);
		server = module.startRoutesServer();
		wsUrl = `ws://localhost:${server.port}/ws`;
	});

	afterAll(() => {
		server?.stop(true);
	});

	test("connect handler sends ready payload", async () => {
		const ws = new WebSocket(wsUrl);
		await waitForWebSocketOpen(ws);
		expect(await waitForWebSocketMessage(ws)).toBe("ready");
		ws.close();
	});

	test("message handler echoes typed JSON records", async () => {
		const ws = new WebSocket(wsUrl);
		await waitForWebSocketOpen(ws);
		await waitForWebSocketMessage(ws);
		ws.send(JSON.stringify({ text: "hello" }));
		expect(JSON.parse(await waitForWebSocketMessage(ws))).toEqual({ text: "hello" });
		ws.close();
	});
});
