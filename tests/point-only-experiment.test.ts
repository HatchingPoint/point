import { describe, expect, test } from "bun:test";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

type ExperimentEntry = {
	path: string;
	isDirectory: boolean;
};

const experimentRoot = "experiments/point-only";

const allowedAssetExtensions = new Set([
	".avif",
	".css",
	".gif",
	".ico",
	".jpeg",
	".jpg",
	".mp3",
	".mp4",
	".otf",
	".png",
	".svg",
	".ttf",
	".txt",
	".wav",
	".webm",
	".webp",
	".woff",
	".woff2",
]);

const generatedArtifactExtensions = new Set([
	".cjs",
	".d.ts",
	".js",
	".jsx",
	".map",
	".mjs",
	".py",
	".ts",
	".tsx",
]);

async function listExperimentEntries(root: string): Promise<ExperimentEntry[]> {
	const entries: ExperimentEntry[] = [];

	async function walk(directory: string) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const absolutePath = join(directory, entry.name);
			const relativePath = relative(root, absolutePath).split(sep).join("/");
			entries.push({ path: relativePath, isDirectory: entry.isDirectory() });
			if (entry.isDirectory()) {
				await walk(absolutePath);
			}
		}
	}

	await walk(root);
	return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function isAllowedAuthorFile(path: string) {
	if (path === "README.md" || path === "point.json") return true;
	if (path.endsWith(".point")) return true;

	const extension = extname(path);
	const topLevelDirectory = path.split("/")[0];
	return ["assets", "public", "static"].includes(topLevelDirectory) && allowedAssetExtensions.has(extension);
}

async function waitForRuntimeDev(baseUrl: string, timeoutMs = 5000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(baseUrl);
			if (response.ok) return;
		} catch {
			// retry until the dev server binds
		}
		await Bun.sleep(50);
	}
	throw new Error(`Timed out waiting for ${baseUrl}`);
}

