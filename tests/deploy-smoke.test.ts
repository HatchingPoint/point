import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const script = join(repoRoot, "scripts/deploy-smoke.sh");
const cli = join(repoRoot, "packages/point/src/cli.ts");
const source = "packages/point/templates/saas-app/src/app.point";

async function hasBash(): Promise<boolean> {
	const result = await Bun.$`bash --version`.nothrow().quiet();
	return result.exitCode === 0;
}

async function runPortableSmoke(): Promise<string> {
	const tmpRoot = join(repoRoot, "tests/tmp");
	await mkdir(tmpRoot, { recursive: true });
	const smokeDir = await mkdtemp(join(tmpRoot, "point-deploy-smoke-"));
	const buildOut = join(smokeDir, "saas-app.js");
	const dbPath = join(smokeDir, "members.db");
	await Bun.$`bun ${cli} build ${source} ${buildOut}`.cwd(repoRoot).quiet();

	const previousDatabaseUrl = process.env.DATABASE_URL;
	const previousJwtSecret = process.env.JWT_SECRET;
	process.env.DATABASE_URL = `sqlite:${dbPath}`;
	process.env.JWT_SECRET = "deploy-smoke-secret";
	let server: ReturnType<typeof Bun.serve> | null = null;
	try {
		const mod = await import(buildOut);
		await mod.initDatabaseCommand();
		server = mod.startRoutesServer();
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
		server?.stop(true);
		if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = previousDatabaseUrl;
		if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
		else process.env.JWT_SECRET = previousJwtSecret;
	}
}

describe("deploy smoke", () => {
	test("saas login + create member path passes", async () => {
		if (await hasBash()) {
			const result = await Bun.$`bash ${script}`.cwd(repoRoot).nothrow();
			expect(result.exitCode).toBe(0);
			expect(result.stdout.toString()).toContain("PASS");
			return;
		}
		expect(await runPortableSmoke()).toContain("PASS");
	}, 120000);
});
