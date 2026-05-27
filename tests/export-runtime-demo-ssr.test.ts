import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");

describe("export runtime demo SSR", () => {
	test("exports readiness and saas HTML fragments from owned runtime", async () => {
		const proc = Bun.spawn(["bun", "scripts/export-runtime-demo-ssr.ts"], {
			cwd: repoRoot,
			stdout: "pipe",
			stderr: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();
		expect(await proc.exited).toBe(0);
		expect(stderr).toBe("");

		const payload = JSON.parse(stdout) as {
			readiness: { formHtml: string; evaluations: Record<string, { score: number }> };
			saas: { membersHtml: string; loginHtml: string };
		};

		expect(payload.readiness.formHtml).toContain("point-form");
		expect(payload.readiness.formHtml).toContain('data-point-field="hasBuildArtifact"');
		expect(Object.keys(payload.readiness.evaluations)).toHaveLength(16);
		expect(payload.readiness.evaluations["1111"].score).toBe(100);
		expect(payload.saas.membersHtml).toContain("point-datagrid");
		expect(payload.saas.membersHtml).toContain("Alex Chen");
		expect(payload.saas.loginHtml).toContain("data-point-form-submit");
	}, 60000);

	test("writes output file when --out is provided", async () => {
		const output = join(repoRoot, ".tmp-runtime-demo-export.json");
		const proc = Bun.spawn(["bun", "scripts/export-runtime-demo-ssr.ts", `--out=${output}`], {
			cwd: repoRoot,
			stdout: "pipe",
			stderr: "pipe",
		});
		expect(await proc.exited).toBe(0);
		const written = JSON.parse(await readFile(output, "utf8")) as { version: number };
		expect(written.version).toBe(1);
	}, 60000);
});
