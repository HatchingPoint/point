import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	buildDevEntry,
	createDevBootstrap,
	detectAppDevMode,
	detectDevMode,
	parseDevCliFlags,
	viteWebRoot,
} from "../packages/point/src/core/dev.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");

const routeAppSource = `module DevRouteApp

route hello
  method GET
  path "/hello"
  output response: Text
  return "hello-dev"

command serve dev route app
  output status: Text
  return "ready"
`;

async function waitForServer(baseUrl: string, timeoutMs = 5000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`${baseUrl}/hello`);
			if (response.ok) return;
		} catch {
			// retry until timeout
		}
		await Bun.sleep(50);
	}
	throw new Error(`Timed out waiting for ${baseUrl}/hello`);
}

const appDevSource = `module DevApp

view home
  render "Home"

page home page
  title "Home"
  main render home()

navigation main app
  path "/" page home page
  bootstrap router

route ping
  method GET
  path "/api/ping"
  output response: Text
  return "pong"

command serve dev app
  output status: Text
  return "ready"
`;

describe("point dev helpers", () => {
	test("parseDevCliFlags reads --port and --api", () => {
		expect(parseDevCliFlags(["app.point", "--port", "4001"]).port).toBe(4001);
		expect(parseDevCliFlags(["--port=4002", "app.point"]).port).toBe(4002);
		expect(parseDevCliFlags(["--api", "app.point"]).apiOnly).toBe(true);
	});

	test("detectDevMode prefers routes over run entry", () => {
		const program = parsePointSource(routeAppSource);
		expect(detectDevMode(program)).toEqual({ kind: "routes" });
	});

	test("createDevBootstrap starts route server", () => {
		const bootstrap = createDevBootstrap("/tmp/generated/app.js", { kind: "routes" });
		expect(bootstrap).toContain("startRoutesServer");
		expect(bootstrap).toContain("Point dev listening");
	});

	test("buildDevEntry checks and emits JavaScript", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-dev-build-"));
		try {
			await writeFile(join(projectDir, "app.point"), routeAppSource);
			const build = await buildDevEntry("app.point", projectDir);
			expect(build.ok).toBe(true);
			expect(build.mode.kind).toBe("routes");
			expect(existsSync(build.jsOutput)).toBe(true);
			expect((await Bun.file(build.jsOutput).text()).includes("createPointRouteFetchHandler")).toBe(true);
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});

	test("detectDevMode selects app when navigation, routes, and web/ exist", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-dev-app-mode-"));
		try {
			await writeFile(join(projectDir, "app.point"), appDevSource);
			await mkdir(join(projectDir, "web"), { recursive: true });
			await writeFile(join(projectDir, "web/vite.config.ts"), "export default {};\n");
			const program = parsePointSource(appDevSource);
			expect(viteWebRoot(projectDir)).toBe(join(projectDir, "web"));
			expect(detectAppDevMode(program, projectDir)).toEqual({ kind: "app", webRoot: join(projectDir, "web") });
			expect(detectDevMode(program, { cwd: projectDir }).kind).toBe("app");
			expect(detectDevMode(program, { cwd: projectDir, apiOnly: true }).kind).toBe("routes");
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});

	test("buildDevEntry emits TypeScript in app mode", async () => {
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		const projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-dev-app-build-"));
		try {
			await writeFile(join(projectDir, "app.point"), appDevSource);
			await mkdir(join(projectDir, "web"), { recursive: true });
			await writeFile(join(projectDir, "web/vite.config.ts"), "export default {};\n");
			const build = await buildDevEntry("app.point", projectDir);
			expect(build.ok).toBe(true);
			expect(build.mode.kind).toBe("app");
			expect(build.tsOutput).toBeDefined();
			expect(existsSync(build.tsOutput!)).toBe(true);
			expect((await Bun.file(build.tsOutput!).text()).includes("mountMainApp")).toBe(true);
			expect((await Bun.file(build.jsOutput).text()).includes("createPointRouteFetchHandler")).toBe(true);
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});

describe("point dev CLI", () => {
	let projectDir = "";
	let devProcess: ReturnType<typeof Bun.spawn> | null = null;
	let port = 19876;

	beforeEach(async () => {
		port = 19876 + Math.floor(Math.random() * 1000);
		await mkdir(join(repoRoot, "tests/tmp"), { recursive: true });
		projectDir = await mkdtemp(join(repoRoot, "tests/tmp/point-dev-cli-"));
		await writeFile(join(projectDir, "app.point"), routeAppSource);
	});

	afterEach(async () => {
		if (devProcess) {
			devProcess.kill();
			await devProcess.exited.catch(() => undefined);
			devProcess = null;
		}
		if (projectDir && existsSync(projectDir)) await rm(projectDir, { recursive: true, force: true });
	});

	test("serves routes and reloads when .point source changes", async () => {
		devProcess = Bun.spawn(["bun", pointCli, "dev", "app.point", "--port", String(port)], {
			cwd: projectDir,
			stdout: "ignore",
			stderr: "ignore",
			env: { ...process.env, PORT: String(port) },
		});

		const baseUrl = `http://127.0.0.1:${port}`;
		await waitForServer(baseUrl, 5000);
		expect(await (await fetch(`${baseUrl}/hello`)).text()).toBe("hello-dev");

		await writeFile(join(projectDir, "app.point"), routeAppSource.replace('"hello-dev"', '"hello-reloaded"'));
		await Bun.sleep(800);

		const deadline = Date.now() + 10000;
		while (Date.now() < deadline) {
			const response = await fetch(`${baseUrl}/hello`);
			if (response.ok && (await response.text()) === "hello-reloaded") return;
			await Bun.sleep(100);
		}
		throw new Error("Timed out waiting for dev reload");
	}, 15000);
});
