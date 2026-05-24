import { expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { checkPointCore, emitPointCoreTypeScript, parsePointSource } from "../packages/point/src/core/index.ts";
import { createSemanticIndex, mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

test("guard output paths block parses and emits path validation helpers", () => {
	const program = parsePointSource(`module GuardDemo

guard output paths
  allow "output/**"
  allow "tmp/*"

action resolve path
  input target: Text
  output path: Text or Error
  touches file
  return target

pipeline guarded write
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    touches file scope output paths
  return written
`);

	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("const outputPathsGuardPatterns");
	expect(emitted).toContain('"output/**"');
	expect(emitted).toContain("function pointGuardPathAllowed");
	expect(emitted).toContain("function pointGlobMatch");
	expect(emitted).toContain('Path outside guard output paths');
});

test("guard blocks disallowed paths at runtime with structured Error", async () => {
	const program = parsePointSource(`module GuardRuntime

guard output paths
  allow "output/**"

action resolve path
  input target: Text
  output path: Text or Error
  touches file
  return target

pipeline guarded write
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    touches file scope output paths
  return written
`);

	const emitted = emitPointCoreTypeScript(program);
	const tmpDir = join(import.meta.dir, "tmp");
	await mkdir(tmpDir, { recursive: true });
	const modulePath = join(tmpDir, `guard-runtime-${Date.now()}.ts`);
	await Bun.write(modulePath, emitted);
	const mod = await import(modulePath);

	const allowed = await mod.guardedWritePipeline("output/report.txt");
	expect(allowed).toBe("output/report.txt");

	const blocked = await mod.guardedWritePipeline("/etc/passwd");
	expect(blocked).toEqual({ message: "Path outside guard output paths" });
});

test("require guard step option aliases touches file scope", () => {
	const program = parsePointSource(`module GuardAlias

guard output paths
  allow "output/**"

action resolve path
  input target: Text
  output path: Text or Error
  touches file
  return target

workflow save file
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    require guard output paths
  return written
`);

	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("pointGuardPathAllowed");
});

test("check-json reports unknown guard on pipeline steps", () => {
	const program = parsePointSource(`module BrokenGuard

pipeline bad ingest
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    touches file scope missing guard
  return written

action resolve path
  input target: Text
  output path: Text or Error
  touches none
  return target
`);

	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-guard")).toBe(true);
	expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-guard")?.ref).toContain(
		"pipeline.bad ingest.step.written",
	);
});

test("check-json reports unknown guard on workflow steps", () => {
	const program = parsePointSource(`module BrokenWorkflowGuard

workflow bad save
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    require guard missing guard
  return written

action resolve path
  input target: Text
  output path: Text or Error
  touches none
  return target
`);

	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-guard")).toBe(true);
	expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-guard")?.ref).toContain(
		"workflow.bad save.step.written",
	);
});

test("semantic index includes guard and pattern refs", () => {
	const program = parsePointSource(`module IndexGuard

guard output paths
  allow "output/**"

pipeline guarded write
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    touches file scope output paths
  return written

action resolve path
  input target: Text
  output path: Text or Error
  touches none
  return target
`);

	const index = createSemanticIndex(program.semanticSource!);
	expect(index.refs.some((ref) => ref.path === "guard.output paths")).toBe(true);
	expect(index.refs.some((ref) => ref.path === "guard.output paths.pattern.output%2F**")).toBe(true);
});

test("examples/pipelines/guarded-output.point checks and emits guarded pipeline", async () => {
	const source = await Bun.file("examples/pipelines/guarded-output.point").text();
	const program = parsePointSource(source);
	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("guardedWritePipeline");
	expect(emitted).toContain("blockedWritePipeline");
	expect(emitted).toContain("outputPathsGuardPatterns");
	expect(emitted).toContain("pointGuardPathAllowed");
});
