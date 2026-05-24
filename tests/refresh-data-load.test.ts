import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";
import { formatSemanticProgram } from "../packages/point/src/semantic/format.ts";

const stableModule = `module RefreshDemo

action load feed
  output rows: List<Text>
  touches none
  return ["a"]

view polled list
  load data from action load feed
  refresh every 30 seconds
  when loading render "loading"
  render "ok"
`;

describe("refresh every with data load", () => {
	test("parse and format preserve refresh every on views", () => {
		const program = parsePointSource(stableModule);
		const semantic = program.semanticSource;
		expect(semantic).toBeDefined();
		expect(formatSemanticProgram(semantic!)).toContain("refresh every 30 seconds");
		const view = semantic!.declarations.find((d) => d.kind === "view" && d.name === "polled list");
		expect(view?.kind).toBe("view");
		expect(view && "body" in view ? view.body.some((s) => s.kind === "refreshEvery" && s.count === 30 && s.unit === "seconds") : false).toBe(
			true,
		);
	});

	test("checker rejects refresh without load binding", () => {
		const program = parsePointSource(`module Bad

view naked
  refresh every 10 seconds
  render "x"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((d) => d.code === "refresh-without-load")).toBe(true);
	});

	test("checker rejects duplicate refresh lines on a view", () => {
		const program = parsePointSource(`module Bad

action load feed
  output rows: List<Text>
  touches none
  return []

view double refresh
  load data from action load feed
  refresh every 10 seconds
  refresh every 20 seconds
  render data
`);
		expect(checkPointCore(program).some((d) => d.code === "duplicate-refresh-interval")).toBe(true);
	});

	test("page refresh parses and checks with load data", () => {
		const program = parsePointSource(`module PageRefresh

action load feed
  output rows: List<Text>
  touches none
  return []

page home
  load data from action load feed
  refresh every 1 minutes
  title "Live"
  main render "x"
`);
		expect(checkPointCore(program)).toEqual([]);
		const page = program.semanticSource!.declarations.find((d) => d.kind === "page" && d.name === "home");
		expect(page?.kind).toBe("page");
		expect(page && "refreshEvery" in page ? page.refreshEvery : undefined).toEqual({ count: 1, unit: "minutes" });
	});

	test("indexes refresh refs and explains them", () => {
		const program = parsePointSource(stableModule);
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		const refreshRef = `point://semantic/${moduleName}/view.polled list.refresh`;
		expect(index.refs.map((entry) => entry.ref)).toContain(refreshRef);
		expect(explainSemanticRef(semantic, refreshRef).summary).toContain("refetches");
	});

	test("emit adds setInterval refetch and clears on unmount", () => {
		const program = parsePointSource(stableModule);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("const load = async (initial: boolean) =>");
		expect(emitted).toContain("void load(true);");
		expect(emitted).toContain("const intervalId = setInterval(() => { void load(false); }, 30000);");
		expect(emitted).toContain("clearInterval(intervalId);");
		expect(emitted).toContain("if (initial)");
	});
});
