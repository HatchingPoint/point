import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";

import { startPointRuntimeServer } from "../packages/point/runtime/server.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../packages/point/src/core/cli.ts";
import { bundledTemplateDir, RUNTIME_SAAS_APP_TEMPLATE_ID } from "../packages/point/src/core/app-cli.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");
const script = join(repoRoot, "scripts/deploy-smoke.sh");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const source = join(bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID), "src/app.point");

async function hasBash(): Promise<boolean> {
	const result = await Bun.$`bash --version`.nothrow().quiet();
	return result.exitCode === 0;
}

async function runPortableSmoke(): Promise<string> {
	const tmpRoot = join(repoRoot, "tests/tmp");
	await mkdir(tmpRoot, { recursive: true });
	const smokeDir = await mkdtemp(join(tmpRoot, "point-deploy-smoke-"));
	const dbPath = join(smokeDir, "members.db");
	await Bun.$`bun ${cli} run ${source} init database`
		.cwd(repoRoot)
		.env({ DATABASE_URL: `sqlite:${dbPath}`, JWT_SECRET: "deploy-smoke-secret" })
		.quiet();

	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource(source, await Bun.file(source).text(), lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);

	const previousDatabaseUrl = process.env.DATABASE_URL;
	const previousJwtSecret = process.env.JWT_SECRET;
	process.env.DATABASE_URL = `sqlite:${dbPath}`;
	process.env.JWT_SECRET = "deploy-smoke-secret";
	const server = startPointRuntimeServer(program, { hostname: "127.0.0.1" });
	try {
		const base = `http://127.0.0.1:${server.port}`;
		expect(await (await fetch(`${base}/api/health`)).text()).toBe("ok");

		const loginResponse = await fetch(`${base}/api/login`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: "pilot@example.com", password: "demo" }),
		});
		const login = (await loginResponse.json()) as { token?: string };
		expect(login.token).toBeTruthy();

		const createResponse = await fetch(`${base}/api/members`, {
			method: "POST",
			headers: { authorization: `Bearer ${login.token}`, "content-type": "application/json" },
			body: JSON.stringify({ name: "Deploy Smoke", role: "Member" }),
		});
		expect(await createResponse.text()).toContain("Deploy Smoke");

		const members = await (await fetch(`${base}/api/members`)).text();
		expect(members).toContain("Deploy Smoke");
		expect(members).toContain("Alex Chen");
		return "[deploy-smoke] PASS";
	} finally {
		server.stop(true);
		if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = previousDatabaseUrl;
		if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
		else process.env.JWT_SECRET = previousJwtSecret;
	}
}

describe("deploy smoke", () => {
	test("runtime saas login + create member path passes", async () => {
		if (await hasBash()) {
			const result = await Bun.$`bash ${script}`.cwd(repoRoot).nothrow();
			expect(result.exitCode).toBe(0);
			expect(result.stdout.toString()).toContain("PASS");
			return;
		}
		expect(await runPortableSmoke()).toContain("PASS");
	}, 120000);
});
