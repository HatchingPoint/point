import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { POINT_STYLE_MODIFIERS } from "../packages/point/src/core/ui-style.ts";

describe("semantic view styling", () => {
	test("parses render style modifiers on views and pages", () => {
		const program = parsePointSource(`module Demo

record Settings
  name: Text

view counter
  input count: Int
  when count > 0 render emphasized large "Counter ready"
  render muted "Counter empty"

view settings panel
  input settings: Settings
  input on settings change: Handler Settings
  on change call on settings change
  form compact
    bind field "Name" to settings.name

page dashboard page
  title "Dashboard"
  main render padded dashboardView()
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("rejects unknown style modifiers with repair hint", () => {
		const program = parsePointSource(`module Demo

view broken
  render flashy "Hello"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-view-style")).toBe(true);
		expect(diagnostics[0]?.repair).toContain(POINT_STYLE_MODIFIERS[0]!);
	});

	test("emits point-style classes for semantic modifiers", () => {
		const program = parsePointSource(`module Demo

view counter
  input count: Int
  when count > 0 render emphasized success "Ready"
  render muted "Empty"
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="point-style-emphasized point-style-success"');
		expect(emitted).toContain('className="point-style-muted"');
	});

	test("emits compact form and padded page main classes", () => {
		const program = parsePointSource(`module Demo

record Settings
  name: Text

view settings form
  input settings: Settings
  input on settings change: Handler Settings
  on change call on settings change
  form compact
    bind field "Name" to settings.name

view dashboard view
  render "Dashboard body"

page dashboard page
  title "Dashboard"
  main render padded dashboardView()
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="point-form point-style-compact"');
		expect(emitted).toContain('className="point-page-main point-style-padded"');
	});

	test("parses and emits style modifiers on tab render lines", () => {
		const program = parsePointSource(`module Demo

record Settings
  theme: Text

view settings tabs
  input settings: Settings
  tabs
  tab "General" render muted "Theme: " + settings.theme
  tab "Alerts" render emphasized "Workspace alerts"
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('content: <div className="point-style-muted">');
		expect(emitted).toContain('content: <div className="point-style-emphasized">Workspace alerts</div>');
	});

	test("rejects unknown tab style modifiers with repair hint", () => {
		const program = parsePointSource(`module Demo

view bad tabs
  tabs
  tab "General" render flashy "General settings"
  tab "Alerts" render "Alert settings"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-view-style")).toBe(true);
		expect(diagnostics[0]?.repair).toContain(POINT_STYLE_MODIFIERS[0]!);
	});

	test("parses and emits style modifiers on layout slots", () => {
		const program = parsePointSource(`module Demo

view dashboard view
  render "Dashboard"

layout app shell
  slot sidebar render muted "Primary nav"
  slot main render padded dashboardView()
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('slots.sidebar ?? <div className="point-style-muted">Primary nav</div>');
		expect(emitted).toContain('slots.main ?? <div className="point-style-padded">{dashboardView()}</div>');
	});
});
