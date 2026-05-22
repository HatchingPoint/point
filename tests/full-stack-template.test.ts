import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { buildServeEntry, createServeBootstrap } from "../packages/point/src/core/serve-app.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { buildDevEntry } from "../packages/point/src/core/dev.ts";

const repoRoot = join(import.meta.dir, "..");
const templateDir = join(repoRoot, "examples/full-stack-template");
const appPoint = join(templateDir, "src/app.point");

describe("full-stack template", () => {
	test("app.point checks and emits fetch-based members list", async () => {
		const source = await Bun.file(appPoint).text();
		const program = parsePointSource(source);
		expect(program.semanticSource?.declarations.some((d) => d.kind === "route")).toBe(true);
		const build = await buildDevEntry("src/app.point", templateDir);
		expect(build.ok).toBe(true);
		const ts = await Bun.file(build.tsOutput!).text();
		expect(ts).toContain('fetch("/api/members")');
		expect(ts).toContain('body["members"]');
	});

	test("API routes respond when served", async () => {
		const build = await buildServeEntry("src/app.point", templateDir);
		expect(build.ok).toBe(true);
		const port = 19300 + Math.floor(Math.random() * 1000);
		const runnerPath = join(templateDir, ".point-cache", "integration-serve.ts");
		await Bun.write(runnerPath, createServeBootstrap(build.jsOutput, join(templateDir, "dist")));
		await Bun.$`mkdir -p ${join(templateDir, "dist")}`.quiet();
		await Bun.write(join(templateDir, "dist/index.html"), "<!doctype html><html></html>\n");
		const proc = Bun.spawn(["bun", runnerPath], {
			cwd: templateDir,
			env: { ...process.env, PORT: String(port) },
			stdout: "ignore",
			stderr: "ignore",
		});
		const baseUrl = `http://127.0.0.1:${port}`;
		try {
			const deadline = Date.now() + 8000;
			while (Date.now() < deadline) {
				try {
					if ((await fetch(`${baseUrl}/api/health`)).ok) break;
				} catch {
					// retry
				}
				await Bun.sleep(50);
			}
			expect(await (await fetch(`${baseUrl}/api/health`)).text()).toBe("ok");
			const members = await (await fetch(`${baseUrl}/api/members`)).json();
			expect(Array.isArray(members.members)).toBe(true);
			expect(members.members.length).toBeGreaterThan(0);
		} finally {
			proc.kill();
			await proc.exited.catch(() => undefined);
		}
	}, 30000);
});
