import { expect, test } from "bun:test";
import { checkPointCore, emitPointCoreTypeScript, parsePointSource } from "../packages/point/src/core/index.ts";
import { mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

test("workflow step options lower to retry, timeout, policy, and on failure", () => {
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
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("function pointIsError");
	expect(emitted).toContain("for (const __pointAttempt of [0, 1, 2])");
	expect(emitted).toContain("allowedEmailPolicy");
	expect(emitted).toContain('return { message: "Retries exhausted" }');
});

test("workflow timeout emits Promise.race with sleep", () => {
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
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("pointWorkflowTimedStep");
	expect(emitted).toContain("Promise.race");
	expect(emitted).toContain("sleepMilliseconds");
});

test("exhausted workflow retries return on failure value at runtime", async () => {
	const program = parsePointSource(`module RuntimeRetry

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
    on failure return Error "Retries exhausted"
  return verified
`);

	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	const moduleUrl = `data:text/typescript;base64,${Buffer.from(emitted).toString("base64")}`;
	const mod = await import(moduleUrl);
	const result = await mod.signupRetryWorkflow("user@example.com");
	expect(result).toEqual({ message: "Retries exhausted" });
});

test("check-json reports unknown policy on workflow steps", () => {
	const program = parsePointSource(`module BrokenPolicy

workflow bad flow
  input email: Text
  output user: Text or Error
  step verified is await always fail(email)
    require policy missing policy
  return verified

action always fail
  input email: Text
  output result: Text or Error
  touches none
  return Error "nope"
`);

	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-policy")).toBe(true);
	expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-policy")?.repair).toContain("missing policy");
});

test("examples/workflow-retry.point checks and emits workflow extensions", async () => {
	const source = await Bun.file("examples/workflow-retry.point").text();
	const program = parsePointSource(source);
	expect(checkPointCore(program)).toEqual([]);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toContain("for (const __pointAttempt of [0, 1, 2])");
	expect(emitted).toContain("pointWorkflowTimedStep");
	expect(emitted).toContain("canSignupPolicy");
});
