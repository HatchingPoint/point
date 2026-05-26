import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { pointSsrRenderables, renderPointPageToHtml, renderPointRuntimePage, renderPointSsrEntryToHtml, renderPointViewToHtml } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");

function checkedInlineProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

async function checkedFileProgram(relativePath: string) {
	const input = join(repoRoot, relativePath);
	const program = parsePointSource(await readFile(input, "utf8"), { cwd: repoRoot, input });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR", () => {
	test("renders view blocks to escaped HTML strings", () => {
		const program = checkedInlineProgram(`module SsrDemo

view greeting
  input name: Text
  render emphasized "Hello, " + name
`);

		expect(pointSsrRenderables(program)).toContainEqual({
			name: "greeting",
			functionName: "greetingView",
			kind: "view",
		});
		expect(renderPointViewToHtml(program, "greeting", ["<Point>"])).toBe('<div class="point-view-render emphasized">Hello, &lt;Point&gt;</div>');
	});

	test("renders conditional view branches", async () => {
		const program = await checkedFileProgram("examples/view.point");

		expect(renderPointViewToHtml(program, "counter", [1])).toBe('<div class="point-view-render emphasized large">Counter ready</div>');
		expect(renderPointViewToHtml(program, "counter", [0])).toBe('<div class="point-view-render muted">Counter empty</div>');
	});

	test("renders page blocks and layout slots to HTML strings", async () => {
		const program = await checkedFileProgram("tests/conformance/fixtures/layout-navigation.point");

		const html = renderPointPageToHtml(program, "home page");

		expect(html).toContain('<div class="point-layout">');
		expect(html).toContain('<section class="point-layout-slot point-layout-slot-sidebar">');
		expect(html).toContain('<a class="point-link" href="/">Home</a>');
		expect(html).toContain("Navigation</div>");
		expect(html).toContain('<h1>Home</h1>');
		expect(html).toContain('<p class="point-page-description">Conformance layout page</p>');
		expect(html).toContain('<section class="point-page-main">Home page</section>');
		expect(html).not.toContain("React");
		expect(html).not.toContain("jsx");
	});

	test("renders by SSR entry name or semantic name", async () => {
		const program = await checkedFileProgram("tests/conformance/fixtures/layout-navigation.point");
		const page = pointSsrRenderables(program).find((renderable) => renderable.kind === "page" && renderable.name === "home page");
		expect(page).toBeDefined();

		expect(renderPointSsrEntryToHtml(program, page!.functionName)).toBe(renderPointPageToHtml(program, "home page"));
	});

	test("renders navigation routes and view links without react-router-dom", async () => {
		const program = checkedInlineProgram(`module SsrNavigationDemo

view app nav
  link "Settings" to "/settings"
  link "Profile" to "/profile"
  render "Navigation"

page settings page
  title "Settings"
  main render app nav()

navigation app router
  path "/settings" page settings page
  bootstrap router
`);

		const response = await renderPointRuntimePage(program, new Request("http://example.test/settings"));
		expect(response).not.toBeNull();
		expect(response!.status).toBe(200);
		expect(response!.headers.get("content-type")).toContain("text/html");
		const html = await response!.text();

		expect(html).toContain('<a class="point-link point-link-active" href="/settings">Settings</a>');
		expect(html).toContain('<a class="point-link" href="/profile">Profile</a>');
		expect(html).not.toContain("react-router-dom");
		expect(html).not.toContain("NavLink");
		expect(html).not.toContain("RouterProvider");
	});
});
