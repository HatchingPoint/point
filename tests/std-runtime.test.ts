import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { describe, expect, test } from "bun:test";
import { envGet } from "@hatchingpoint/point/std/env";
import { readFile, writeFile } from "@hatchingpoint/point/std/fs";
import { httpAssertJsonBody, httpAssertStatus, httpFetch, httpGet, httpPost } from "@hatchingpoint/point/std/http";
import { jsonParse, jsonStringify } from "@hatchingpoint/point/std/json";
import { durationFromSeconds, durationToSeconds, formatTime, now, sleep } from "@hatchingpoint/point/std/time";
import {
	cryptoHmacSha256,
	cryptoJwtIsValid,
	cryptoJwtSign,
	cryptoJwtVerify,
	cryptoSha256,
} from "@hatchingpoint/point/std/crypto";
import { pathBasename, pathDirname, pathExtname, pathIsAbsolute, pathJoin, pathResolve as resolvePath } from "@hatchingpoint/point/std/path";
import { processSpawn } from "@hatchingpoint/point/std/process";
import {
	streamJoinLines,
	streamReadLines,
	streamReadText,
	streamWriteLines,
	streamWriteText,
} from "@hatchingpoint/point/std/stream";
import { textContains, textLength, textSplit, textTrim } from "@hatchingpoint/point/std/text";
import { yamlParse, yamlStringify } from "@hatchingpoint/point/std/yaml";
import { sqlJsonRowsList, sqlQueryRaw } from "@hatchingpoint/point/std/sql";

