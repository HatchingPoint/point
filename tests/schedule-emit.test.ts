import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";
import { scheduleIntervalMs } from "../packages/point/src/core/emit-schedules.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const exampleSource = "examples/tools/health-check-schedule.point";

describe("schedule emit", () => {
	test("rejects unknown schedule actions", () => {
		const program = parsePointSource(`module Broken

schedule missing action tick
  every 1 minutes
  call missing action
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-schedule-action")).toBe(true);
		expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-schedule-action")?.ref).toBe(
			"point://semantic/Broken/schedule.missing action tick",
		);
	});

	test("rejects scheduled actions that require inputs", () => {
		const program = parsePointSource(`module Broken

action greet user
  input name: Text
  output message: Text
  touches none
  return name

schedule greet tick
  every 1 minutes
  call greet user
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "schedule-action-needs-inputs")).toBe(true);
	});

	test("parses inline schedule every syntax", () => {
		const program = parsePointSource(`module Inline

action ping
  output value: Text
  touches none
  return "ok"

schedule every 30 seconds call ping
`);
		const schedule = program.semanticSource?.declarations.find((declaration) => declaration.kind === "schedule");
		expect(schedule).toMatchObject({
			kind: "schedule",
			name: "ping tick",
			actionName: "ping",
			interval: { amount: 30, unit: "seconds" },
		});
	});

	test("emits setInterval wrapper and run command for dev", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, exampleSource)).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreJavaScript(program);
		expect(emitted).toContain("export function startPointSchedules()");
		expect(emitted).toContain("setInterval");
		expect(emitted).toContain("healthCheck");
		expect(emitted).toContain("300000");
		expect(emitted).toContain("export async function runSchedulesCommand()");
		expect(emitted).toContain("startPointSchedules();");
	});

	test("converts schedule intervals to milliseconds", () => {
		expect(scheduleIntervalMs(5, "minutes")).toBe(300_000);
		expect(scheduleIntervalMs(30, "seconds")).toBe(30_000);
		expect(scheduleIntervalMs(2, "hours")).toBe(7_200_000);
	});

	test("indexes schedule semantic refs", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, exampleSource)).text());
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/schedule.health check tick`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/schedule.health check tick.call.health check`);
		const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/schedule.health check tick`);
		expect(explanation.found).toBe(true);
		expect(explanation.relatedRefs).toContain(`point://semantic/${moduleName}/schedule.health check tick.call.health check`);
	});
});
