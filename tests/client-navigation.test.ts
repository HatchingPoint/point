import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

const repoRoot = join(import.meta.dir, "..");
const dashboardSource = join(repoRoot, "examples/app/dashboard/dashboard.point");

describe("client navigation", () => {
	test("rejects missing path param inputs on pages", () => {
		const program = parsePointSource(`module Broken

page item detail page
  title "Detail"
  main render "ok"

navigation broken app
  path "/items/:id" page item detail page
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-nav-param")).toBe(true);
		expect(diagnostics[0]?.ref).toContain("navigation.broken app");
	});

	test("rejects invalid path param types", () => {
		const program = parsePointSource(`module Broken

page item detail page
  input id: Bool
  title "Detail"
  main render "ok"

navigation broken app
  path "/items/:id" page item detail page
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-nav-param-type")).toBe(true);
	});

	test("rejects unknown page references in navigation", () => {
		const program = parsePointSource(`module Broken

navigation broken app
  path "/settings" page missing page
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-nav-page")).toBe(true);
	});

	test("emits React Router config, wrappers, links, and bootstrap mount", async () => {
		const program = parsePointSource(await Bun.file(dashboardSource).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('import { createBrowserRouter, Link, RouterProvider, useParams } from "react-router-dom"');
		expect(emitted).toContain("export const DashboardAppRouter = createBrowserRouter([");
		expect(emitted).toContain('{ path: "/items/:id", element: <ItemDetailPageRoute /> }');
		expect(emitted).toContain("function ItemDetailPageRoute()");
		expect(emitted).toContain("const id = params.id ?? \"\"");
		expect(emitted).toContain("return itemDetailPage(id);");
		expect(emitted).toContain("export function mountDashboardApp(): JSX.Element");
		expect(emitted).toContain('pointNavigationLink("Settings", "/settings")');
		expect(emitted).toContain('className="point-link"');
	});

	test("indexes navigation refs and explain coverage", async () => {
		const program = parsePointSource(await Bun.file(dashboardSource).text());
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/navigation.dashboard app`);
		expect(index.refs.some((symbol) => symbol.path.startsWith("navigation.dashboard app.route."))).toBe(true);
		const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/navigation.dashboard app`);
		expect(explanation.found).toBe(true);
		expect(explanation.summary).toContain("registers client routes");
	});

	test("check-json surfaces navigation diagnostics with repair hints", async () => {
		const broken = parsePointSource(`module Broken

page settings page
  title "Settings"
  main render "ok"

navigation broken app
  path "/items/:id" page settings page
`);
		const diagnostics = checkPointCore(broken);
		const diagnostic = diagnostics.find((entry) => entry.code === "missing-nav-param");
		expect(diagnostic?.repair).toContain("input id");
		expect(diagnostic?.ref).toBe("point://semantic/Broken/navigation.broken app");
	});
});
