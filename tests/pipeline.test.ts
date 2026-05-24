import { expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { checkPointCore, emitPointCoreTypeScript, parsePointSource } from "../packages/point/src/core/index.ts";
import { createSemanticIndex, mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

test("pipeline steps lower to async orchestrator with typed events", () => {
	const program = parsePointSource(`module IngestDemo

action fetch doc
  input url: Text
  output body: Text
  touches network
  return url

action parse doc
  input body: Text
  output parsed: Text
  touches none
  return body

pipeline document ingest
  input url: Text
  output result: Text
  step fetched is await fetch doc(url)
  step parsed is await parse doc(fetched)
  return parsed
`);

	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("export type documentIngestPipelineEvent");
	expect(emitted).toContain('phase: "start"');
	expect(emitted).toContain("pointPipelineEventJson");
	expect(emitted).toContain("pointPipelineNow");
	expect(emitted).toContain("async function documentIngestPipeline");
	expect(emitted).toContain("__pointPipelineLog?: PointPipelineLog");
	expect(emitted).toContain('schemaVersion: "point.pipeline.event.v1"');
});

test("pipeline reuses workflow step modifiers", () => {
	const program = parsePointSource(`module RetryPipeline

policy allowed url
  input url: Text
  require url != ""

action always fail
  input url: Text
  output result: Text or Error
  touches none
  return Error "temporary failure"

pipeline ingest retry
  input url: Text
  output result: Text or Error
  step fetched is await always fail(url)
    retry 3 times
    timeout after 2 seconds
    require policy allowed url
    on failure return Error "Pipeline retries exhausted"
  return fetched
`);

	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("for (const __pointAttempt of [0, 1, 2])");
	expect(emitted).toContain("pointWorkflowTimedStep");
	expect(emitted).toContain("allowedUrlPolicy");
});

test("pipeline emits step events at runtime", async () => {
	const program = parsePointSource(`module RuntimePipeline

action fetch doc
  input url: Text
  output body: Text
  touches network
  return url

action parse doc
  input body: Text
  output parsed: Text
  touches none
  return body

pipeline document ingest
  input url: Text
  output result: Text
  step fetched is await fetch doc(url)
  step parsed is await parse doc(fetched)
  return parsed
`);

	const emitted = emitPointCoreTypeScript(program);
	const events: Array<Record<string, unknown>> = [];
	const tmpDir = join(import.meta.dir, "tmp");
	await mkdir(tmpDir, { recursive: true });
	const modulePath = join(tmpDir, `pipeline-runtime-${Date.now()}.ts`);
	await Bun.write(modulePath, emitted);
	const mod = await import(modulePath);
	const result = await mod.documentIngestPipeline("https://example.com/doc", (event: Record<string, unknown>) => {
		events.push(event);
	});
	expect(result).toBe("https://example.com/doc");
	expect(events.length).toBeGreaterThanOrEqual(4);
	expect(events[0]).toMatchObject({
		schemaVersion: "point.pipeline.event.v1",
		pipeline: "document ingest",
		step: "fetched",
		phase: "start",
	});
	expect(events.some((event) => event.phase === "complete" && event.step === "parsed")).toBe(true);
	expect(mod.pointPipelineEventJson(events[0])).toBe(JSON.stringify(events[0]));
});

test("check-json reports unknown policy on pipeline steps", () => {
	const program = parsePointSource(`module BrokenPipeline

pipeline bad ingest
  input url: Text
  output result: Text or Error
  step fetched is await fetch doc(url)
    require policy missing policy
  return fetched

action fetch doc
  input url: Text
  output body: Text or Error
  touches none
  return url
`);

	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-policy")).toBe(true);
	expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-policy")?.ref).toContain(
		"pipeline.bad ingest.step.fetched",
	);
});

test("semantic index includes pipeline and step refs", () => {
	const program = parsePointSource(`module IndexDemo

pipeline document ingest
  input url: Text
  output result: Text or Error
  step fetched is await fetch doc(url)
  return fetched

action fetch doc
  input url: Text
  output body: Text or Error
  touches none
  return url
`);

	const index = createSemanticIndex(program.semanticSource!);
	expect(index.refs.some((ref) => ref.path === "pipeline.document ingest")).toBe(true);
	expect(index.refs.some((ref) => ref.path === "pipeline.document ingest.step.fetched")).toBe(true);
});

test("examples/pipelines/document-ingest.point checks and emits pipeline orchestrator", async () => {
	const source = await Bun.file("examples/pipelines/document-ingest.point").text();
	const program = parsePointSource(source);
	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("documentIngestPipeline");
	expect(emitted).toContain("documentIngestPipelineEvent");
	expect(emitted).toContain("for (const __pointAttempt of [0, 1])");
	expect(emitted).toContain("pointPipelineEmitLog");
});
