import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { checkPointCore, emitPointCorePython, parsePointSource } from "../packages/point/src/core/index.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");

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

describe("python workflow emit", () => {
	test("simple workflow emits async Python function with step assignment", () => {
		const program = parsePointSource(`module Workflows

action create user
  input email: Text
  output user: Text or Error
  touches network
  return email

workflow signup flow
  input email: Text
  output user: Text or Error
  step created user is await create user(email)
  return created user
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("async def signupFlowWorkflow(email: str) -> str | dict[str, str]:");
		expect(emitted).toContain("createdUser: str | dict[str, str] = await createUser(email)");
		expect(emitted).toContain("return createdUser");
		expect(emitted).not.toContain("not supported in Python emit yet");
	});

	test("workflow step options emit retry, timeout, policy, and on failure", () => {
		const program = parsePointSource(`module RetryDemo

policy allowed email
  input email: Text
  require email != ""

action always fail
  input email: Text
  output result: Text or Error
  touches none
  return Error "temporary failure"

workflow signup retry
  input email: Text
  output user: Text or Error
  step verified is await always fail(email)
    retry 3 times
    require policy allowed email
    on failure return Error "Retries exhausted"
  return verified
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("def pointIsError(value) -> bool:");
		expect(emitted).toContain("for __pointAttempt in [0, 1, 2]:");
		expect(emitted).toContain("allowedEmailPolicy");
		expect(emitted).toContain('return {"message": "Retries exhausted"}');
	});

	test("workflow timeout emits asyncio.wait_for helper", () => {
		const program = parsePointSource(`module TimeoutDemo

action always fail
  input email: Text
  output result: Text or Error
  touches none
  return Error "slow"

workflow timed flow
  input email: Text
  output result: Text or Error
  step verified is await always fail(email)
    timeout after 2 seconds
    on failure return Error "Timed out"
  return verified
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("async def pointWorkflowTimedStep(run, ms: int):");
		expect(emitted).toContain("asyncio.wait_for");
		expect(emitted).toContain("pointWorkflowTimedStep(lambda:");
	});

	test("examples/workflow-retry.point emits Python workflow extensions", async () => {
		const source = await Bun.file(join(repoRoot, "examples/workflow-retry.point")).text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("for __pointAttempt in [0, 1, 2]:");
		expect(emitted).toContain("pointWorkflowTimedStep");
		expect(emitted).toContain("canSignupPolicy");
		expect(emitted).not.toContain("not supported in Python emit yet");
	});

	test("build-py CLI writes generated workflow-retry.py", async () => {
		const generated = join(repoRoot, "generated/workflow-retry.py");
		const build = await Bun.$`bun ${pointCli} build-py examples/workflow-retry.point ${generated}`.cwd(repoRoot).quiet();
		expect(build.exitCode).toBe(0);
		const output = await Bun.file(generated).text();
		expect(output).toContain("async def importUserFlowWorkflow");
		expect(output).toContain("pointWorkflowTimedStep");
	});

	test("build-py CLI writes generated process-runner.py", async () => {
		const generated = join(repoRoot, "generated/process-runner.py");
		const build = await Bun.$`bun ${pointCli} build-py examples/tools/process-runner.point ${generated}`.cwd(repoRoot).quiet();
		expect(build.exitCode).toBe(0);
		const output = await Bun.file(generated).text();
		expect(output).toContain("async def processRunnerDemoResult");
		expect(output).toContain("from point_std.process import processSpawn");
		expect(output).toContain("return await spawnRaw(");
		expect(output).not.toContain("not supported in Python emit yet");
	});
});

describe("python command emit", () => {
	test("command blocks emit async function and __main__ entrypoint", () => {
		const program = parsePointSource(`module Commands

command hello cli
  output result: Text
  return "Hello CLI"
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("async def helloCliCommand() -> str:");
		expect(emitted).toContain('return "Hello CLI"');
		expect(emitted).toContain('if __name__ == "__main__":');
		expect(emitted).toContain("asyncio.run(helloCliCommand())");
	});

	test("build-py CLI writes runnable command.py", async () => {
		const generated = join(repoRoot, "generated/command.py");
		const build = await Bun.$`bun ${pointCli} build-py examples/command.point ${generated}`.cwd(repoRoot).quiet();
		expect(build.exitCode).toBe(0);
		const output = await Bun.file(generated).text();
		expect(output).toContain('if __name__ == "__main__":');

		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) {
			console.warn("Python not found — skipping command runtime smoke test");
			return;
		}
		const proc = Bun.spawnSync([pythonPath, generated], { stdout: "pipe", stderr: "pipe" });
		expect(proc.exitCode).toBe(0);
		expect(proc.stdout.toString().trim()).toBe("Hello CLI");
	});
});
