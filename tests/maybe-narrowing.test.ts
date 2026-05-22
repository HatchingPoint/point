import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");

describe("Maybe presence narrowing", () => {
	test("checks maybe-narrow example and keeps nullable diagnostics off in present branches", async () => {
		const source = await Bun.file(join(repoRoot, "examples/tools/maybe-narrow.point")).text();
		const program = parsePointSource(source);
		const diagnostics = checkPointCore(program);
		expect(diagnostics).toEqual([]);
	});

	test("desugars present and is none conditions for JS, TS, and Python emit", () => {
		const source = `module NarrowEmit

record Contact
  email: Text

label banner
  input contact: Maybe<Contact>
  output Text
  when contact present return contact.email
  when contact is none return "none"
  otherwise return "fallback"
`;
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const js = emitPointCoreJavaScript(program);
		const ts = emitPointCoreTypeScript(program);
		const py = emitPointCorePython(program);
		expect(js).toContain("contact != null");
		expect(js).toContain("contact == null");
		expect(ts).toContain("contact != null");
		expect(ts).toContain("contact == null");
		expect(py).toContain("contact != None");
		expect(py).toContain("contact == None");
	});

	test("still reports nullable-field-access outside present branch narrowing", () => {
		const source = `module Broken

record Contact
  email: Text

calculation bad contact access
  input contact: Maybe<Contact>
  output value: Text
  value is contact.email
  return value
`;
		const diagnostics = checkPointCore(parsePointSource(source));
		expect(diagnostics.some((diagnostic) => diagnostic.code === "nullable-field-access")).toBe(true);
	});
});
