import { describe, expect, test } from "bun:test";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

type TemplateEntry = {
	path: string;
	absolutePath: string;
	isDirectory: boolean;
};

const runtimeOwnedTemplates = [
	"packages/point/templates/runtime-app",
	"packages/point/templates/runtime-saas-app",
];

async function listTemplateEntries(root: string): Promise<TemplateEntry[]> {
	const entries: TemplateEntry[] = [];

	async function walk(directory: string) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const absolutePath = join(directory, entry.name);
			const relativePath = relative(root, absolutePath).split(sep).join("/");
			entries.push({ path: relativePath, absolutePath, isDirectory: entry.isDirectory() });
			if (entry.isDirectory()) await walk(absolutePath);
		}
	}

	await walk(root);
	return entries.sort((left, right) => left.path.localeCompare(right.path));
}

describe("runtime-owned template author surface", () => {
	test.each(runtimeOwnedTemplates)("%s contains no std externals, author TypeScript, or Vite config", async (templateRoot) => {
		const entries = await listTemplateEntries(templateRoot);
		const files = entries.filter((entry) => !entry.isDirectory);

		const forbiddenAuthorFiles = files
			.map((entry) => entry.path)
			.filter((path) => {
				const baseName = path.split("/").at(-1) ?? path;
				return extname(path) === ".ts" || extname(path) === ".tsx" || baseName.startsWith("vite.config.");
			});
		expect(forbiddenAuthorFiles).toEqual([]);

		const forbiddenContent = [];
		for (const file of files) {
			const content = await readFile(file.absolutePath, "utf8");
			if (content.includes("@hatchingpoint/point/std/")) forbiddenContent.push(`${file.path}: @hatchingpoint/point/std/`);
			if (content.includes("external point std")) forbiddenContent.push(`${file.path}: external point std`);
		}
		expect(forbiddenContent).toEqual([]);
	});
});
