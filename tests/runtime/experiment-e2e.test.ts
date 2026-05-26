import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { startPointRuntimeServer } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const experimentSourcePath = join(repoRoot, "experiments/point-only/src/app.point");

async function checkedExperimentProgram() {
	const source = await readFile(experimentSourcePath, "utf8");
	const program = parsePointSource(source, { cwd: repoRoot, input: experimentSourcePath });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("point-only experiment runtime e2e", () => {
	test("serves SSR page, accepts form submission, and renders rule output", async () => {
		const server = startPointRuntimeServer(await checkedExperimentProgram(), { hostname: "127.0.0.1" });
		try {
			const baseUrl = `http://127.0.0.1:${server.port}`;

			const page = await fetch(baseUrl);
			expect(page.status).toBe(200);
			expect(page.headers.get("content-type")).toContain("text/html");
			const html = await page.text();
			expect(html).toContain("<form");
			expect(html).toContain('name="hasBuildArtifact"');
			expect(html).toContain('name="readiness-result"');

			const navigationPage = await fetch(`${baseUrl}/readiness-ui`);
			expect(navigationPage.status).toBe(200);
			expect(navigationPage.headers.get("content-type")).toContain("text/html");
			const navigationHtml = await navigationPage.text();
			expect(navigationHtml).toContain('href="/readiness-ui"');
			expect(navigationHtml).toContain('href="/readiness"');
			expect(navigationHtml).toContain("Readiness UI");
			expect(navigationHtml).toContain("Readiness JSON");
			expect(navigationHtml).toContain("point-link-active");
			expect(navigationHtml).not.toContain("react-router-dom");
			expect(navigationHtml).not.toContain("NavLink");
			expect(navigationHtml).not.toContain("RouterProvider");

			const form = new URLSearchParams({
				hasBuildArtifact: "true",
				hasPassingChecks: "true",
				hasRollbackPlan: "true",
				hasOwnerApproval: "true",
			});
			const submitted = await fetch(baseUrl, {
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body: form,
			});

			expect(submitted.status).toBe(200);
			expect(submitted.headers.get("content-type")).toContain("text/html");
			const resultHtml = await submitted.text();
			expect(resultHtml).toContain('data-score="100"');
			expect(resultHtml).toContain('data-label="ready"');
			expect(resultHtml).toContain('data-tone="positive"');
			expect(resultHtml).toContain("100 ready positive");
		} finally {
			server.stop(true);
		}
	});
});
