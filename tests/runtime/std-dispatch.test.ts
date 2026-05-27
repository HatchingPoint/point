import { describe, expect, test } from "bun:test";

import {
	dispatchRuntimeStdCall,
	resolveRuntimeStdBuiltin,
	runtimeStdDispatch,
	type PointRuntimeStdModule,
} from "../../packages/point/runtime/std-dispatch";

const expectedModules: PointRuntimeStdModule[] = [
	"std.text",
	"std.json",
	"std.http",
	"std.time",
	"std.auth",
	"std.sql",
	"std.fs",
	"std.path",
	"std.env",
	"std.crypto",
	"std.yaml",
	"std.money",
	"std.stream",
	"std.process",
	"std.image",
	"std.pty",
	"std.ai",
];

describe("runtime std dispatch", () => {
	test("exposes runtime-owned dispatch tables for runtime std modules", () => {
		expect(Object.keys(runtimeStdDispatch).sort()).toEqual(expectedModules.sort());
		expect(Object.keys(runtimeStdDispatch["std.text"]).sort()).toEqual([
			"textContains",
			"textFromInt",
			"textLength",
			"textPadStart",
			"textSplit",
			"textTrim",
		]);
		expect(Object.keys(runtimeStdDispatch["std.json"]).sort()).toEqual(["jsonParse", "jsonStringify"]);
		expect(Object.keys(runtimeStdDispatch["std.crypto"]).sort()).toEqual([
			"cryptoHmacSha256",
			"cryptoJwtIsValid",
			"cryptoJwtSign",
			"cryptoJwtVerify",
			"cryptoSha256",
		]);
		expect(Object.keys(runtimeStdDispatch["std.yaml"]).sort()).toEqual(["yamlParse", "yamlStringify"]);
		expect(Object.keys(runtimeStdDispatch["std.http"]).sort()).toEqual([
			"httpAssertJsonBody",
			"httpAssertStatus",
			"httpFetch",
			"httpGet",
			"httpPost",
		]);
		expect(Object.keys(runtimeStdDispatch["std.time"]).sort()).toEqual([
			"durationFromMinutes",
			"durationFromSeconds",
			"durationToSeconds",
			"formatInstant",
			"formatInstantInTimezone",
			"formatTime",
			"instantNow",
			"now",
			"parseInstant",
			"sleep",
		]);
		expect(Object.keys(runtimeStdDispatch["std.auth"]).sort()).toEqual([
			"authBearerToken",
			"authJwtOk",
			"authSignJwt",
			"authUnauthorizedJson",
			"authVerifyJwt",
		]);
		expect(Object.keys(runtimeStdDispatch["std.sql"]).sort()).toEqual([
			"sqlJsonMemberRow",
			"sqlJsonRowsList",
			"sqlQueryRaw",
		]);
		expect(Object.keys(runtimeStdDispatch["std.fs"]).sort()).toEqual(["readFile", "writeFile"]);
		expect(Object.keys(runtimeStdDispatch["std.path"]).sort()).toEqual([
			"pathBasename",
			"pathDirname",
			"pathExtname",
			"pathIsAbsolute",
			"pathJoin",
			"pathResolve",
		]);
		expect(Object.keys(runtimeStdDispatch["std.env"]).sort()).toEqual(["envGet"]);
		expect(Object.keys(runtimeStdDispatch["std.process"]).sort()).toEqual(["processSpawn", "processStreamLines"]);
		expect(Object.keys(runtimeStdDispatch["std.image"]).sort()).toEqual(["imageMetadata", "imageResize"]);
		expect(Object.keys(runtimeStdDispatch["std.pty"]).sort()).toEqual(["ptySpawn", "ptyStreamLines", "ptyWrite"]);
		expect(Object.keys(runtimeStdDispatch["std.ai"]).sort()).toEqual([
			"anthropicComplete",
			"anthropicStream",
			"openaiComplete",
			"openaiStream",
		]);
	});

	test("resolves std external import aliases to runtime builtin functions", () => {
		expect(resolveRuntimeStdBuiltin("std.text", "textTrim")?.("  ready  ")).toBe("ready");
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/json", "jsonStringify")?.('{"b":2}')).toBe('{"b":2}');
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/crypto", "cryptoSha256")?.("hello")).toBe(
			"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
		);
		expect(resolveRuntimeStdBuiltin("std.yaml", "yamlParse")?.("name: Point\n")).toBe('{"name":"Point"}');
		expect(resolveRuntimeStdBuiltin("std.http", "httpAssertStatus")?.('{"status":201,"body":"ok"}', 201)).toBe(true);
		expect(resolveRuntimeStdBuiltin("std.time", "durationFromMinutes")?.(2)).toBe(120);
		expect(resolveRuntimeStdBuiltin("std.auth", "authBearerToken")?.("Bearer token")).toBe("token");
		expect(resolveRuntimeStdBuiltin("std.sql", "sqlJsonRowsList")?.('[{"id":"u-1"}]')).toEqual([{ id: "u-1" }]);
		expect(resolveRuntimeStdBuiltin("std.path", "pathBasename")?.("/tmp/app.point")).toBe("app.point");
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/env", "envGet")?.("__POINT_RUNTIME_STD_MISSING__")).toBeNull();
		expect(resolveRuntimeStdBuiltin("std.process", "processSpawn")).toBeTypeOf("function");
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/image", "imageMetadata")).toBeTypeOf("function");
		expect(resolveRuntimeStdBuiltin("std.pty", "ptySpawn")).toBeTypeOf("function");
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/ai", "openaiComplete")).toBeTypeOf("function");
	});

	test("dispatches lowered core call names to std import aliases", async () => {
		expect(dispatchRuntimeStdCall("textTrim", ["  ready  "])).toBe("ready");
		expect(dispatchRuntimeStdCall("textFromIntRaw", [42])).toBe("42");
		expect(dispatchRuntimeStdCall("jsonParse", ['{"count":2}'])).toBe('{"count":2}');
		expect(dispatchRuntimeStdCall("cryptoHmacSha256", ["payload", "secret"])).toBe("b82fcb791acec57859b989b430a826488ce2e479fdf92326bd0a2e8375a42ba4");
		expect(dispatchRuntimeStdCall("yamlStringify", ['{"ok":true}'])).toContain("ok: true");
		expect(dispatchRuntimeStdCall("durationFromSecondsRaw", [90])).toBe(90);
		expect(dispatchRuntimeStdCall("authUnauthorizedJson", [])).toBe('{"error":"unauthorized"}');
		expect(dispatchRuntimeStdCall("sqlJsonMemberRow", ['[{"id":"m-1","name":"New","role":"Member"}]'])).toEqual({
			id: "m-1",
			name: "New",
			role: "Member",
		});
		expect(dispatchRuntimeStdCall("pathExtname", ["src/app.point"])).toBe(".point");
		expect(dispatchRuntimeStdCall("envGetRaw", ["__POINT_RUNTIME_STD_MISSING__"])).toBeNull();
		expect(await dispatchRuntimeStdCall("processSpawn", ["__missing_process__", [], []])).toEqual({ message: expect.any(String) });
		expect(await dispatchRuntimeStdCall("imageResize", ["__missing_image__.png", 1, 1, "png"])).toEqual({ message: expect.any(String) });
		expect(await dispatchRuntimeStdCall("ptySpawn", ["__missing_pty_process__", [], []])).toEqual({ message: expect.any(String) });
		expect(await dispatchRuntimeStdCall("openaiComplete", [null, "prompt", "model"])).toEqual({
			message: "Missing OPENAI_API_KEY - set it with std.env before calling provider actions",
		});
	});

	test("returns undefined for std modules and functions not owned by this dispatch table", () => {
		expect(resolveRuntimeStdBuiltin("std.money", "moneyFormat")).toBeUndefined();
		expect(resolveRuntimeStdBuiltin("std.text", "missingBuiltin")).toBeUndefined();
		expect(dispatchRuntimeStdCall("missingBuiltin", [])).toBeUndefined();
	});
});
