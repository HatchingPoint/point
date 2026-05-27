import { describe, expect, test } from "bun:test";

import { createPointRuntimeFetchHandler, renderPointViewToHtml } from "../../packages/point/runtime/index.ts";
import {
	extractLiveRegionInnerHtml,
	POINT_REFRESH_HEADER,
	POINT_REFRESH_HEADER_VALUE,
	serializePointRefreshConfig,
	wrapLiveRegionHtml,
} from "../../packages/point/runtime/ssr/refresh-ssr.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = import.meta.dir + "/../..";

function checkedProgram(source: string) {
	const program = parsePointSource(source, { cwd: repoRoot, input: "inline.point" });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime SSR refresh every", () => {
	test("wraps refreshed views with live region metadata", () => {
		const program = checkedProgram(`module SsrRefresh

record Metric
  label: Text
  value: Text

action fetch metrics
  output rows: List<Metric>
  return [{ label: "Jobs", value: "3" }]

view live metrics
  load data from action fetch metrics
  refresh every 15 seconds
  datagrid item in data columns label, value sort by label
  render "Live metrics"
`);

		const html = renderPointViewToHtml(program, "live metrics");
		expect(html).toContain("point-live-region");
		expect(html).toContain("data-point-refresh");
		expect(html).toContain("intervalMs");
		expect(html).toContain("15000");
	});

	test("extractLiveRegionInnerHtml returns nested-safe inner markup", () => {
		const inner = wrapLiveRegionHtml('<div class="point-datagrid"><div class="point-datagrid-row">A</div></div>', { refreshIntervalMs: 5000 }, "/live");
		const extracted = extractLiveRegionInnerHtml(`<main>${inner}</main>`);
		expect(extracted).toContain("point-datagrid-row");
		expect(extracted).not.toContain("point-live-region");
	});

	test("refresh header returns live region fragment from navigation pages", async () => {
		const program = checkedProgram(`module SsrRefreshPage

record Metric
  label: Text
  value: Text

action fetch metrics
  output rows: List<Metric>
  return [{ label: "Jobs", value: "3" }]

view live metrics
  load data from action fetch metrics
  refresh every 30 seconds
  datagrid item in data columns label, value sort by label
  render "Live metrics"

page home page
  title "Live"
  main render live metrics()

navigation app
  path "/" page home page
  bootstrap router
`);

		const handler = createPointRuntimeFetchHandler(program);
		const full = await handler(new Request("http://point.test/"));
		expect(full.status).toBe(200);
		const fullHtml = await full.text();
		expect(fullHtml).toContain("data-point-refresh");
		expect(fullHtml).toContain("intervalMs");
		expect(fullHtml).toContain("30000");

		const fragment = await handler(
			new Request("http://point.test/", {
				headers: { [POINT_REFRESH_HEADER]: POINT_REFRESH_HEADER_VALUE },
			}),
		);
		expect(fragment.status).toBe(200);
		const fragmentHtml = await fragment.text();
		expect(fragmentHtml).toContain("point-datagrid");
		expect(fragmentHtml).not.toContain("<!doctype html>");
		expect(fragmentHtml).not.toContain("data-point-refresh");
	});

	test("serializePointRefreshConfig preserves path", () => {
		expect(JSON.parse(serializePointRefreshConfig(1000, "/members"))).toEqual({ intervalMs: 1000, path: "/members" });
	});
});
