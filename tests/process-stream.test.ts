import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createPointCoreIndex } from "../packages/point/src/core/context.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { processStreamLines } from "@hatchingpoint/point/std/process";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const logViewerSource = "examples/app/log-viewer/log-viewer.point";
const stdProcessSource = "std/process.point";
const generated = join(repoRoot, "generated/log-viewer.js");

function waitForWebSocketMessages(ws: WebSocket, count: number, timeoutMs = 8000): Promise<string[]> {
	return new Promise((resolve, reject) => {
		const messages: string[] = [];
		const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${count} messages`)), timeoutMs);
		ws.onmessage = (event) => {
			messages.push(String(event.data));
			if (messages.length >= count) {
				clearTimeout(timer);
				resolve(messages);
			}
		};
		ws.onerror = () => {
			clearTimeout(timer);
			reject(new Error("WebSocket error"));
		};
	});
}

function waitForWebSocketOpen(ws: WebSocket): Promise<void> {
	return new Promise((resolve, reject) => {
		ws.onopen = () => resolve();
		ws.onerror = () => reject(new Error("WebSocket failed to open"));
	});
}

describe("process stream runtime", () => {
	test("processStreamLines yields stdout lines from echo", async () => {
		const lines: string[] = [];
		for await (const line of processStreamLines(process.execPath, ["-e", "console.log('alpha'); console.log('beta');"], [])) {
			lines.push(line);
		}
		expect(lines).toEqual(["alpha", "beta"]);
	});
});

describe("stream action emit", () => {
	test("emits async generator for yield stream action in log-viewer", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, logViewerSource)).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreJavaScript(program);
		expect(emitted).toContain("async function* tailDemoLogsLine");
		expect(emitted).toContain("yield* streamLinesRaw(");
		expect(emitted).toContain("pointPumpProcessStreamToWebSocket");
		expect(emitted).toContain("POINT_STREAM_BACKPRESSURE_LIMIT = 65536");
	});

	test("emits WebSocket subscribe hook in TypeScript view", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, logViewerSource)).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('new WebSocket(`${protocol}//${window.location.host}/ws/logs`)');
		expect(emitted).toContain("setMessages((previous) => [...previous, parsed])");
		expect(emitted).toContain("logStreamPanelView");
	});

	test("index includes stream action with process effect", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, logViewerSource)).text());
		const index = createPointCoreIndex(program);
		const streamAction = index.refs.find((symbol) => symbol.ref === "point://semantic/LogViewer/action.tail demo logs");
		expect(streamAction).toBeDefined();
		expect(streamAction?.effects).toContain("process");
	});
});

describe("log-viewer WebSocket integration", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let wsUrl = "";

	beforeAll(async () => {
		await Bun.$`bun ${pointCli} check ${logViewerSource}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} build ${logViewerSource} ${generated}`.cwd(repoRoot).quiet();
		const module = await import(generated);
		server = module.startRoutesServer();
		wsUrl = `ws://localhost:${server.port}/ws/logs`;
	});

	afterAll(() => {
		server?.stop(true);
	});

	test("streams subprocess stdout lines to WebSocket clients", async () => {
		if (process.platform === "win32") return;
		const ws = new WebSocket(wsUrl);
		await waitForWebSocketOpen(ws);
		const frames = await waitForWebSocketMessages(ws, 3);
		for (const frame of frames) {
			const parsed = JSON.parse(frame) as { line?: string };
			expect(typeof parsed.line).toBe("string");
			expect(parsed.line).toContain("demo-line-");
		}
		ws.close();
	}, 15000);

	test("emits process stream bridge in generated server", async () => {
		const generatedSource = await Bun.file(generated).text();
		expect(generatedSource).toContain("pointPumpProcessStreamToWebSocket");
		expect(generatedSource).toContain("async function* tailDemoLogsLine");
	});
});
