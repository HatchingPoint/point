import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import {
	buildServeEntry,
	createServeBootstrap,
	parseServeCliFlags,
	supportsPointServe,
} from "../packages/point/src/core/serve-app.ts";

const repoRoot = join(import.meta.dir, "..");

const routeAppSource = `module ServeDemo

route health
  method GET
  path "/api/health"
  output response: Text
  return "ok"

command serve demo
  output status: Text
  return "ready"
`;

describe("point serve helpers", () => {
	test("parseServeCliFlags reads --port and --static", () => {
		expect(parseServeCliFlags(["app.point", "--port", "8080"]).port).toBe(8080);
		expect(parseServeCliFlags(["--static=public", "app.point"]).staticDir).toBe("public");
	});

	test("supportsPointServe requires routes", () => {
		const withRoutes = parsePointSource(routeAppSource);
		expect(supportsPointServe(withRoutes)).toBe(true);
		const withoutRoutes = parsePointSource(`module NoRoutes\ncalculation x\n  output y: Text\n  return "a"`);
		expect(supportsPointServe(withoutRoutes)).toBe(false);
	});

	test("createServeBootstrap wires API prefix and static root", () => {
		const bootstrap = createServeBootstrap("/tmp/generated/app.js", "/tmp/dist");
		expect(bootstrap).toContain("createPointRouteFetchHandler");
		expect(bootstrap).toContain('pathname.startsWith("/api/")');
		expect(bootstrap).toContain('const staticRoot = "/tmp/dist"');
		expect(bootstrap).toContain("startAppServer");
	});

	test("buildServeEntry emits JavaScript when check passes", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-serve-build-"));
		try {
			await writeFile(join(projectDir, "app.point"), routeAppSource);
			const build = await buildServeEntry("app.point", projectDir);
			expect(build.ok).toBe(true);
			expect((await Bun.file(build.jsOutput).text()).includes("createPointRouteFetchHandler")).toBe(true);
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});
