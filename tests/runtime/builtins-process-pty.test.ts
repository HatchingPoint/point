import { describe, expect, test } from "bun:test";

import {
	dispatchRuntimeStdCall,
	processSpawn,
	processStreamLines,
	ptySpawn,
	ptyStreamLines,
	ptyWrite,
	resolveRuntimeStdBuiltin,
	runtimeStdDispatch,
} from "../../packages/point/runtime/index.ts";

async function collectAsyncLines<TReturn>(generator: AsyncGenerator<string, TReturn, unknown>): Promise<{ lines: string[]; result: TReturn }> {
	const lines: string[] = [];
	while (true) {
		const next = await generator.next();
		if (next.done) return { lines, result: next.value };
		lines.push(next.value);
	}
}

describe("runtime process and pty builtins", () => {
	test("process helpers mirror std.process spawn and line streaming", async () => {
		const spawned = await processSpawn("echo", ["runtime-process"], []);
		expect(spawned).toMatchObject({ stdout: "runtime-process\n", stderr: "", exitCode: 0 });

		const streamed = await collectAsyncLines(processStreamLines("echo", ["runtime-stream"], []));
		expect(streamed.lines).toEqual(["runtime-stream"]);
		expect(streamed.result).toMatchObject({ stderr: "", exitCode: 0 });
	});

	test("pty helpers expose a runtime-owned session surface", async () => {
		const handle = await ptySpawn("echo", ["runtime-pty"], []);
		expect(handle).toEqual({ id: expect.any(String) });
		if ("message" in handle) throw new Error(handle.message);

		const streamed = await collectAsyncLines(ptyStreamLines(handle));
		expect(streamed.lines.join("\n")).toContain("runtime-pty");
		expect(streamed.result).toMatchObject({ exitCode: 0 });

		const writeAfterClose = await ptyWrite(handle, "ignored");
		expect(writeAfterClose).toEqual({ message: "Unknown or closed pty handle" });
	});

	test("std dispatch exposes process and pty raw imports", async () => {
		expect(Object.keys(runtimeStdDispatch["std.process"]).sort()).toEqual(["processSpawn", "processStreamLines"]);
		expect(Object.keys(runtimeStdDispatch["std.pty"]).sort()).toEqual(["ptySpawn", "ptyStreamLines", "ptyWrite"]);

		expect(resolveRuntimeStdBuiltin("@hatchingpoint/point/std/process", "processSpawn")).toBe(processSpawn);
		expect(resolveRuntimeStdBuiltin("std.pty", "ptySpawn")).toBe(ptySpawn);

		const dispatched = await dispatchRuntimeStdCall("processSpawn", ["echo", ["dispatch-process"], []]);
		expect(dispatched).toMatchObject({ stdout: "dispatch-process\n", exitCode: 0 });
	});
});
