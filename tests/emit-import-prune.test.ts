import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

describe("emit import pruning", () => {
	test("instant-demo JS import lists only referenced time symbols", async () => {
		const output = join(repoRoot, "generated/instant-demo-prune-test.js");
		const result = await Bun.$`bun ${cli} build examples/tools/instant-demo.point ${output}`.cwd(repoRoot).quiet();
		expect(result.exitCode).toBe(0);
		const emitted = readFileSync(output, "utf8");
		expect(emitted).toContain("instantNowValue");
		expect(emitted).toContain("formatInstantLabel");
		expect(emitted).not.toContain("formatInstantInTimezoneLabel");
		expect(emitted).not.toContain("durationFromSecondsDuration");
	});
});
