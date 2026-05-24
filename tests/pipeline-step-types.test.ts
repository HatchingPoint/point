import { expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

test("accepts compatible pipeline step wiring", () => {
	const program = parsePointSource(`module Ingest

action fetch doc
  input url: Text
  output body: Text or Error
  touches network
  return url

action parse doc
  input body: Text or Error
  output parsed: Text or Error
  touches none
  return body

pipeline document ingest
  input url: Text
  output result: Text or Error
  step fetched is await fetch doc(url)
  step parsed is await parse doc(fetched)
  return parsed
`);

	expect(checkPointCore(program)).toEqual([]);
});

test("reports pipeline-step-type-mismatch when step output does not match next input", () => {
	const program = parsePointSource(`module BrokenIngest

action fetch doc
  input url: Text
  output body: Text
  touches none
  return url

action parse doc
  input body: Int
  output parsed: Text
  touches none
  return "ok"

pipeline document ingest
  input url: Text
  output result: Text
  step fetched is await fetch doc(url)
  step parsed is await parse doc(fetched)
  return parsed
`);

	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	const diagnostic = diagnostics.find((entry) => entry.code === "pipeline-step-type-mismatch");
	expect(diagnostic).toBeDefined();
	expect(diagnostic?.message).toContain("fetched");
	expect(diagnostic?.message).toContain("body");
	expect(diagnostic?.expected).toBe("Int");
	expect(diagnostic?.actual).toBe("Text");
	expect(diagnostic?.ref).toContain("pipeline.document ingest.step.parsed");
});

test("reports pipeline return type mismatch against declared output", () => {
	const program = parsePointSource(`module BrokenReturn

action fetch doc
  input url: Text
  output body: Text
  touches none
  return url

pipeline document ingest
  input url: Text
  output result: Int
  step fetched is await fetch doc(url)
  return fetched
`);

	const diagnostics = checkPointCore(program);
	expect(diagnostics.some((entry) => entry.code === "pipeline-step-type-mismatch" && entry.path.endsWith(".return"))).toBe(true);
});

test("examples/pipelines/document-ingest.point passes pipeline step I/O checks", async () => {
	const source = await Bun.file("examples/pipelines/document-ingest.point").text();
	const program = parsePointSource(source);
	const diagnostics = checkPointCore(program).filter((entry) => entry.code === "pipeline-step-type-mismatch");
	expect(diagnostics).toEqual([]);
});
