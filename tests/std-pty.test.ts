import { describe, expect, test } from "bun:test";
import { ptySpawn, ptyStreamLines } from "@hatchingpoint/point/std/pty";

describe("@hatchingpoint/point std pty runtime", () => {
	test("ptySpawn + ptyStreamLines captures one line from echo", async () => {
		const spawn = await ptySpawn("echo", ["hello pty"], []);
		expect(spawn).not.toMatchObject({ message: expect.any(String) });
		if (!spawn || typeof spawn !== "object" || !("id" in spawn)) {
			expect(spawn).toBeTruthy();
			return;
		}

		const lines: string[] = [];
		const iter = ptyStreamLines(spawn);
		while (true) {
			const step = await iter.next();
			if (step.done) {
				if (typeof step.value === "object" && step.value !== null && "message" in step.value) {
					expect(step.value).not.toHaveProperty("message");
				} else {
					const result = step.value as { stderr: string; exitCode: number };
					expect(typeof result.stderr).toBe("string");
					expect(result.stderr).toBe("");
					expect(result.exitCode).toBe(0);
				}
				break;
			}
			lines.push(step.value);
		}
		expect(lines).toEqual(["hello pty"]);
	});

	test("ptyStreamLines yields lines from Bun script stdout", async () => {
		const spawn = await ptySpawn(process.execPath, ["-e", "console.log('alpha'); console.log('beta');"], []);
		expect(spawn).not.toMatchObject({ message: expect.any(String) });
		if (!spawn || typeof spawn !== "object" || !("id" in spawn)) {
			expect(spawn).toBeTruthy();
			return;
		}

		const lines: string[] = [];
		const iter = ptyStreamLines(spawn);
		while (true) {
			const step = await iter.next();
			if (step.done) {
				if (!(typeof step.value === "object" && step.value !== null && "message" in step.value)) {
					const result = step.value as { exitCode: number };
					expect(result.exitCode).toBe(0);
				}
				break;
			}
			const line = step.value.trimEnd();
			if (line.trim().length > 0) lines.push(line.trim());
		}

		expect(lines).toContain("alpha");
		expect(lines).toContain("beta");
	});

	test("ptySpawn returns Point error shape for missing command", async () => {
		const spawn = await ptySpawn("point-missing-pty-command-xyz", [], []);
		expect(spawn).toEqual({ message: expect.any(String) });
	});
});
