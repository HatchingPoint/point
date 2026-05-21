import { resolve } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import type { PointCoreFunctionDeclaration, PointCoreProgram } from "./ast.ts";
import { checkPointCore } from "./check.ts";
import {
	createModuleGraphForFile,
	jsOutputFor,
	loadCoreFile,
	orderByDependencies,
	programWithDependencyDeclarations,
} from "./cli.ts";
import { detectDevMode } from "./dev.ts";
import { emitPointCoreJavaScript } from "./emit-javascript.ts";
import { readPointLock } from "./packages.ts";

export interface PointIntegrationTestResult {
	file: string;
	ok: boolean;
	baseUrl: string;
	tests: Array<{ name: string; ok: boolean; error?: string }>;
}

export function isIntegrationTestName(name: string): boolean {
	const normalized = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
	return normalized.startsWith("integration test");
}

export function findIntegrationTests(program: PointCoreProgram): PointCoreFunctionDeclaration[] {
	return program.declarations.filter(
		(declaration): declaration is PointCoreFunctionDeclaration =>
			declaration.kind === "function" &&
			declaration.returnType.name === "Bool" &&
			isIntegrationTestName(declaration.semantic?.name ?? declaration.name),
	);
}

export function supportsIntegrationTests(program: PointCoreProgram): boolean {
	return detectDevMode(program).kind === "routes";
}

function pathToFileUrl(path: string): string {
	return `file://${path.replaceAll("\\", "/")}`;
}

export async function runPointIntegrationTests(input: string, cwd = process.cwd()): Promise<PointIntegrationTestResult> {
	const normalizedInput = input.replaceAll("\\", "/");
	const lock = await readPointLock(cwd);
	const coreFile = await loadCoreFile(normalizedInput, lock, cwd);
	const graph = await createModuleGraphForFile(coreFile, lock, cwd);
	const ordered = orderByDependencies(
		[...graph.values()].map((node) => node.result),
		graph,
	);

	for (const result of ordered) {
		const diagnostics = checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({
			...diagnostic,
			file: result.input,
		}));
		if (diagnostics.length > 0) {
			throw new Error(`Integration test check failed:\n${JSON.stringify({ ok: false, diagnostics }, null, 2)}`);
		}
	}

	const program = programWithDependencyDeclarations(coreFile, graph);
	if (!supportsIntegrationTests(program)) {
		throw new Error("Integration tests require route blocks so Point can start an HTTP server.");
	}

	const tests = findIntegrationTests(program);
	if (tests.length === 0) {
		return { file: normalizedInput, ok: true, baseUrl: "", tests: [] };
	}

	await Bun.$`mkdir -p ${resolve(cwd, ".point-cache")}`.quiet();
	const outputRoot = await mkdtemp(resolve(cwd, ".point-cache", "integration-"));
	try {
		const emittedProgram = programWithDependencyDeclarations(coreFile, graph);
		const jsOutput = resolve(outputRoot, `${jsOutputFor(normalizedInput).split("/").pop()}`);
		await Bun.write(jsOutput, emitPointCoreJavaScript(emittedProgram));
		const mod = await import(pathToFileUrl(jsOutput));
		if (typeof mod.startRoutesServer !== "function") {
			throw new Error("Generated module is missing startRoutesServer(). Define routes and a serve command.");
		}

		const server = mod.startRoutesServer();
		const baseUrl = `http://127.0.0.1:${server.port}`;
		const results = [];

		try {
			for (const test of tests) {
				try {
					const candidate = mod[test.name];
					if (typeof candidate !== "function") {
						throw new Error(`Integration test ${test.name} was not exported.`);
					}
					if (test.params.length === 1) {
						if (test.params[0]?.type.name !== "Text") {
							throw new Error(`Integration test ${test.semantic?.name ?? test.name} must take a Text base-url input.`);
						}
						const value = await candidate(baseUrl);
						results.push({
							name: test.semantic?.name ?? test.name,
							ok: value === true,
							error: value === true ? undefined : "Expected true.",
						});
						continue;
					}
					if (test.params.length === 0) {
						const value = await candidate();
						results.push({
							name: test.semantic?.name ?? test.name,
							ok: value === true,
							error: value === true ? undefined : "Expected true.",
						});
						continue;
					}
					throw new Error(`Integration test ${test.semantic?.name ?? test.name} must take zero inputs or one Text base-url input.`);
				} catch (error) {
					results.push({
						name: test.semantic?.name ?? test.name,
						ok: false,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		} finally {
			server.stop(true);
		}

		return {
			file: normalizedInput,
			ok: results.every((result) => result.ok),
			baseUrl,
			tests: results,
		};
	} finally {
		await rm(outputRoot, { recursive: true, force: true });
	}
}
