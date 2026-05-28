import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { removedLegacyAppHostMessage } from "../packages/point/src/core/runtime-project.ts";

const repoRoot = join(import.meta.dir, "..");
const cli = join(repoRoot, "packages/point/src/cli.ts");

describe("point build-app", () => {
	test("point build-app is removed", async () => {
		const projectDir = mkdtempSync(join(tmpdir(), "point-build-app-"));
		try {
			mkdirSync(join(projectDir, "web"), { recursive: true });
			writeFileSync(join(projectDir, "web/vite.config.js"), "export default {};\n");
			writeFileSync(join(projectDir, "app.point"), "module Demo\ncommand demo\n  output text: Text\n  return \"ok\"\n");
			const result = await Bun.$`bun ${cli} build-app app.point`.cwd(projectDir).quiet().nothrow();
			expect(result.exitCode).not.toBe(0);
			expect(result.stderr.toString()).toContain(removedLegacyAppHostMessage("point build-app"));
		} finally {
			rmSync(projectDir, { recursive: true, force: true });
		}
	});
});
