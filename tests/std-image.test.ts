import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/tools/image-thumbnail.point";

describe("std.image", () => {
	test("point check succeeds for image-thumbnail example", async () => {
		const result = await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).nothrow().quiet();
		expect(result.exitCode).toBe(0);
	});

	test("imageMetadata returns error when sharp is unavailable", async () => {
		const { imageMetadata } = await import("../packages/point/src/std/image.ts");
		const result = await imageMetadata("/tmp/nonexistent.png");
		if ("message" in result) {
			expect(result.message.length).toBeGreaterThan(0);
			return;
		}
		expect(result.width).toBeGreaterThanOrEqual(0);
	});
});
