import { describe, expect, test } from "bun:test";
import { Glob } from "bun";

const FIXTURE_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];

async function discoverFixtures(): Promise<string[]> {
	const fixtures = new Set<string>();
	for (const pattern of FIXTURE_PATTERNS) {
		const glob = new Glob(pattern);
		for await (const path of glob.scan({ cwd: process.cwd(), onlyFiles: true })) {
			if (!path.includes("/generated/")) fixtures.add(path.replaceAll("\\", "/"));
		}
	}
	return [...fixtures].sort((a, b) => a.localeCompare(b));
}

describe("Point conformance fixtures", () => {
	test(
		"project check-all and build-all succeed with JavaScript emit",
		async () => {
			const check = await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
			expect(check.exitCode).toBe(0);
			const build = await Bun.$`bun packages/point/src/cli.ts build-all`.quiet();
			expect(build.exitCode).toBe(0);
			const buildTs = await Bun.$`bun packages/point/src/cli.ts build-ts-all`.quiet();
			expect(buildTs.exitCode).toBe(0);
		},
		120_000,
	);

	test(
		"discovered fixtures include core language examples",
		async () => {
			const fixtures = await discoverFixtures();
			expect(fixtures.length).toBeGreaterThan(20);
			expect(fixtures).toContain("examples/math.point");
			expect(fixtures).toContain("examples/cart-total.point");
			expect(fixtures).toContain("examples/app/todo.point");
			expect(fixtures).toContain("examples/adopters/hatchingpoint/store-readiness.point");
			expect(fixtures).toContain("examples/adopters/hatchingpoint/readiness-widget.point");
			expect(fixtures).toContain("examples/adopters/hatchingpoint/readiness-page.point");
			expect(fixtures).toContain("examples/adopters/starter-labs/subscription-tier.point");
			expect(fixtures).toContain("compiler/passes/naming-lint.point");
		},
	);

	test("representative fixtures emit JavaScript via default build", async () => {
		for (const fixture of ["examples/math.point", "examples/cart-total.point", "compiler/passes/naming-lint.point"]) {
			const base = fixture.split("/").pop()?.replace(/\.point$/, "") ?? "program";
			const jsOut = `generated/${base}.js`;
			const build = await Bun.$`bun packages/point/src/cli.ts build ${fixture} ${jsOut}`.quiet();
			expect(build.exitCode).toBe(0);
			const generated = await Bun.file(jsOut).text();
			expect(generated).not.toContain(": number");
			expect(generated).not.toContain("interface ");
		}
	});
});
