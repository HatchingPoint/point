#!/usr/bin/env bun
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];

interface CommandTiming {
	label: string;
	elapsedMs: number;
	exitCode: number;
	stdout: string;
}

async function discoverFixtures(): Promise<string[]> {
	const fixtures = new Set<string>();
	for (const pattern of FIXTURE_PATTERNS) {
		const glob = new Glob(pattern);
		for await (const path of glob.scan({ cwd: repoRoot, onlyFiles: true })) {
			if (!path.includes("/generated/")) fixtures.add(path.replaceAll("\\", "/"));
		}
	}
	return [...fixtures].sort((a, b) => a.localeCompare(b));
}

async function timeCommand(label: string, command: "check-all" | "build-all", env: Record<string, string | undefined> = {}): Promise<CommandTiming> {
	const previousEnv: Record<string, string | undefined> = {};
	for (const [key, value] of Object.entries(env)) {
		previousEnv[key] = process.env[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}

	const start = performance.now();
	const result = await Bun.$`bun ${pointCli} ${command}`.cwd(repoRoot).quiet();
	const elapsedMs = performance.now() - start;

	for (const [key, value] of Object.entries(previousEnv)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}

	return {
		label,
		elapsedMs,
		exitCode: result.exitCode,
		stdout: result.stdout.toString(),
	};
}

function reportTiming(timing: CommandTiming, moduleCount: number): void {
	const perModule = timing.elapsedMs / moduleCount;
	console.log(`${timing.label}: ${timing.elapsedMs.toFixed(1)}ms total (${perModule.toFixed(2)}ms/module)`);
	const summary = timing.stdout.trim().split("\n").pop();
	if (summary) console.log(`  → ${summary}`);
	if (timing.exitCode !== 0) {
		console.error(timing.stdout);
		process.exit(1);
	}
}

const fixtures = await discoverFixtures();
const combinedBytes = fixtures.reduce((total, fixture) => total + readFileSync(join(repoRoot, fixture), "utf8").length, 0);

console.log("Point platform benchmark");
console.log(`Fixtures: ${fixtures.length}`);
console.log(`Combined source size: ${combinedBytes} bytes`);
console.log("");

await Bun.$`rm -rf .point-cache`.cwd(repoRoot).quiet();

const checkCold = await timeCommand("check-all (cold)", "check-all");
reportTiming(checkCold, fixtures.length);

const build = await timeCommand("build-all", "build-all");
reportTiming(build, fixtures.length);

await Bun.$`rm -rf .point-cache`.cwd(repoRoot).quiet();

const checkIncrementalSeed = await timeCommand("check-all (incremental seed)", "check-all", { POINT_INCREMENTAL: "1" });
reportTiming(checkIncrementalSeed, fixtures.length);

const checkIncrementalWarm = await timeCommand("check-all (incremental warm)", "check-all", { POINT_INCREMENTAL: "1" });
reportTiming(checkIncrementalWarm, fixtures.length);

if (!checkIncrementalWarm.stdout.includes("cached")) {
	console.error("Incremental warm run did not report cached modules.");
	process.exit(1);
}

const speedup = checkIncrementalSeed.elapsedMs / Math.max(checkIncrementalWarm.elapsedMs, 0.001);
console.log("");
console.log(`Incremental warm run speedup vs seed: ${speedup.toFixed(1)}x`);
console.log("Expected complexity: O(m) parse+check per module on cold runs; O(1) check per unchanged module with POINT_INCREMENTAL=1.");
console.log("Re-run on your machine: bun run benchmark:platform");

await Bun.$`rm -rf .point-cache`.cwd(repoRoot).quiet();
