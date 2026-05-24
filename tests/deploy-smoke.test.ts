import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const script = join(repoRoot, "scripts/deploy-smoke.sh");

describe("deploy smoke", () => {
	test("saas login + create member path passes", async () => {
		const result = await Bun.$`bash ${script}`.cwd(repoRoot).nothrow();
		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toContain("PASS");
	}, 120000);
});
