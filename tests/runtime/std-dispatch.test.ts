import { describe, expect, test } from "bun:test";

import {
	dispatchRuntimeStdCall,
	resolveRuntimeStdBuiltin,
	runtimeStdDispatch,
	type PointRuntimeStdModule,
} from "../../packages/point/runtime/std-dispatch";

const expectedModules: PointRuntimeStdModule[] = ["std.text", "std.json", "std.http", "std.time", "std.auth", "std.sql"];

describe("runtime std dispatch", () => {
	test("exposes runtime-owned dispatch tables for std.text, std.json, std.http, std.time, std.auth, and std.sql", () => {
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
	});

	test("resolves std external import aliases to runtime builtin functions", () => {
		expect(resolveRuntimeStdBuiltin("std.text", "textTrim")?.("  ready  ")).toBe("ready");
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/json", "jsonStringify")?.('{"b":2}')).toBe('{"b":2}');
		expect(resolveRuntimeStdBuiltin("std.http", "httpAssertStatus")?.('{"status":201,"body":"ok"}', 201)).toBe(true);
		expect(resolveRuntimeStdBuiltin("std.time", "durationFromMinutes")?.(2)).toBe(120);
		expect(resolveRuntimeStdBuiltin("std.auth", "authBearerToken")?.("Bearer token")).toBe("token");
		expect(resolveRuntimeStdBuiltin("std.sql", "sqlJsonRowsList")?.('[{"id":"u-1"}]')).toEqual([{ id: "u-1" }]);
	});

	test("dispatches lowered core call names to std import aliases", () => {
		expect(dispatchRuntimeStdCall("textTrim", ["  ready  "])).toBe("ready");
		expect(dispatchRuntimeStdCall("textFromIntRaw", [42])).toBe("42");
		expect(dispatchRuntimeStdCall("jsonParse", ['{"count":2}'])).toBe('{"count":2}');
		expect(dispatchRuntimeStdCall("durationFromSecondsRaw", [90])).toBe(90);
		expect(dispatchRuntimeStdCall("authUnauthorizedJson", [])).toBe('{"error":"unauthorized"}');
		expect(dispatchRuntimeStdCall("sqlJsonMemberRow", ['[{"id":"m-1","name":"New","role":"Member"}]'])).toEqual({
			id: "m-1",
			name: "New",
			role: "Member",
		});
	});

	test("returns undefined for std modules and functions not owned by this dispatch table", () => {
		expect(resolveRuntimeStdBuiltin("std.crypto", "cryptoSha256")).toBeUndefined();
		expect(resolveRuntimeStdBuiltin("std.text", "missingBuiltin")).toBeUndefined();
		expect(dispatchRuntimeStdCall("missingBuiltin", [])).toBeUndefined();
	});
});
