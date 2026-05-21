import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { cryptoJwtSign } from "@hatchingpoint/point/std/crypto";
import { emitPointCorePython } from "../packages/point/src/core/emit-python.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";

const repoRoot = join(import.meta.dir, "..");
const pointCli = join(repoRoot, "packages/point/src/cli.ts");
const source = "examples/api/middleware-demo.point";
const generated = join(repoRoot, "generated/middleware-demo.py");
const demoJwtSecret = "demo-jwt-secret";
const demoJwtPayload = '{"sub":"demo-user"}';
const demoJwtToken = cryptoJwtSign(demoJwtPayload, demoJwtSecret);

async function findFreePort(): Promise<number> {
	const probe = Bun.serve({ port: 0, fetch: () => new Response("ok") });
	const port = probe.port!;
	probe.stop(true);
	return port;
}

async function resolvePythonCommand(): Promise<string | null> {
	for (const candidate of ["python3", "python", "py"]) {
		try {
			const probe = Bun.spawnSync([candidate, "--version"], { stdout: "pipe", stderr: "pipe" });
			if (probe.exitCode === 0) return candidate;
		} catch {
			continue;
		}
	}
	return null;
}

describe("python route emit", () => {
	test("middleware-demo emits stdlib http.server runtime with middleware chain", async () => {
		const program = parsePointSource(await Bun.file(join(repoRoot, source)).text());
		const emitted = emitPointCorePython(program);
		expect(emitted).toContain("from http.server import BaseHTTPRequestHandler, HTTPServer");
		expect(emitted).toContain("def requireAuthMiddleware(");
		expect(emitted).toContain("def auditRequestMiddleware(");
		expect(emitted).toContain("def getItemRoute(");
		expect(emitted).toContain("def create_point_route_handler():");
		expect(emitted).toContain("middleware_result = requireAuthMiddleware(header_record)");
		expect(emitted).toContain("middleware_result = auditRequestMiddleware(header_record)");
		expect(emitted.indexOf("auditRequestMiddleware(header_record)")).toBeGreaterThan(
			emitted.indexOf("requireAuthMiddleware(header_record)"),
		);
		expect(emitted).toContain("query_record = point_query_record(query_params");
		expect(emitted).toContain("body_record = point_body_record(body_bytes");
		expect(emitted).toContain("from point_std.crypto import checkJwtValid as checkJwtValid");
		expect(emitted).not.toContain("not supported in Python emit yet");
	});

	test("build-py CLI writes generated middleware-demo.py", async () => {
		const build = await Bun.$`bun ${pointCli} build-py ${source} ${generated}`.cwd(repoRoot).quiet();
		expect(build.exitCode).toBe(0);
		const output = await Bun.file(generated).text();
		expect(output).toContain("def start_routes_server():");
	});
});

describe("middleware-demo Python HTTP service", () => {
	let serverProcess: ReturnType<typeof Bun.spawn> | null = null;
	let baseUrl = "";

	beforeAll(async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath) return;

		await Bun.$`bun ${pointCli} check ${source}`.cwd(repoRoot).quiet();
		await Bun.$`bun ${pointCli} build-py ${source} ${generated}`.cwd(repoRoot).quiet();

		const port = await findFreePort();
		serverProcess = Bun.spawn(
			[
				pythonPath,
				"-c",
				`import importlib.util, sys
spec = importlib.util.spec_from_file_location("middleware_demo", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.start_routes_server()`,
				generated,
			],
			{ stdout: "ignore", stderr: "pipe", env: { ...process.env, PORT: String(port) } },
		);
		baseUrl = `http://localhost:${port}`;
		for (let attempt = 0; attempt < 30; attempt += 1) {
			if (serverProcess.exitCode !== null) {
				const stderr = await new Response(serverProcess.stderr).text();
				throw new Error(`Python route server exited early${stderr ? `: ${stderr}` : ""}`);
			}
			const probe = await fetch(`${baseUrl}/items?limit=probe`, { signal: AbortSignal.timeout(500) }).catch(() => null);
			if (probe) return;
			await Bun.sleep(100);
		}
		throw new Error("Python route server did not accept connections");
	}, 15000);

	afterAll(() => {
		serverProcess?.kill();
	});

	test("GET /items rejects missing auth via middleware", async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath || !baseUrl) {
			console.warn("Python not found or server not started — skipping HTTP test");
			return;
		}
		const response = await fetch(`${baseUrl}/items?limit=book`);
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "unauthorized" });
	});

	test("GET /items rejects invalid JWT via middleware", async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath || !baseUrl) return;
		const response = await fetch(`${baseUrl}/items?limit=book`, {
			headers: { authorization: "Bearer invalid-token" },
		});
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "unauthorized" });
	});

	test("GET /items returns JSON when auth and query are valid", async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath || !baseUrl) return;
		const response = await fetch(`${baseUrl}/items?limit=book`, {
			headers: { authorization: `Bearer ${demoJwtToken}` },
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ item: "book", authenticated: true });
	});

	test("POST /items accepts typed JSON body after auth", async () => {
		const pythonPath = await resolvePythonCommand();
		if (!pythonPath || !baseUrl) return;
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
