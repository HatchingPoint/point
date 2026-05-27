import { describe, expect, test } from "bun:test";

import { createPointRuntimeFetchHandler } from "../../packages/point/runtime/index.ts";
import { renderPointViewToHtml } from "../../packages/point/runtime/index.ts";
import { wrapSsrHtmlDocument } from "../../packages/point/runtime/ssr/document.ts";
import { servePointUiCss } from "../../packages/point/runtime/ssr/theme-ssr.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR theme toggle", () => {
	test("renders toggle theme control in views", () => {
		const program = checkedProgram(`module SsrThemeToggle

theme app theme
  accent slate
  toggle

view admin nav
  toggle theme
  link "Members" to "/members"
  render "Navigation"
`);

		const html = renderPointViewToHtml(program, "admin nav");
		expect(html).toContain("point-theme-toggle");
		expect(html).toContain("data-point-theme-toggle");
		expect(html).toContain("Switch to dark theme");
	});

	test("wraps themed pages with shell, css link, and theme client script", () => {
		const program = checkedProgram(`module SsrThemeDocument

theme app theme
  accent emerald
  density compact
  radius sharp
  toggle

view admin nav
  toggle theme
  render "Navigation"

page home page
  title "Home"
  main render admin nav()

navigation app
  path "/" page home page
  bootstrap router
`);

		const handler = createPointRuntimeFetchHandler(program);
		return handler(new Request("http://point.test/")).then(async (response) => {
			expect(response.status).toBe(200);
			const html = await response.text();
			expect(html).toContain('data-point-theme-root');
			expect(html).toContain('data-point-theme="light"');
			expect(html).toContain("point-theme-accent-emerald");
			expect(html).toContain('href="/point-ui.css"');
			expect(html).toContain("point-theme-mode");
			expect(html).toContain("data-point-theme-toggle");
		});
	});

	test("serves point-ui.css from the runtime HTTP handler", async () => {
		const program = checkedProgram(`module CssRoute

route health
  method GET
  path "/api/health"
  output response: Text
  return "ok"
`);

		const css = servePointUiCss();
		expect(css.status).toBe(200);
		expect(css.headers.get("content-type")).toContain("text/css");
		expect(await css.text()).toContain(".point-theme-toggle");

		const handler = createPointRuntimeFetchHandler(program);
		const response = await handler(new Request("http://point.test/point-ui.css"));
		expect(response.status).toBe(200);
		expect(await response.text()).toContain(".point-app[data-point-theme=\"dark\"]");
	});

	test("does not inject theme script for pages without theme toggle", () => {
		const wrapped = wrapSsrHtmlDocument('<div class="point-view-render">Plain text</div>');
		expect(wrapped).not.toContain("point-theme-mode");
		expect(wrapped).not.toContain("<script>");
	});
});
