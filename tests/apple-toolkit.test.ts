import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/toolkit/apple-cli.point";

describe("apple toolkit example", () => {
	test("point check succeeds", async () => {
		const result = await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).nothrow().quiet();
		expect(result.exitCode).toBe(0);
	});
});
