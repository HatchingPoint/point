import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { formatSemanticProgram } from "../packages/point/src/semantic/format.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

const repoRoot = join(import.meta.dir, "..");
const terminalExamplePath = join(repoRoot, "examples/app/script-runner/script-runner.point");

const wsProcessStub = `
external point std process
  stream lines raw(command: Text, args: List<Text>, env: List<Text>): Text from "@hatchingpoint/point/std/process" as processStreamLines
`;

const tailAction = `
action stub tail
  output line: Text
  touches process
  yield stream lines raw("sh", ["-c", "echo x"], [])
`;

describe("terminal subscribe view", () => {
	test("parses terminal subscribe route and path forms", () => {
		const byRoute = parsePointSource(`${wsProcessStub}
record Log Line
  line: Text
${tailAction}
stream route svc
  path "/ws/a"
  message Log Line
  on connect stream from action stub tail
  on disconnect return none

view panel
  terminal subscribe to stream svc
`);
		const view = byRoute.semanticSource?.declarations.find((d) => d.kind === "view")!;
		const terminalSt = view.body.find((s) => s.kind === "terminal")!;
		expect(terminalSt.routeName).toBe("svc");

		const byPath = parsePointSource(`${wsProcessStub}
record Log Line
  line: Text
${tailAction}
stream route svc
  path "/ws/custom"
  message Log Line
  on connect stream from action stub tail
  on disconnect return none

view panel
  terminal subscribe to "/ws/custom"
`);
		const tp = byPath.semanticSource?.declarations.find((d) => d.kind === "view")!.body[0]!;
		expect(tp.kind).toBe("terminal");
		expect((tp as { path?: string }).path).toBe("/ws/custom");
	});

	test("formats terminal subscribe round-trip", () => {
		const program = parsePointSource(`${wsProcessStub}
record Log Line
  line: Text
${tailAction}
stream route svc
  path "/ws/a"
  message Log Line
  on connect stream from action stub tail
  on disconnect return none

view demo
  terminal subscribe to stream svc
`);
		expect(formatSemanticProgram(program.semanticSource!)).toContain("terminal subscribe to stream svc");
	});

	test("rejects combining terminal subscribe with subscribe to …", () => {
		const program = parsePointSource(`${wsProcessStub}
record Log Line
  line: Text
${tailAction}
stream route logs
  path "/ws/logs"
  message Log Line
  on connect stream from action stub tail
  on disconnect return none

view bad
  terminal subscribe to stream logs
  subscribe to stream logs
`);
		expect(checkPointCore(program).some((diagnostic) => diagnostic.code === "terminal-stream-subscribe-conflict")).toBe(true);
	});

	test("emits terminal WebSocket view and chunk pump runtime", async () => {
		const program = parsePointSource(await Bun.file(terminalExamplePath).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("point-terminal");
		expect(emitted).toContain("/ws/script-runner");
		expect(emitted).toContain("pointPumpProcessStreamToWebSocket");
		expect(emitted).toContain('stream: "stderr"');
		expect(emitted).toContain("scriptTerminalPanelView");
		expect(emitted).toContain('<pre className="point-terminal"');
	});

	test("indexes stream subscribe refs for terminal form", async () => {
		const program = parsePointSource(await Bun.file(terminalExamplePath).text());
		expect(checkPointCore(program)).toEqual([]);
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(
			`point://semantic/${moduleName}/view.script terminal panel.subscribe.stream runner`,
		);
		const explanation = explainSemanticRef(
			semantic,
			`point://semantic/${moduleName}/view.script terminal panel.subscribe.stream runner`,
		);
		expect(explanation.found).toBe(true);
		expect(explanation.summary).toContain("subscribes");
	});
});
