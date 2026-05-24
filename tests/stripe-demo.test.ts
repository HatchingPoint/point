import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const stripeDemo = "examples/billing/stripe-demo.point";

describe("stripe billing example", () => {
	test("stripe-demo.point checks clean", async () => {
		const result = await Bun.$`bun ${cli} check ${stripeDemo}`.cwd(repoRoot).quiet();
		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toContain("check passed");
	});
});
