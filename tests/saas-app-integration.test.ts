import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { createPointRuntimeFetchHandler } from "../packages/point/runtime/index.ts";
import { sqlQueryRaw, sqlJsonRowsList } from "../packages/point/runtime/builtins/sql.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../packages/point/src/core/cli.ts";
import { bundledTemplateDir, RUNTIME_SAAS_APP_TEMPLATE_ID } from "../packages/point/src/core/app-cli.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = join(bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID), "src/app.point");

async function checkedRuntimeSaasProgram() {
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource(source, await Bun.file(source).text(), lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime-saas-app HTTP service", () => {
	let handler: ReturnType<typeof createPointRuntimeFetchHandler> | null = null;
	let outputRoot = "";
	let dbPath = "";
	const previousDatabaseUrl = process.env.DATABASE_URL;

	beforeAll(async () => {
		outputRoot = await mkdtemp(resolve(repoRoot, "tests/tmp/runtime-saas-integration-"));
		dbPath = join(outputRoot, "members.db");
		process.env.DATABASE_URL = `sqlite:${dbPath}`;

		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} run ${source} init database`.cwd(repoRoot).env({ ...process.env }).quiet();
		handler = createPointRuntimeFetchHandler(await checkedRuntimeSaasProgram());
	});

	afterAll(async () => {
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
		const response = await handler!(new Request("http://point.test/api/health"));
		expect(response?.status).toBe(200);
		expect(await response!.text()).toBe("ok");
	});

	test("GET /api/members returns DB-seeded members", async () => {
		const response = await handler!(new Request("http://point.test/api/members"));
		expect(response?.status).toBe(200);
		const body = (await response!.json()) as { members: Array<{ id: string; name: string; role: string }> };
		expect(body.members).toEqual([
			{ id: "u-1", name: "Alex Chen", role: "Owner" },
			{ id: "u-2", name: "Jordan Lee", role: "Admin" },
			{ id: "u-3", name: "Sam Rivera", role: "Member" },
		]);
	});

	test("POST /api/members rejects missing auth via middleware", async () => {
		const response = await handler!(
			new Request("http://point.test/api/members", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name: "New Member", role: "Member" }),
			}),
		);
		expect(response?.status).toBe(401);
		expect(await response!.json()).toEqual({ error: "unauthorized" });
	});

	test("POST /api/login returns JWT token", async () => {
		const response = await handler!(
			new Request("http://point.test/api/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "pilot@example.com", password: "demo" }),
			}),
		);
		expect(response?.status).toBe(200);
		const body = (await response!.json()) as { token: string };
		expect(typeof body.token).toBe("string");
		expect(body.token.length).toBeGreaterThan(10);
	});

	test("POST /api/login rejects invalid password", async () => {
		const response = await handler!(
			new Request("http://point.test/api/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "pilot@example.com", password: "wrong" }),
			}),
		);
		expect(response?.status).toBe(401);
		expect(await response!.json()).toEqual({ error: "invalid credentials" });
	});

	test("POST /api/members persists member and GET lists it", async () => {
		const login = await handler!(
			new Request("http://point.test/api/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "pilot@example.com", password: "demo" }),
			}),
		);
		const { token } = (await login!.json()) as { token: string };

		const response = await handler!(
			new Request("http://point.test/api/members", {
				method: "POST",
				headers: {
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({ name: "New Member", role: "Member" }),
			}),
		);
		expect(response?.status).toBe(201);
		const created = (await response!.json()) as { id: string; name: string; role: string };
		expect(created.name).toBe("New Member");
		expect(created.role).toBe("Member");
		expect(created.id.length).toBeGreaterThan(0);

		const list = await handler!(new Request("http://point.test/api/members"));
		expect(list?.status).toBe(200);
		const body = (await list!.json()) as { members: Array<{ name: string }> };
		expect(body.members.length).toBe(4);
		expect(body.members.some((member) => member.name === "New Member")).toBe(true);
	});
});
