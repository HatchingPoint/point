import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef, mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

const repoRoot = join(import.meta.dir, "..");
const logViewerSource = join(repoRoot, "examples/app/log-viewer/log-viewer.point");

describe("stream subscribe in views", () => {
	test("rejects unknown stream route subscriptions", () => {
		const program = parsePointSource(`module Broken

view log stream
  subscribe to stream missing
  render "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-stream-subscribe-route")).toBe(true);
	});

	test("rejects unknown path subscriptions", () => {
		const program = parsePointSource(`module Broken

stream route logs
  path "/ws/logs"
  message Log Line
  on message message return { text: message.text }

record Log Line
  text: Text

view log stream
  subscribe to "/missing"
  render "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-stream-subscribe-path")).toBe(true);
	});

	test("requires handler input for on message call", () => {
		const program = parsePointSource(`module Broken

record Log Line
  text: Text

stream route logs
  path "/ws/logs"
  message Log Line
  on message message return { text: message.text }

view log stream
  subscribe to stream logs
  on message call on log line
  render "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-stream-message-handler")).toBe(true);
	});

	test("emits React WebSocket hook with cleanup for view subscribe", async () => {
		const program = parsePointSource(await Bun.file(logViewerSource).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('import * as React from "react";');
		expect(emitted).toContain("const [messages, setMessages] = React.useState<LogLine[]>([]);");
		expect(emitted).toContain("const ws = new WebSocket(");
		expect(emitted).toContain("/ws/logs");
		expect(emitted).toContain("return () => { ws.close(); };");
		expect(emitted).toContain("if (connecting) {");
		expect(emitted).toContain("return <>Connecting to log stream...</>;");
		expect(emitted).toContain("if (!connected && !connecting) {");
		expect(emitted).toContain("return <>Stream disconnected</>;");
		expect(emitted).toContain("onLogLine(parsed);");
		expect(emitted).toContain("logStreamPanelView");
	});

	test("indexes stream subscribe refs and explain coverage", async () => {
		const program = parsePointSource(await Bun.file(logViewerSource).text());
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/view.log stream panel.subscribe.stream logs`);
		const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/view.log stream panel.subscribe.stream logs`);
		expect(explanation.found).toBe(true);
		expect(explanation.summary).toContain("subscribes to stream channel");
	});

	test("check-json surfaces subscribe diagnostics with repair hints", () => {
		const broken = parsePointSource(`module Broken

view log stream
  subscribe to stream missing
  render "ok"
`);
		const diagnostics = mapPublicDiagnostics(broken, checkPointCore(broken));
		const diagnostic = diagnostics.find((entry) => entry.code === "unknown-stream-subscribe-route");
		expect(diagnostic?.repair).toContain("missing");
		expect(diagnostic?.ref).toBe("point://semantic/Broken/view.log stream");
	});
});