describe("@hatchingpoint/point std runtime shims", () => {
	test("jsonParse and jsonStringify round-trip JSON text", () => {
		const input = '{"name":"Point","count":2}';
		expect(jsonParse(input)).toBe(input);
		expect(jsonStringify(input)).toBe(input);
	});

	test("jsonParse returns Point error shape on invalid JSON", () => {
		const result = jsonParse("{");
		expect(result).toEqual({ message: expect.any(String) });
	});

  test("httpFetch, httpAssertStatus, and httpAssertJsonBody support integration snapshots", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('{"ok":true}', { status: 201, statusText: "Created" });
    try {
      const snapshot = await httpFetch("https://example.test/items", '{"method":"POST","body":"{}"}');
      expect(httpAssertStatus(snapshot, 201)).toBe(true);
      expect(httpAssertJsonBody(snapshot, '{"ok":true}')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("httpGet and httpPost use fetch and return response text", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (input, init) => {
			const url = String(input);
			if (url === "https://example.test/get") {
				return new Response("get-ok", { status: 200 });
			}
			if (url === "https://example.test/post" && init?.method === "POST") {
				const body = typeof init.body === "string" ? init.body : "";
				return new Response(`post:${body}`, { status: 200 });
			}
			return new Response("missing", { status: 404, statusText: "Not Found" });
		};

		try {
			expect(await httpGet("https://example.test/get")).toBe("get-ok");
			expect(await httpPost("https://example.test/post", "payload")).toBe("post:payload");
			expect(await httpGet("https://example.test/missing")).toEqual({ message: "HTTP 404: Not Found" });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("crypto helpers match known sha256 and hmac vectors", () => {
		expect(cryptoSha256("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
		expect(cryptoHmacSha256("The quick brown fox jumps over the lazy dog", "key")).toBe(
			"f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
		);
	});

	test("crypto jwt sign and verify round-trip with bearer prefix", () => {
		const secret = "demo-jwt-secret";
		const payload = '{"sub":"demo-user","role":"reader"}';
		const token = cryptoJwtSign(payload, secret);
		expect(cryptoJwtIsValid(`Bearer ${token}`, secret)).toBe(true);
		expect(cryptoJwtVerify(`Bearer ${token}`, secret)).toBe(payload);
		expect(cryptoJwtIsValid("Bearer not-a-jwt", secret)).toBe(false);
		expect(cryptoJwtVerify("Bearer not-a-jwt", secret)).toEqual({ message: expect.any(String) });
	});

	test("yamlParse and yamlStringify round-trip YAML text", () => {
		const input = "service:\n  name: demo-api\n  port: 8080\n";
		const parsed = yamlParse(input);
		expect(parsed).toBe('{"service":{"name":"demo-api","port":8080}}');
		expect(yamlStringify(parsed as string)).toBe("service:\n  name: demo-api\n  port: 8080\n");
	});

	test("yamlParse returns Point error shape on invalid YAML", () => {
		const result = yamlParse("service: [\n");
		expect(result).toEqual({ message: expect.any(String) });
	});

	test("stream helpers read and write text and lines", async () => {
		const source = "alpha\nbeta\n";
		expect(await streamReadText(source)).toBe(source);
		expect(await streamReadLines(source)).toEqual(["alpha", "beta"]);
		expect(streamJoinLines(["alpha", "beta"])).toBe("alpha\nbeta\n");

		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode("one\n"));
				controller.enqueue(new TextEncoder().encode("two\n"));
				controller.close();
			},
		});
		expect(await streamReadLines(stream)).toEqual(["one", "two"]);

		let textWritten = "";
		const textSink = new WritableStream<Uint8Array>({
			write(chunk) {
				textWritten += new TextDecoder().decode(chunk);
			},
		});
		expect(await streamWriteText(textSink, "hello\n")).toBeUndefined();
		expect(textWritten).toBe("hello\n");

		let linesWritten = "";
		const linesSink = new WritableStream<Uint8Array>({
			write(chunk) {
				linesWritten += new TextDecoder().decode(chunk);
			},
		});
		expect(await streamWriteLines(linesSink, ["x", "y"])).toBeUndefined();
		expect(linesWritten).toBe("x\ny\n");
	});

	test("path helpers expose basic path operations", () => {
		expect(pathJoin("src", "app.ts")).toBe("src/app.ts");
		expect(pathBasename("/var/log/app.log")).toBe("app.log");
		expect(pathDirname("/var/log/app.log")).toBe("/var/log");
		expect(pathExtname("archive.tar.gz")).toBe(".gz");
		expect(resolvePath("config/settings.json")).toMatch(/config[/\\]settings\.json$/);
		expect(pathIsAbsolute("/tmp/demo")).toBe(true);
		expect(pathIsAbsolute("relative/demo")).toBe(false);
	});

	test("processSpawn captures stdout, stderr, and exit code from echo", async () => {
		const result = await processSpawn("echo", ["hello process"], []);
		expect(result).toEqual({ stdout: "hello process\n", stderr: "", exitCode: 0 });
	});

	test("processSpawn applies child env entries", async () => {
		const shell = process.platform === "win32" ? "cmd" : "sh";
		const args = process.platform === "win32" ? ["/c", "echo %POINT_CHILD_ENV%"] : ["-c", "echo $POINT_CHILD_ENV"];
		const result = await processSpawn(shell, args, ["POINT_CHILD_ENV=ready"]);
		expect(result).toEqual({ stdout: "ready\n", stderr: "", exitCode: 0 });
	});

	test("processSpawn returns Point error shape when command is missing", async () => {
		const result = await processSpawn("point-missing-command-xyz", [], []);
		expect(result).toEqual({ message: expect.any(String) });
	});

	test("text helpers expose basic string operations", () => {
		expect(textLength("Point")).toBe(5);
		expect(textContains("Point language", "lang")).toBe(true);
		expect(textContains("Point language", "json")).toBe(false);
		expect(textSplit("a,b,c", ",")).toEqual(["a", "b", "c"]);
		expect(textTrim("  hello  ")).toBe("hello");
	});

	test("envGet returns process env values or null", () => {
		const key = "POINT_STD_RUNTIME_TEST";
		const original = process.env[key];
		process.env[key] = "ready";
		try {
			expect(envGet(key)).toBe("ready");
			delete process.env[key];
			expect(envGet(key)).toBeNull();
		} finally {
			if (original === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = original;
			}
		}
	});

	test("readFile and writeFile round-trip file contents", () => {
		const dir = mkdtempSync(join(tmpdir(), "point-std-fs-"));
		const path = join(dir, "sample.txt");
		try {
			expect(writeFile(path, "hello fs")).toBeUndefined();
			expect(readFile(path)).toBe("hello fs");
			expect(readFile(join(dir, "missing.txt"))).toEqual({ message: expect.any(String) });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	test("time helpers expose now, sleep, and formatTime", async () => {
		const iso = "2026-05-21T12:00:00.000Z";
		expect(now()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(formatTime(iso)).toBe(new Date(iso).toUTCString());
		expect(formatTime("not-a-date")).toBe("not-a-date");
		expect(durationFromSeconds(900)).toBe(900);
		expect(durationFromSeconds(-2.9)).toBe(-2);
		expect(durationToSeconds(450)).toBe(450);
		const start = Date.now();
		await sleep(10);
		expect(Date.now() - start).toBeGreaterThanOrEqual(5);
	});

	test("sqlQueryRaw runs parameterized SQLite queries and rejects unsafe shapes", () => {
		const previous = process.env.POINT_SQL_DATABASE;
		const dbPath = join(mkdtempSync(join(tmpdir(), "point-std-sql-")), "notes.sqlite");
		process.env.POINT_SQL_DATABASE = dbPath;
		try {
			expect(sqlQueryRaw("CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT)", [])).toBe("[]");
			expect(sqlQueryRaw("INSERT INTO notes (id, title) VALUES (?, ?)", ["n1", "Hello"])).toBe("[]");
			expect(sqlQueryRaw("SELECT id, title FROM notes WHERE id = ?", ["n1"])).toBe('[{"id":"n1","title":"Hello"}]');
			expect(sqlQueryRaw("SELECT id FROM notes WHERE id = ?", ["n1", "extra"])).toEqual({
				message: expect.stringContaining("? placeholders"),
			});
			expect(sqlQueryRaw("SELECT 1; DROP TABLE notes", [])).toEqual({
				message: expect.stringContaining("multiple SQL statements"),
			});
			process.env.POINT_SQL_DATABASE = "postgresql://localhost/demo";
			expect(sqlQueryRaw("SELECT 1", [])).toEqual({
				message: expect.stringContaining("PostgreSQL"),
			});
		} finally {
			rmSync(dirname(dbPath), { recursive: true, force: true });
			if (previous === undefined) {
				delete process.env.POINT_SQL_DATABASE;
			} else {
				process.env.POINT_SQL_DATABASE = previous;
			}
		}
	});

	test("sqlJsonRowsList decodes JSON row arrays from sqlQueryRaw", () => {
		const rows = sqlJsonRowsList('[{"id":"u-1","name":"Alex Chen","role":"Owner"}]');
		expect(rows).toEqual([{ id: "u-1", name: "Alex Chen", role: "Owner" }]);
		expect(sqlJsonRowsList({ message: "bad query" })).toEqual({ message: "bad query" });
		expect(sqlJsonRowsList("{}")).toEqual({ message: "SQL rows JSON must be an array" });
	});
});
