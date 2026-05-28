import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/api/middleware-demo.point";

describe("route app build", () => {
	test("point build inlines capabilities into self-contained JS", async () => {
		const outputRoot = await mkdtemp(resolve(repoRoot, "tests/tmp/route-build-"));
		const output = join(outputRoot, "middleware-demo.js");
		try {
			await Bun.$`bun ${cli} build ${source} ${output}`.cwd(repoRoot).quiet();
			const emitted = await Bun.file(output).text();
			expect(emitted).toContain("export function startRoutesServer");
			expect(emitted).toContain("createPointRouteFetchHandler");
		} finally {
			await rm(outputRoot, { recursive: true, force: true });
		}
	});
});
