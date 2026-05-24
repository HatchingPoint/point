import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cryptoJwtSign } from "@hatchingpoint/point/std/crypto";
import { sqlQueryRaw, sqlJsonRowsList } from "@hatchingpoint/point/std/sql";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "packages/point/templates/saas-app/src/app.point";
const demoJwtSecret = "demo-jwt-secret-change-me";
const demoJwtPayload = '{"sub":"demo-user"}';
const demoJwtToken = cryptoJwtSign(demoJwtPayload, demoJwtSecret);

function pathToFileUrl(path: string): string {
	return `file://${path.replaceAll("\\", "/")}`;
}

describe("saas-app HTTP service", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let baseUrl = "";
	let outputRoot = "";
	let dbPath = "";
	const previousDatabaseUrl = process.env.DATABASE_URL;

	beforeAll(async () => {
		outputRoot = await mkdtemp(resolve(repoRoot, "tests/tmp/saas-integration-"));
		dbPath = join(outputRoot, "members.db");
		process.env.DATABASE_URL = `sqlite:${dbPath}`;

		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		const buildOut = join(outputRoot, "saas-app.js");
		await Bun.$`bun ${pointCli} build ${source} ${buildOut}`.cwd(repoRoot).quiet();
		const generatedSource = await Bun.file(buildOut).text();
		expect(generatedSource).toContain("createPointRouteFetchHandler");
		expect(generatedSource).toContain("requireAuthMiddleware");
		expect(generatedSource).not.toContain('from "./auth"');

		const module = await import(pathToFileUrl(buildOut));
		await module.initDatabaseCommand();
		server = module.startRoutesServer();
		baseUrl = `http://localhost:${server.port}`;
	});

	afterAll(async () => {
		server?.stop(true);
		if (outputRoot) await rm(outputRoot, { recursive: true, force: true });
		if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = previousDatabaseUrl;
	});

	test("sqlJsonRowsList decodes sqlQueryRaw member rows", () => {
		process.env.DATABASE_URL = `sqlite:${dbPath}`;
		const raw = sqlQueryRaw("SELECT id, name, role FROM members ORDER BY name", []);
		expect(typeof raw).toBe("string");
		const rows = sqlJsonRowsList(raw);
		expect(Array.isArray(rows)).toBe(true);
		expect((rows as Array<{ name: string }>).some((row) => row.name === "Alex Chen")).toBe(true);
	});

	test("GET /api/health returns ok", async () => {
		const response = await fetch(`${baseUrl}/api/health`);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("ok");
	});

	test("GET /api/members returns DB-seeded members", async () => {
		const response = await fetch(`${baseUrl}/api/members`);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { members: Array<{ id: string; name: string; role: string }> };
		expect(body.members).toEqual([
			{ id: "u-1", name: "Alex Chen", role: "Owner" },
			{ id: "u-2", name: "Jordan Lee", role: "Admin" },
			{ id: "u-3", name: "Sam Rivera", role: "Member" },
		]);
	});

	test("POST /api/members rejects missing auth via middleware", async () => {
		const response = await fetch(`${baseUrl}/api/members`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "New Member", role: "Member" }),
		});
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "unauthorized" });
	});

	test("POST /api/login returns JWT token", async () => {
		const response = await fetch(`${baseUrl}/api/login`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: "pilot@example.com", password: "demo" }),
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as { token: string };
		expect(typeof body.token).toBe("string");
		expect(body.token.length).toBeGreaterThan(10);
	});

	test("POST /api/members persists member and GET lists it", async () => {
		const response = await fetch(`${baseUrl}/api/members`, {
			method: "POST",
			headers: {
				authorization: `Bearer ${demoJwtToken}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({ name: "New Member", role: "Member" }),
		});
		expect(response.status).toBe(201);
		const created = (await response.json()) as { id: string; name: string; role: string };
		expect(created.name).toBe("New Member");
		expect(created.role).toBe("Member");
		expect(created.id.length).toBeGreaterThan(0);
		expect(created.id).not.toBe("new");

		const list = await fetch(`${baseUrl}/api/members`);
		expect(list.status).toBe(200);
		const body = (await list.json()) as { members: Array<{ name: string }> };
		expect(body.members.length).toBe(4);
		expect(body.members.some((member) => member.name === "New Member")).toBe(true);
	});
});
