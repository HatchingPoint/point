import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/adopters/hatchingpoint/store-readiness.point";
const generated = join(repoRoot, "generated/store-readiness.js");

describe("store-readiness HTTP service", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let baseUrl = "";

	beforeAll(async () => {
		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} build ${source} ${generated}`.cwd(repoRoot).quiet();
		const generatedSource = await Bun.file(generated).text();
		expect(generatedSource).toContain("createPointRouteFetchHandler");
		expect(generatedSource).toContain("listingStatusPayloadLabel");
		expect(generatedSource).not.toContain("Use generated TS handler");

		const module = await import(generated);
		server = module.startRoutesServer();
		baseUrl = `http://localhost:${server.port}`;
	});

	afterAll(() => {
		server?.stop(true);
	});

	test("GET /health returns ok JSON", async () => {
		const response = await fetch(`${baseUrl}/health`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: "ok" });
	});

	test("GET /apps/demo-app/listing-status returns scored JSON", async () => {
		const response = await fetch(`${baseUrl}/apps/demo-app/listing-status`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			id: "demo-app",
			score: 100,
			status: "Ready to submit",
		});
	});

	test("GET /apps/needs-work/listing-status returns lower score JSON", async () => {
		const response = await fetch(`${baseUrl}/apps/needs-work/listing-status`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			id: "needs-work",
			score: 20,
			status: "Needs work",
		});
	});

	test("unknown app id falls back to needs-work scoring JSON", async () => {
		const response = await fetch(`${baseUrl}/apps/missing/listing-status`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			id: "needs-work",
			score: 20,
			status: "Needs work",
		});
	});

	test("unknown path returns 404 JSON", async () => {
		const response = await fetch(`${baseUrl}/nope`);
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "Not found" });
	});
});
