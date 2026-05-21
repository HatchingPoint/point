import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { cryptoJwtSign } from "@hatchingpoint/point/std/crypto";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../packages/point/src/core/emit-javascript.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/api/middleware-demo.point";
const generated = join(repoRoot, "generated/middleware-demo.js");
const demoJwtSecret = "demo-jwt-secret";
const demoJwtPayload = '{"sub":"demo-user"}';
const demoJwtToken = cryptoJwtSign(demoJwtPayload, demoJwtSecret);

describe("middleware routes", () => {
	test("rejects non-record query input at check time", () => {
		const program = parsePointSource(`module Broken

route bad query route
  method GET
  path "/items"
  input query: Text
  output response: Text
  return "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "invalid-route-input")).toBe(true);
	});

	test("rejects unknown middleware references", () => {
		const program = parsePointSource(`module Broken

middleware require auth
  input headers: Auth Headers
  output response: Maybe Text
  otherwise return none

record Auth Headers
  authorization: Text

route get item
  method GET
  path "/items"
  before missing middleware
  input headers: Auth Headers
  output response: Text
  return "ok"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-middleware")).toBe(true);
	});

	test("emits middleware chain before route handler", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, source)).text());
		const emitted = emitPointCoreJavaScript(program);
		const authIndex = emitted.indexOf("requireAuthMiddleware(");
		const auditIndex = emitted.indexOf("auditRequestMiddleware(");
		const handlerIndex = emitted.indexOf("getItemRoute(");
		expect(authIndex).toBeGreaterThan(-1);
		expect(auditIndex).toBeGreaterThan(authIndex);
		expect(handlerIndex).toBeGreaterThan(auditIndex);
	});
});

describe("middleware-demo HTTP service", () => {
	let server: ReturnType<typeof Bun.serve> | null = null;
	let baseUrl = "";

	beforeAll(async () => {
		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} build ${source} ${generated}`.cwd(repoRoot).quiet();
		const generatedSource = await Bun.file(generated).text();
		expect(generatedSource).toContain("createPointRouteFetchHandler");
		expect(generatedSource).toContain("requireAuthMiddleware");
		const module = await import(generated);
		server = module.startRoutesServer();
		baseUrl = `http://localhost:${server.port}`;
	});

	afterAll(() => {
		server?.stop(true);
	});

	test("GET /items rejects missing auth via middleware", async () => {
		const response = await fetch(`${baseUrl}/items?limit=book`);
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "unauthorized" });
	});

	test("GET /items rejects invalid JWT via middleware", async () => {
		const response = await fetch(`${baseUrl}/items?limit=book`, {
			headers: { authorization: "Bearer invalid-token" },
		});
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "unauthorized" });
	});

	test("GET /items returns JSON when auth and query are valid", async () => {
		const response = await fetch(`${baseUrl}/items?limit=book`, {
			headers: { authorization: `Bearer ${demoJwtToken}` },
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ item: "book", authenticated: true });
	});

	test("POST /items accepts typed JSON body after auth", async () => {
		const response = await fetch(`${baseUrl}/items`, {
			method: "POST",
			headers: {
				authorization: `Bearer ${demoJwtToken}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({ name: "notebook" }),
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ item: "notebook", authenticated: true });
	});
});