describe("point-only experiment author surface", () => {
	test("contains only Point source, manifest, README, and assets", async () => {
		const entries = await listExperimentEntries(experimentRoot);
		const files = entries.filter((entry) => !entry.isDirectory).map((entry) => entry.path);

		const forbiddenFiles = files.filter((path) => {
			const baseName = path.split("/").at(-1) ?? path;
			return (
				path.endsWith(".ts") ||
				path.endsWith(".tsx") ||
				baseName.startsWith("vite.config.") ||
				baseName.startsWith("next.config.")
			);
		});
		expect(forbiddenFiles).toEqual([]);

		const generatedArtifacts = files.filter((path) => {
			if (!path.split("/").includes("generated")) return false;
			return generatedArtifactExtensions.has(extname(path)) || ![".gitkeep", "README.md"].includes(path.split("/").at(-1) ?? "");
		});
		expect(generatedArtifacts).toEqual([]);

		const disallowedAuthorFiles = files.filter((path) => !isAllowedAuthorFile(path));
		expect(disallowedAuthorFiles).toEqual([]);
	});

	test("CLI hard-routes home-base run and test through the runtime entrypoint", async () => {
		const cli = await readFile("packages/point/src/core/cli.ts", "utf8");
		const runtime = await readFile("packages/point/runtime/index.ts", "utf8");
		expect(cli).toContain('import { runModule, runPointRuntimeDev, runPointRuntimeServe, runPointRuntimeTests } from "../../runtime/index.ts";');
		expect(cli).toContain("if (isHomeBaseInput(input))");
		expect(cli).toContain("runModule(input, program, entryName)");
		expect(cli).toContain("runPointRuntimeTests(input, program)");
		expect(cli).toContain("runPointRuntimeDev(devInput, program");
		expect(cli).toContain("runPointRuntimeServe(serveInput, program");
		expect(cli).toContain("blockHomeBaseEmit(command, input)");
		expect(cli).toContain("blockHomeBaseEmit(command, appInput)");
		expect(cli).not.toContain("point dev for experiments/point-only/** must be implemented");
		expect(cli).not.toContain("POINT_RUNTIME");
		expect(cli.indexOf("if (isHomeBaseInput(devInput))")).toBeLessThan(cli.indexOf("await runPointDev(devInput"));
		expect(cli.indexOf("blockHomeBaseEmit(command, appInput)")).toBeLessThan(cli.indexOf("await runPointBuildApp(appInput)"));
		expect(runtime).toContain('import { interpretCoreProgramEntry } from "./interpreter/index.ts";');
		expect(runtime).toContain("const value = interpretCoreProgramEntry(program, entryName)");
		expect(runtime).toContain("const value = interpretCoreProgramEntry(program, test.name)");
		expect(runtime).toContain("runPointRuntimeDev");
		expect(runtime).toContain("runPointRuntimeServe");
		expect(runtime).not.toContain("emitPointCoreJavaScript");
		expect(runtime).not.toContain("bundleJavaScriptForEval");
		expect(runtime).not.toContain("executeBundledEntry");
	});

	test("point run executes the home-base app through runtime", async () => {
		const run = await Bun.$`bun packages/point/src/cli.ts run experiments/point-only/src/app.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("ready");
	});

	test("point test executes home-base tests through runtime without generated test emit", async () => {
		const result = await Bun.$`bun packages/point/src/cli.ts test experiments/point-only/tests/score.test.point`.quiet();
		const output = JSON.parse(result.stdout.toString()) as { ok: boolean; tests: Array<{ ok: boolean }> };
		expect(output.ok).toBe(true);
		expect(output.tests.length).toBeGreaterThan(0);
		expect(output.tests.every((entry) => entry.ok)).toBe(true);
	});

	test("home-base build emit is blocked", async () => {
		const build = await Bun.$`bun packages/point/src/cli.ts build experiments/point-only/src/app.point`.quiet().nothrow();
		expect(build.exitCode).toBe(1);
		expect(build.stderr.toString()).toContain("Home base runs through packages/point/runtime/index.ts");
	});

	test("home-base TypeScript and Vite app build paths are blocked", async () => {
		const buildTs = await Bun.$`bun packages/point/src/cli.ts build-ts experiments/point-only/src/app.point`.quiet().nothrow();
		expect(buildTs.exitCode).toBe(1);
		expect(buildTs.stderr.toString()).toContain("Home base runs through packages/point/runtime/index.ts");
		expect(buildTs.stderr.toString()).not.toContain("Point core TypeScript build wrote");

		const buildApp = await Bun.$`bun packages/point/src/cli.ts build-app experiments/point-only/src/app.point`.quiet().nothrow();
		expect(buildApp.exitCode).toBe(1);
		expect(buildApp.stderr.toString()).toContain("Home base runs through packages/point/runtime/index.ts");
		expect(buildApp.stderr.toString()).not.toContain("web/vite.config");
		expect(buildApp.stderr.toString()).not.toContain("vite build failed");
	});

	test("point dev serves home-base through runtime without generated emit", async () => {
		const port = 21876 + Math.floor(Math.random() * 1000);
		const dev = Bun.spawn(["bun", "packages/point/src/cli.ts", "dev", "experiments/point-only/src/app.point", "--port", String(port)], {
			stdout: "ignore",
			stderr: "ignore",
		});
		try {
			const baseUrl = `http://127.0.0.1:${port}`;
			await waitForRuntimeDev(baseUrl);
			const payload = (await (await fetch(baseUrl)).json()) as { ok: boolean; module: string; commands: string[] };
			expect(payload.ok).toBe(true);
			expect(payload.module).toBe("PointOnlyApp");
			expect(payload.commands).toContain("smoke");

			const commandPayload = (await (await fetch(`${baseUrl}/runtime/command/smoke`)).json()) as { ok: boolean; value: string };
			expect(commandPayload).toEqual({ ok: true, command: "smoke", value: "ready" });

			const entries = await listExperimentEntries(experimentRoot);
			expect(entries.some((entry) => entry.path.includes("generated"))).toBe(false);
		} finally {
			dev.kill();
			await dev.exited.catch(() => undefined);
		}
	}, 10000);

	test("point serve exposes home-base HTTP routes through runtime without generated emit", async () => {
		const port = 22876 + Math.floor(Math.random() * 1000);
		const serve = Bun.spawn(["bun", "packages/point/src/cli.ts", "serve", "experiments/point-only/src/app.point", "--port", String(port)], {
			stdout: "ignore",
			stderr: "ignore",
		});
		try {
			const baseUrl = `http://127.0.0.1:${port}`;
			await waitForRuntimeDev(`${baseUrl}/readiness`);
			const response = await fetch(`${baseUrl}/readiness`);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ score: 100, label: "ready", tone: "positive" });

			const entries = await listExperimentEntries(experimentRoot);
			expect(entries.some((entry) => entry.path.includes("generated"))).toBe(false);
		} finally {
			serve.kill();
			await serve.exited.catch(() => undefined);
		}
	}, 10000);
});
