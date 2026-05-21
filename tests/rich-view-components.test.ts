import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";

const repoRoot = join(import.meta.dir, "..");
const dashboardSource = join(repoRoot, "examples/app/dashboard/dashboard.point");

describe("rich view components", () => {
	test("parses form, tabs, modal, and each syntax", () => {
		const program = parsePointSource(`module Demo

record Settings
  name: Text
  alerts: Bool

record Item
  id: Text
  title: Text

view settings panel
  input settings: Settings
  input on settings change: Handler Settings
  on change call on settings change
  form
    bind field "Name" to settings.name
    bind checkbox "Alerts" to settings.alerts
  tabs
    tab "General" render settings.name
    tab "Alerts" render "Alerts on"
  modal "Confirm" when settings.alerts render "Alerts enabled"

view item list
  input items: List<Item>
  each item in items render link item.title to "/items/" + item.id
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("rejects each over non-list inputs", () => {
		const program = parsePointSource(`module Demo

view broken list
  input title: Text
  each row in title render title
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-each-iterable")).toBe(true);
		expect(diagnostics[0]?.repair).toContain("List input");
	});

	test("emits accessible form, tabs, modal, and list markup", async () => {
		const program = parsePointSource(await Bun.file(dashboardSource).text());
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="point-form"');
		expect(emitted).toContain('type="text"');
		expect(emitted).toContain('type="checkbox"');
		expect(emitted).toContain("pointViewTabs");
		expect(emitted).toContain('role="tablist"');
		expect(emitted).toContain('role="dialog"');
		expect(emitted).toContain('aria-modal="true"');
		expect(emitted).toContain('className="point-list"');
		expect(emitted).toContain('role="list"');
		expect(emitted).toContain('pointNavigationLink(String(item.title), String(("/items/" + item.id)))');
		expect(emitted).toContain("React.useState<WorkspaceSettings>");
	});

	test("indexes rich view refs and explain coverage", async () => {
		const program = parsePointSource(await Bun.file(dashboardSource).text());
		const semantic = program.semanticSource!;
		const moduleName = semantic.module ?? "anonymous";
		const index = createSemanticIndex(semantic);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/view.settings form.form.Workspace name`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/view.settings form.tab.General`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/view.items list.each.item`);
		expect(index.refs.map((symbol) => symbol.ref)).toContain(`point://semantic/${moduleName}/view.item detail.modal.Item actions`);
		const explanation = explainSemanticRef(semantic, `point://semantic/${moduleName}/view.settings form`);
		expect(explanation.found).toBe(true);
		expect(explanation.summary).toContain("Semantic view");
	});
});
