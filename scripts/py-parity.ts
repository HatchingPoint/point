#!/usr/bin/env bun
/**
 * Cross-language parity runner for paired JS/Python examples.
 * Invoked via `bun run test:py-parity`.
 */
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const parityFixtures = [
	{ source: "examples/math.point", out: "generated/math" },
	{ source: "examples/tools/path-demo.point", out: "generated/path-demo" },
	{ source: "examples/api/middleware-demo.point", out: "generated/middleware-demo" },
];

async function resolvePythonCommand(): Promise<string | null> {
	for (const candidate of ["python3", "python", "py"]) {
		try {
			const probe = Bun.spawnSync([candidate, "--version"], { stdout: "pipe", stderr: "pipe" });
			if (probe.exitCode === 0) return candidate;
		} catch {
			continue;
		}
	}
	return null;
}

console.log("Point Python parity — building paired examples…");
for (const fixture of parityFixtures) {
	if (fixture.source === "examples/tools/path-demo.point") continue;
	const jsBuild = await Bun.$`bun ${pointCli} build ${fixture.source} ${fixture.out}.js`.cwd(repoRoot).quiet();
	if (jsBuild.exitCode !== 0) {
		console.error(jsBuild.stderr.toString() || jsBuild.stdout.toString());
		process.exit(jsBuild.exitCode);
	}
	const pyBuild = await Bun.$`bun ${pointCli} build-py ${fixture.source} ${fixture.out}.py`.cwd(repoRoot).quiet();
	if (pyBuild.exitCode !== 0) {
		console.error(pyBuild.stderr.toString() || pyBuild.stdout.toString());
		process.exit(pyBuild.exitCode);
	}
}
const batchJs = await Bun.$`bun ${pointCli} build-all`.cwd(repoRoot).quiet();
const batchPy = await Bun.$`bun ${pointCli} build-py-all`.cwd(repoRoot).quiet();
if (batchJs.exitCode !== 0 || batchPy.exitCode !== 0) {
	console.error(batchJs.stderr.toString() || batchPy.stderr.toString());
	process.exit(batchJs.exitCode || batchPy.exitCode);
}

const pythonPath = await resolvePythonCommand();
if (!pythonPath) {
	console.warn("Python not found — parity tests will skip runtime comparisons.");
} else {
	console.log(`Python runtime: ${pythonPath}`);
}

console.log("Running tests/python-parity-suite.test.ts…");
const testRun = await Bun.$`bun test tests/python-parity-suite.test.ts`.cwd(repoRoot).nothrow();
if (testRun.exitCode !== 0) {
	console.error(testRun.stderr.toString() || testRun.stdout.toString());
}
process.exit(testRun.exitCode);
