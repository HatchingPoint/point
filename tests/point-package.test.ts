import { describe, expect, test } from "bun:test";
import { cp, mkdir } from "node:fs/promises";
import { readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const packageDir = join(repoRoot, "packages/point");

function listPackedFiles(root: string, prefix = ""): string[] {
	const entries: string[] = [];
	for (const name of readdirSync(join(root, prefix), { withFileTypes: true })) {
		const rel = prefix ? `${prefix}/${name.name}` : name.name;
		if (name.isDirectory()) entries.push(...listPackedFiles(root, rel));
		else entries.push(rel.replaceAll("\\", "/"));
	}
	return entries;
}

describe("@hatchingpoint/point npm package", () => {
	test("npm pack ships runtime templates but not legacy emit/Vite templates", async () => {
		const packDir = join(tmpdir(), `point-pack-${Date.now()}`);
		const pack = await Bun.$`npm pack --json`.cwd(packageDir).quiet();
		const parsed = JSON.parse(pack.stdout.toString()) as Array<{ filename: string }>;
		expect(parsed.length).toBe(1);
		const tarball = join(packageDir, parsed[0].filename);
		await mkdir(packDir, { recursive: true });
		await Bun.$`tar -xf ${tarball} -C ${packDir}`.quiet();
		const packedRoot = join(packDir, "package");
		const packedNames = listPackedFiles(packedRoot);

		expect(packedNames.some((path) => path.startsWith("templates/runtime-app/"))).toBe(true);
		expect(packedNames.some((path) => path.startsWith("templates/runtime-saas-app/"))).toBe(true);
		expect(packedNames.some((path) => path.startsWith("templates/full-stack-app/"))).toBe(false);
		expect(packedNames.some((path) => path.startsWith("templates/saas-app/"))).toBe(false);
		expect(packedNames.some((path) => path.startsWith("templates/vercel-app/"))).toBe(false);

		rmSync(tarball, { force: true });
		rmSync(packDir, { recursive: true, force: true });
	}, 60000);

	test("npm-style layout without legacy templates rejects legacy scaffold", async () => {
		const projectDir = join(tmpdir(), `point-mini-pack-${Date.now()}`);
		const miniPackage = join(projectDir, "mini-point");
		await mkdir(join(miniPackage, "templates/runtime-app/src"), { recursive: true });
		await mkdir(join(miniPackage, "templates/runtime-saas-app/src"), { recursive: true });
		await cp(join(repoRoot, "packages/point/src"), join(miniPackage, "src"), { recursive: true });
		await cp(join(repoRoot, "packages/point/runtime"), join(miniPackage, "runtime"), { recursive: true });
		await cp(join(repoRoot, "packages/point/templates/runtime-app/src/app.point"), join(miniPackage, "templates/runtime-app/src/app.point"));
		await cp(join(repoRoot, "packages/point/templates/runtime-app/point.json"), join(miniPackage, "templates/runtime-app/point.json"));
		await cp(
			join(repoRoot, "packages/point/templates/runtime-saas-app/src/app.point"),
			join(miniPackage, "templates/runtime-saas-app/src/app.point"),
		);
		await cp(
			join(repoRoot, "packages/point/templates/runtime-saas-app/point.json"),
			join(miniPackage, "templates/runtime-saas-app/point.json"),
		);

		const appCliPath = join(miniPackage, "src/core/app-cli.ts").replaceAll("\\", "/");
		const { listAppTemplates, scaffoldAppFromTemplate } = await import(appCliPath);
		expect(listAppTemplates().map((template) => template.id)).toEqual(["runtime-app", "runtime-saas-app"]);
		await expect(
			scaffoldAppFromTemplate("blocked", {
				cwd: projectDir,
				templateId: "saas-app",
			}),
		).rejects.toThrow(/Unknown template/);

		rmSync(projectDir, { recursive: true, force: true });
	});
});
