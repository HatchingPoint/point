import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { emitPointCoreTypeScript } from "../packages/point/src/core/emit-typescript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import {
	POINT_THEME_ACCENTS,
	POINT_THEME_DENSITIES,
	POINT_THEME_RADII,
} from "../packages/point/src/core/ui-style.ts";

describe("semantic theme blocks", () => {
	test("parses and checks theme presets", () => {
		const program = parsePointSource(`module Demo

theme app theme
  accent indigo
  density comfortable
  radius medium

view home
  render emphasized "Hello"

page home page
  title "Home"
  main render home()

navigation main app
  path "/" page home page
  bootstrap router
`);
		expect(checkPointCore(program)).toEqual([]);
	});

	test("rejects unknown theme accent with repair hint", () => {
		const program = parsePointSource(`module Demo

record Placeholder
  id: Text

theme app theme
  accent neon
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-theme-accent")).toBe(true);
		expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-theme-accent")?.repair).toContain(POINT_THEME_ACCENTS[0]!);
	});

	test("rejects duplicate theme blocks", () => {
		const program = parsePointSource(`module Demo

record Placeholder
  id: Text

theme one theme
  accent indigo

theme two theme
  accent emerald
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "duplicate-theme")).toBe(true);
	});

	test("emits theme preset classes on layout and mount wrapper", () => {
		const program = parsePointSource(`module Demo

theme app theme
  accent emerald
  density compact
  radius sharp

view nav
  link "Home" to "/"

view home
  render "Home"

layout app shell
  slot sidebar render nav()
  slot main render home()

page home page
  layout app shell
  title "Home"
  main render home()

navigation main app
  path "/" page home page
  bootstrap router
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("point-theme-accent-emerald");
		expect(emitted).toContain("point-theme-density-compact");
		expect(emitted).toContain("point-theme-radius-sharp");
		expect(emitted).toContain('className="point-app point-theme-accent-emerald point-theme-density-compact point-theme-radius-sharp"');
	});

	test("emits route handler without serve command when routes exist", () => {
		const program = parsePointSource(`module Demo

route health
  method GET
  path "/api/health"
  output response: Text
  return "ok"
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreJavaScript(program);
		expect(emitted).toContain("createPointRouteFetchHandler");
		expect(emitted).not.toContain("command serve");
	});

	test("emits NavLink active state for navigation links", () => {
		const program = parsePointSource(`module Demo

view nav
  link "Home" to "/"
  link "Tasks" to "/tasks"

view home
  render "Home"

page home page
  title "Home"
  main render home()

navigation main app
  path "/" page home page
  bootstrap router
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("point-link-active");
		expect(emitted).toContain("NavLink");
	});

	test("parses theme toggle and emits shell plus toggle control", () => {
		const program = parsePointSource(`module Demo

theme app theme
  accent indigo
  toggle

view nav
  toggle theme
  link "Home" to "/"

view home
  render "Home"

page home page
  title "Home"
  main render home()

navigation main app
  path "/" page home page
  bootstrap router
`);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("PointThemeShell");
		expect(emitted).toContain("data-point-theme");
		expect(emitted).toContain("pointThemeToggle");
	});

	test("rejects toggle theme when theme block has no toggle setting", () => {
		const program = parsePointSource(`module Demo

theme app theme
  accent indigo

view nav
  toggle theme
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "theme-toggle-disabled")).toBe(true);
	});
});
