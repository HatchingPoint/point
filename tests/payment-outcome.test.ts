import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const fixture = join(repoRoot, "examples/variants/payment-outcome.point");

test("payment-outcome example parses, checks clean, and build emits variant + charge action", async () => {
	const source = readFileSync(fixture, "utf8");
	const program = parsePointSource(source);
	expect(program.kind).toBe("coreProgram");
	expect(checkPointCore(program)).toEqual([]);
	const jsOut = join(repoRoot, ".tmp/payment-outcome-build.test.js");
	const build = await Bun.$`bun packages/point/src/cli.ts build ${fixture} ${jsOut}`.cwd(repoRoot).quiet();
	expect(build.exitCode).toBe(0);
	const emitted = await Bun.file(jsOut).text();
	expect(emitted).toContain("chargeCardOutcome");
	expect(emitted).toContain("paymentOutcomeForAmountLabel");
	expect(emitted).toContain("outcomeMessageLabel");
	expect(emitted).toContain('"Failed"');
	expect(emitted).toContain('"Succeeded"');
});
