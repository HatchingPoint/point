import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore, emitPointCorePython, parsePointSource } from "../packages/point/src/core/index.ts";

const repoRoot = join(import.meta.dir, "..");
const pipelineFixture = join(repoRoot, "tests/conformance/fixtures/pipeline.point");
const documentIngest = join(repoRoot, "examples/pipelines/document-ingest.point");

describe("python pipeline emit", () => {
	test("conformance pipeline emits async Python with step logging helpers", async () => {
		const program = parsePointSource(await Bun.file(pipelineFixture).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("def point_pipeline_emit_log(");
		expect(emitted).toContain("async def textIngestPipeline(url: str, __pointPipelineLog: Callable[[dict[str, object]], None] | None = None) -> str:");
		expect(emitted).toContain("fetched: str = await fetchTextBody(url)");
		expect(emitted).toContain("parsed: str = await parseTextParsed(fetched)");
		expect(emitted).not.toContain("not supported in Python emit yet");
	});

	test("document ingest pipeline emits retry and policy orchestration", async () => {
		const program = parsePointSource(await Bun.file(documentIngest).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("async def documentIngestPipeline(");
		expect(emitted).toContain("for __pointAttempt in [0, 1]:");
		expect(emitted).toContain("allowedUrlPolicy");
		expect(emitted).not.toContain("not supported in Python emit yet");
	});
});
