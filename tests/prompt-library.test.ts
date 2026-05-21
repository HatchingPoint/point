import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";
import { extractPromptPlaceholders } from "../packages/point/src/semantic/check-prompts.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const exampleSource = "examples/prompts/support-greeting.point";

describe("prompt library", () => {
	test("extracts template placeholders", () => {
		expect(extractPromptPlaceholders("Hello {user name}, tier {tier}.")).toEqual(["user name", "tier"]);
	});

	test("rejects unknown template placeholders", () => {
		const program = parsePointSource(`module Broken

record Support Context
  user name: Text

prompt support greeting
  version 1
  input Support Context
  template Hello {user name}, your {missing field} is unknown.
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-prompt-placeholder")).toBe(true);
		expect(diagnostics.find((diagnostic) => diagnostic.code === "missing-prompt-placeholder")?.ref).toBe(
			"point://semantic/Broken/prompt.support greeting",
		);
	});

	test("rejects unknown prompt input records", () => {
		const program = parsePointSource(`module Broken

record Other Context
  field: Text

prompt support greeting
  version 1
  input Missing Context
  template Hello {field}
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-prompt-record")).toBe(true);
	});

	test("parses quoted prompt templates", () => {
		const program = parsePointSource(`module Quotes

record Support Context
  user name: Text

prompt support greeting
  version v1
  input Support Context
  template "Hello {user name}!"
`);
		const prompt = program.semanticSource?.declarations.find((declaration) => declaration.kind === "prompt");
		expect(prompt).toMatchObject({
			kind: "prompt",
			name: "support greeting",
			version: "v1",
			recordName: "Support Context",
			template: "Hello {user name}!",
		});
	});

	test("validates support greeting example", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, exampleSource)).text());
		expect(checkPointCore(program)).toEqual([]);
	});

	test("indexes prompt semantic refs", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, exampleSource)).text());
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/prompt.support greeting`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/prompt.support greeting.version`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/prompt.support greeting.input.Support Context`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/prompt.support greeting.placeholder.user name`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/prompt.support greeting.template`);
		const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/prompt.support greeting`);
		expect(explanation.found).toBe(true);
		expect(explanation.relatedRefs).toContain(`point://semantic/${moduleName}/prompt.support greeting.placeholder.user name`);
	});
});
