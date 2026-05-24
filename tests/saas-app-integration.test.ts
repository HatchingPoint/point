import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cryptoJwtSign } from "@hatchingpoint/point/std/crypto";
import { createModuleGraphForFile, jsOutputFor, loadCoreFile, programWithDependencyDeclarations } from "../packages/point/src/core/cli.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { readPointLock } from "../packages/point/src/core/packages.ts";

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

	beforeAll(async () => {
		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		const lock = await readPointLock(repoRoot);
		const coreFile = await loadCoreFile(source, lock, repoRoot);
		const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
		const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
		outputRoot = await mkdtemp(resolve(repoRoot, "tests/tmp/saas-integration-"));
		const jsOutput = resolve(outputRoot, jsOutputFor(source).split("/").pop()!);
		await Bun.write(jsOutput, emitPointCoreJavaScript(program));
		const generatedSource = await Bun.file(jsOutput).text();
		expect(generatedSource).toContain("createPointRouteFetchHandler");
		expect(generatedSource).toContain("requireAuthMiddleware");
		expect(generatedSource).not.toContain('from "./auth"');
		const module = await import(pathToFileUrl(jsOutput));
		server = module.startRoutesServer();
		baseUrl = `http://localhost:${server.port}`;
	});

	afterAll(async () => {
		server?.stop(true);
		if (outputRoot) await rm(outputRoot, { recursive: true, force: true });
	});

	test("GET /api/health returns ok", async () => {
		const response = await fetch(`${baseUrl}/api/health`);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("ok");
	});

	test("GET /api/members returns seeded members", async () => {
		const response = await fetch(`${baseUrl}/api/members`);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { members: Array<{ name: string }> };
		expect(body.members.length).toBeGreaterThan(0);
		expect(body.members.some((member) => member.name === "Alex Chen")).toBe(true);
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

	test("POST /api/members accepts JSON body after auth", async () => {
		const response = await fetch(`${baseUrl}/api/members`, {
			method: "POST",
			headers: {
				authorization: `Bearer ${demoJwtToken}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({ name: "New Member", role: "Member" }),
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ id: "new", name: "New Member", role: "Member" });
	});
});
