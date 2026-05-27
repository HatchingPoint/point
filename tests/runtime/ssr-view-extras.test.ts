import { describe, expect, test } from "bun:test";

import { renderPointViewToHtml } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR view extras", () => {
	test("renders sign-out button metadata", () => {
		const program = checkedProgram(`module SsrButtons

view admin nav
  link "Members" to "/members"
  button "Sign out" clear auth navigate "/login"
  render "Navigation"
`);

		const html = renderPointViewToHtml(program, "admin nav");
		expect(html).toContain("point-view-button");
		expect(html).toContain("Sign out");
		expect(html).toContain("clearAuth&quot;:true");
		expect(html).toContain("navigateTo&quot;:&quot;/login");
	});

	test("renders bar chart columns from iterable data", () => {
		const program = checkedProgram(`module SsrChart

record Metric
  label: Text
  value: Int

view dashboard
  input metrics: List<Metric>
  chart bar from metrics label field label value field value
  render "Dashboard"
`);

		const html = renderPointViewToHtml(program, "dashboard", [
			[
				{ label: "Jobs", value: 80 },
				{ label: "Errors", value: 20 },
			],
		]);

		expect(html).toContain("point-chart point-chart-bar");
		expect(html).toContain("point-chart-bar-item");
		expect(html).toContain("Jobs");
		expect(html).toContain("Errors");
	});

	test("renders tabs and conditional modal", () => {
		const program = checkedProgram(`module SsrTabsModal

record Settings
  theme: Text
  notifications enabled: Bool

view settings panel
  input settings: Settings
  tabs
  tab "General" render "Theme: " + settings.theme
  tab "Advanced" render "Workspace-wide notifications"
  modal "Notifications enabled" when settings.notifications enabled render "Email alerts are active"
  render "Settings"
`);

		const html = renderPointViewToHtml(program, "settings panel", [{ theme: "slate", notificationsEnabled: true }]);

		expect(html).toContain("data-point-tabs");
		expect(html).toContain("point-tab-active");
		expect(html).toContain("Theme: slate");
		expect(html).toContain("point-modal");
		expect(html).toContain("Email alerts are active");
	});

	test("skips modal when condition is false", () => {
		const program = checkedProgram(`module SsrModalHidden

view detail
  input id: Text
  modal "Member actions" when id != "" render "Manage access for " + id
  render "Detail"
`);

		expect(renderPointViewToHtml(program, "detail", [""])).not.toContain("point-modal");
		expect(renderPointViewToHtml(program, "detail", ["u-1"])).toContain("Manage access for u-1");
	});
});
