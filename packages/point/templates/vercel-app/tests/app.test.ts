import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore } from "@hatchingpoint/point/core";
import { parsePointSource } from "@hatchingpoint/point/core";

const appSource = readFileSync(join(import.meta.dir, "../src/app.point"), "utf8");

describe("vercel app template", () => {
	test("app.point passes point check", () => {
		expect(checkPointCore(parsePointSource(appSource))).toHaveLength(0);
	});

	test("includes theme and API routes", () => {
		expect(appSource).toContain("theme app theme");
		expect(appSource).toContain('path "/api/tasks"');
		expect(appSource).toContain("accent indigo");
	});
});
