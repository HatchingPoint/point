import { describe, expect, test } from "bun:test";

import { formatCentsUsd } from "../../packages/point/runtime/builtins/money";
import {
	streamJoinLines,
	streamReadLines,
	streamReadText,
	streamWriteLines,
	streamWriteText,
} from "../../packages/point/runtime/builtins/stream";
import {
	dispatchRuntimeStdCall,
	resolveRuntimeStdBuiltin,
	runtimeStdDispatch,
} from "../../packages/point/runtime/std-dispatch";

describe("runtime money and stream builtins", () => {
	test("formatCentsUsd mirrors std.money currency formatting", () => {
		expect(formatCentsUsd(0)).toBe("$0.00");
		expect(formatCentsUsd(5)).toBe("$0.05");
		expect(formatCentsUsd(1005)).toBe("$10.05");
		expect(formatCentsUsd(-987)).toBe("-$9.87");
		expect(formatCentsUsd(123.9)).toBe("$1.23");
	});

	test("stream text and line helpers mirror std.stream behavior", async () => {
		expect(streamJoinLines([])).toBe("");
		expect(streamJoinLines(["red", "green"])).toBe("red\ngreen\n");
		expect(await streamReadText("alpha\nbeta\n")).toBe("alpha\nbeta\n");
		expect(await streamReadLines("alpha\r\nbeta\n")).toEqual(["alpha", "beta"]);
		expect(await streamWriteText("ignored-string-sink", "contents")).toBeUndefined();
		expect(await streamWriteLines("ignored-string-sink", ["a", "b"])).toBeUndefined();
	});

	test("std dispatch exposes money and stream module exports", async () => {
		expect(Object.keys(runtimeStdDispatch["std.money"]).sort()).toEqual(["formatCentsUsd"]);
		expect(Object.keys(runtimeStdDispatch["std.stream"]).sort()).toEqual([
			"streamJoinLines",
			"streamReadLines",
			"streamReadText",
			"streamWriteLines",
			"streamWriteText",
		]);

		expect(resolveRuntimeStdBuiltin("std.money", "formatCentsUsd")?.(250)).toBe("$2.50");
		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/stream", "streamJoinLines")?.(["x", "y"])).toBe("x\ny\n");
		expect(dispatchRuntimeStdCall("formatCentsUsdRaw", [1234])).toBe("$12.34");
		expect(await dispatchRuntimeStdCall("streamReadLinesRaw", ["one\ntwo\n"])).toEqual(["one", "two"]);
		expect(dispatchRuntimeStdCall("streamJoinLinesRaw", [["one", "two"]])).toBe("one\ntwo\n");
	});
});
