import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildPointApp } from "../packages/point/src/core/build-app.ts";
import { buildServeEntry, createServeBootstrap } from "../packages/point/src/core/serve-app.ts";

const repoRoot = join(import.meta.dir, "..");

const appSource = `module BuildAppDemo

view home
  render "Home"

page home page
  title "Home"
  main render home()

navigation main app
  path "/" page home page
  bootstrap router

route health
  method GET
  path "/api/health"
  output response: Text
  return "ok"

command serve demo
  output status: Text
  return "ready"
`;

describe("point build-app", () => {
	test("buildPointApp emits JS, TS, and dist when web/ exists", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-build-app-"));
		try {
			await writeFile(join(projectDir, "app.point"), appSource);
			await mkdir(join(projectDir, "web"), { recursive: true });
			await writeFile(
				join(projectDir, "web/vite.config.js"),
				'export default { root: ".", build: { outDir: "../dist", emptyOutDir: true } };\n',
			);
			await writeFile(join(projectDir, "web/index.html"), "<!doctype html><html><body><div id=root></div></body></html>\n");
			const result = await buildPointApp("app.point", projectDir, { legacy: true });
			expect(result.ok).toBe(true);
			expect(await Bun.file(result.jsOutput).exists()).toBe(true);
			expect(await Bun.file(result.tsOutput).exists()).toBe(true);
			expect(await Bun.file(result.tsxOutput).exists()).toBe(true);
			expect(await Bun.file(join(result.distDir, "index.html")).exists()).toBe(true);
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	}, 60000);
});

describe("point serve runtime", () => {
	test("startAppServer serves API and static", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-serve-runtime-"));
		const port = 19200 + Math.floor(Math.random() * 1000);
		try {
			await writeFile(join(projectDir, "app.point"), appSource);
			const build = await buildServeEntry("app.point", projectDir);
			expect(build.ok).toBe(true);
			await mkdir(join(projectDir, "dist"), { recursive: true });
			await writeFile(join(projectDir, "dist/index.html"), "<!doctype html><html><body><div id=root></div></body></html>\n");
			const runnerPath = join(projectDir, "serve-runner.ts");
			await writeFile(runnerPath, createServeBootstrap(build.jsOutput, join(projectDir, "dist")));
			process.env.PORT = String(port);
			const proc = Bun.spawn(["bun", runnerPath], {
				cwd: projectDir,
				env: { ...process.env, PORT: String(port) },
				stdout: "ignore",
				stderr: "ignore",
			});
			const baseUrl = `http://127.0.0.1:${port}`;
			const deadline = Date.now() + 8000;
			while (Date.now() < deadline) {
				try {
					const health = await fetch(`${baseUrl}/api/health`);
					if (health.ok) break;
				} catch {
					// retry
				}
				await Bun.sleep(50);
			}
			expect(await (await fetch(`${baseUrl}/api/health`)).text()).toBe("ok");
			const staticResponse = await fetch(`${baseUrl}/`);
			expect(staticResponse.ok).toBe(true);
			expect(await staticResponse.text()).toContain("root");
			proc.kill();
			await proc.exited.catch(() => undefined);
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	}, 90000);
});
