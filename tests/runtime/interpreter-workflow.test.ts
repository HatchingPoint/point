import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { interpretCoreProgramEntryAsync } from "../../packages/point/runtime/interpreter/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../../packages/point/src/core/cli.ts";
import { bundledTemplateDir, RUNTIME_SAAS_APP_TEMPLATE_ID } from "../../packages/point/src/core/app-cli.ts";
import { readPointLock } from "../../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..", "..");

async function checkedRuntimeSaasProgram() {
	const appPoint = join(bundledTemplateDir(RUNTIME_SAAS_APP_TEMPLATE_ID), "src/app.point");
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource(appPoint, await Bun.file(appPoint).text(), lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime interpreter workflow coverage", () => {
	test("runtime-saas init members db workflow runs through interpreter", async () => {
		const dbRoot = mkdtempSync(join(tmpdir(), "point-workflow-db-"));
		const previousDatabaseUrl = process.env.DATABASE_URL;
		const previousJwtSecret = process.env.JWT_SECRET;
		process.env.DATABASE_URL = `sqlite:${join(dbRoot, "members.db")}`;
		process.env.JWT_SECRET = "workflow-test-secret";
		try {
			const result = await interpretCoreProgramEntryAsync(await checkedRuntimeSaasProgram(), "initDatabaseCommand");
			expect(result).toBe("[]");
		} finally {
			if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
			else process.env.DATABASE_URL = previousDatabaseUrl;
			if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
			else process.env.JWT_SECRET = previousJwtSecret;
			rmSync(dbRoot, { recursive: true, force: true });
		}
	});
});
