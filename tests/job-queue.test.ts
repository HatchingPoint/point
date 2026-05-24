import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/app/job-queue/job-queue.point";

function pathToFileUrl(path: string): string {
	return `file://${path.replaceAll("\\", "/")}`;
}

describe("job-queue example", () => {
	test("point check succeeds", async () => {
		const result = await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).nothrow().quiet();
		expect(result.exitCode).toBe(0);
	});
});

describe("job-queue HTTP smoke", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let baseUrl = "";
	let outputRoot = "";
	let moduleExports: Record<string, unknown>;
	const previousDatabaseUrl = process.env.DATABASE_URL;

	beforeAll(async () => {
		outputRoot = await mkdtemp(resolve(repoRoot, "tests/tmp/job-queue-integration-"));
		const dbPath = join(outputRoot, "jobs.db");
		process.env.DATABASE_URL = `sqlite:${dbPath}`;
		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		const buildOut = join(outputRoot, "job-queue.js");
		await Bun.$`bun ${pointCli} build ${source} ${buildOut}`.cwd(repoRoot).quiet();
		const generatedSource = await Bun.file(buildOut).text();
		expect(generatedSource).toContain("createPointRouteFetchHandler");
		expect(generatedSource).toContain("getJobRoute");

		moduleExports = await import(pathToFileUrl(buildOut));

		await (moduleExports.initJobsDatabaseCommand as () => Promise<unknown>)();
		server = (moduleExports.startRoutesServer as () => ReturnType<typeof Bun.serve>)();
		baseUrl = `http://localhost:${server.port}`;
	});

	afterAll(async () => {
		server?.stop(true);
		if (outputRoot) await rm(outputRoot, { recursive: true, force: true });
		if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = previousDatabaseUrl;
	});

	test("POST /api/jobs enqueues pending job and GET /api/jobs lists it", async () => {
		const post = await fetch(`${baseUrl}/api/jobs`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "Integration smoke" }),
		});
		expect(post.status).toBe(201);
		const created = (await post.json()) as { id: string; name: string; status: string };
		expect(created.name).toBe("Integration smoke");
		expect(created.status).toBe("pending");

		const list = await fetch(`${baseUrl}/api/jobs`);
		expect(list.status).toBe(200);
		type JobRow = { id: string; name: string; status: string };
		const payload = (await list.json()) as { jobs: JobRow[] };
		expect(payload.jobs.some((job) => job.id === created.id)).toBe(true);
	});

	test("GET /api/jobs/:id wraps job payload", async () => {
		const post = await fetch(`${baseUrl}/api/jobs`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "detail route" }),
		});
		const created = (await post.json()) as { id: string };
		const res = await fetch(`${baseUrl}/api/jobs/${created.id}`);
		expect(res.status).toBe(200);
		const body = (await res.json()) as { job: { id: string; name: string } };
		expect(body.job.id).toBe(created.id);
		expect(body.job.name).toBe("detail route");
	});

	test("GET /api/jobs/:id returns JSON 404 for unknown id", async () => {
		const res = await fetch(`${baseUrl}/api/jobs/does-not-exist`);
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ error: "not found" });
	});

	test("processNextJobWorkflow eventually completes freshly enqueued pending row", async () => {
		const post = await fetch(`${baseUrl}/api/jobs`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "drain me" }),
		});
		const created = (await post.json()) as { id: string; status: string };
		expect(created.status).toBe("pending");

		let rowStatus: string | undefined;
		for (let step = 0; step < 12; step += 1) {
			await (moduleExports.processNextJobWorkflow as () => Promise<unknown>)();
			const list = await fetch(`${baseUrl}/api/jobs`);
			expect(list.status).toBe(200);
			type JobRow = { id: string; status: string };
			const payload = (await list.json()) as { jobs: JobRow[] };
			rowStatus = payload.jobs.find((job) => job.id === created.id)?.status;
			if (rowStatus === "completed") break;
		}
		expect(rowStatus).toBe("completed");
	});
});
