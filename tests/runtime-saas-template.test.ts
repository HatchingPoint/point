import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createPointRuntimeFetchHandler } from "../packages/point/runtime/index.ts";
import { sqlQueryRaw } from "../packages/point/runtime/builtins/sql.ts";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../packages/point/src/core/cli.ts";
import { bundledTemplateDir, RUNTIME_SAAS_APP_TEMPLATE_ID, scaffoldAppFromTemplate } from "../packages/point/src/core/app-cli.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

async function checkedRuntimeSaasProgram() {
	const appPoint = join(bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID), "src/app.point");
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource(appPoint, await Bun.file(appPoint).text(), lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime-saas-app template", () => {
	test("scaffolds as runtime-owned without web or Vite files", async () => {
		const projectDir = mkdtempSync(join(tmpdir(), "point-runtime-saas-scaffold-"));
		try {
			const result = await scaffoldAppFromTemplate("runtime-saas-smoke", {
				cwd: projectDir,
				templateId: RUNTIME_SAAS_APP_TEMPLATE_ID,
			});
			expect(result.templateId).toBe(RUNTIME_SAAS_APP_TEMPLATE_ID);
			expect(existsSync(join(result.targetDir, "point.json"))).toBe(true);
			expect(existsSync(join(result.targetDir, "src/app.point"))).toBe(true);
			expect(existsSync(join(result.targetDir, "web"))).toBe(false);
			const scaffoldedSource = await Bun.file(join(result.targetDir, "src/app.point")).text();
			expect(scaffoldedSource).toContain("capabilities auth sql");
			expect(scaffoldedSource).not.toContain('@hatchingpoint/point/std/');
			expect(scaffoldedSource).not.toContain("external point std");
			const pkg = await Bun.file(join(result.targetDir, "package.json")).json();
			expect(JSON.stringify(pkg)).not.toContain("vite");
			expect(await Bun.file(join(result.targetDir, "point.json")).json()).toMatchObject({ runtime: "owned" });
			await Bun.$`bun ${cli} check src/app.point`.cwd(result.targetDir).quiet();
			const run = await Bun.$`bun ${cli} run src/app.point admin demo`.cwd(result.targetDir).quiet();
			expect(run.stdout.toString().trim()).toBe("Runtime SaaS app ready");

			await Bun.$`bun ${cli} create runtime-saas-cli --template ${RUNTIME_SAAS_APP_TEMPLATE_ID}`.cwd(projectDir).quiet();
			const cliAppDir = join(projectDir, "runtime-saas-cli");
			expect(existsSync(join(cliAppDir, "src/app.point"))).toBe(true);
			expect(existsSync(join(cliAppDir, "web"))).toBe(false);
			const cliScaffoldedSource = await Bun.file(join(cliAppDir, "src/app.point")).text();
			expect(cliScaffoldedSource).toContain("capabilities auth sql");
			expect(cliScaffoldedSource).not.toContain('@hatchingpoint/point/std/');
			expect(cliScaffoldedSource).not.toContain("external point std");
			expect(await Bun.file(join(cliAppDir, "point.json")).json()).toMatchObject({ runtime: "owned" });
		} finally {
			rmSync(projectDir, { recursive: true, force: true });
		}
	}, 60000);

	test("uses runtime SQL and auth middleware through the runtime route handler", async () => {
		const dbRoot = mkdtempSync(join(tmpdir(), "point-runtime-saas-db-"));
		const oldDatabaseUrl = process.env.DATABASE_URL;
		const oldPointSqlDatabase = process.env.POINT_SQL_DATABASE;
		try {
			await mkdir(dbRoot, { recursive: true });
			process.env.DATABASE_URL = `sqlite:${join(dbRoot, "members.db")}`;
			delete process.env.POINT_SQL_DATABASE;

			const init = await Bun.$`bun ${cli} run ${join(bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID), "src/app.point")} init database`
				.cwd(repoRoot)
				.env({ ...process.env, DATABASE_URL: process.env.DATABASE_URL })
				.quiet();
			expect(init.stdout.toString()).toContain("[]");
			expect(sqlQueryRaw("SELECT id FROM members WHERE id = ?", ["u-1"])).toBe('[{"id":"u-1"}]');

			const handler = createPointRuntimeFetchHandler(await checkedRuntimeSaasProgram());
			const unauthenticated = await handler(
				new Request("http://point.test/api/members", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ name: "No Token", role: "Member" }),
				}),
			);
			expect(unauthenticated.status).toBe(401);
			expect(await unauthenticated.json()).toEqual({ error: "unauthorized" });

			const login = await handler(
				new Request("http://point.test/api/login", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ email: "pilot@example.com", password: "demo" }),
				}),
			);
			expect(login.status).toBe(200);
			const { token } = (await login.json()) as { token: string };
			expect(token.split(".")).toHaveLength(3);

			const created = await handler(
				new Request("http://point.test/api/members", {
					method: "POST",
					headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
					body: JSON.stringify({ name: "Runtime Member", role: "Member" }),
				}),
			);
			expect(created.status).toBe(201);
			expect(await created.json()).toMatchObject({ name: "Runtime Member", role: "Member" });

			const listed = await handler(new Request("http://point.test/api/members"));
			expect(listed.status).toBe(200);
			const body = (await listed.json()) as { members: Array<{ name: string }> };
			expect(body.members.some((member) => member.name === "Runtime Member")).toBe(true);
		} finally {
			if (oldDatabaseUrl === undefined) delete process.env.DATABASE_URL;
			else process.env.DATABASE_URL = oldDatabaseUrl;
			if (oldPointSqlDatabase === undefined) delete process.env.POINT_SQL_DATABASE;
			else process.env.POINT_SQL_DATABASE = oldPointSqlDatabase;
			rmSync(dbRoot, { recursive: true, force: true });
		}
	}, 90000);
});
