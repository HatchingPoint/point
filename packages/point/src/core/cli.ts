import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { PointCoreDeclaration, PointCoreProgram } from "./ast.ts";
import { checkPointCore } from "./check.ts";
import { createPointCoreIndex, createPointCoreRepairPlan, explainPointCoreRef } from "./context.ts";
import { createSemanticIndex, explainSemanticRef, mapPublicDiagnostics } from "../semantic/context.ts";
import { emitPointCoreTypeScript } from "./emit-typescript.ts";
import { emitPointCoreJavaScript } from "./emit-javascript.ts";
import { emitPointCorePython, isPureLogicProgram } from "./emit-python.ts";
import { canBundleRunInMemory, executeBundledEntry, bundleJavaScriptForEval } from "./run-bridge.ts";
import { runtimeSourceLocation } from "./source-map.ts";
import { formatPointSource } from "./format.ts";
import { isCacheHit, isIncrementalEnabled, readBuildCache, recordCacheEntry, writeBuildCache } from "./incremental.ts";
import { parsePointSource } from "./parser.ts";
import { runCheckDocs } from "./check-docs.ts";
import { runAppNew } from "./app-cli.ts";
import { addPointDependency, modulePathFromLock, POINT_LOCK, POINT_MANIFEST, readPointLock } from "./packages.ts";
import { runPointLspServer } from "../lsp/server.ts";
import { parseDevCliFlags, runPointDev } from "./dev.ts";
import { runPointIntegrationTests } from "./integration-test.ts";

const DEFAULT_INPUT = "examples/math.point";
const DEFAULT_OUTPUT = "generated/math.ast.json";
const DEFAULT_JS_OUTPUT = "generated/math.js";
const DEFAULT_TS_OUTPUT = "generated/math.ts";
const DEFAULT_PY_OUTPUT = "generated/math.py";
const DEFAULT_PATTERNS = ["examples/**/*.point", "std/**/*.point", "compiler/**/*.point"];
const GENERATED_DIR = "generated";

export async function main() {
	const command = Bun.argv[2] ?? "check";
	const tail = Bun.argv.slice(3);
	let input = tail[0] ?? DEFAULT_INPUT;
	let output = tail[1] ?? DEFAULT_OUTPUT;
	let runFlags: Record<string, boolean | undefined> | undefined;
	let buildProduction = false;
	if (command === "run") {
		const parsed = parseCliFlags(tail);
		runFlags = parsed.flags;
		input = parsed.positional[0] ?? DEFAULT_INPUT;
		output = parsed.positional[1] ?? DEFAULT_OUTPUT;
	}
	if (command === "build" || command === "build-js") {
		const parsed = parseBuildCliFlags(tail);
		buildProduction = parsed.production;
		input = parsed.positional[0] ?? DEFAULT_INPUT;
		output = parsed.positional[1] ?? DEFAULT_JS_OUTPUT;
	}
	if (command === "dev") {
		const parsed = parseDevCliFlags(tail);
		await runPointDev(parsed.positional[0] ?? DEFAULT_INPUT, { port: parsed.port });
		return;
	}
	if (command === "test" && tail[0] === "integration") {
		const integrationInput = tail[1] ?? DEFAULT_INPUT;
		const result = await runPointIntegrationTests(integrationInput);
		console.log(JSON.stringify(result, null, 2));
		if (!result.ok) process.exit(1);
		return;
	}
	if (command.endsWith("-all")) {
		await runProjectCommand(command);
		return;
	}

	if (command === "repl") {
		await runRepl(Bun.argv.slice(3).join(" "));
		return;
	}

	if (command === "lsp") {
		await runPointLspServer();
		return;
	}

	if (command === "check-docs") {
		await runCheckDocs();
		return;
	}

	if (command === "app") {
		const subcommand = Bun.argv[3];
		if (subcommand === "new") {
			const appName = Bun.argv[4];
			const targetDir = Bun.argv[5];
			if (!appName) throw new Error("Usage: point app new <name> [directory]");
			await runAppNew(appName, targetDir);
			return;
		}
		throw new Error("Usage: point app new <name> [directory]");
	}

	if (command === "add") {
		const dependencyName = input;
		const spec = output;
		if (!dependencyName || !spec) {
			throw new Error("Usage: point add <name> <spec>  (spec: workspace:<path> | file:<path> | npm:<package>)");
		}
		const { manifest, lock } = await addPointDependency(dependencyName, spec);
		console.log(`Point add updated ${POINT_MANIFEST} and ${POINT_LOCK}: ${dependencyName} -> ${spec}`);
		console.log(JSON.stringify({ name: manifest.name, dependencies: manifest.dependencies, lockPackages: Object.keys(lock.packages) }, null, 2));
		return;
	}

	const inputPath = resolve(process.cwd(), input);
	const source = await Bun.file(inputPath).text();
	const program = parsePointSource(source);
	const diagnostics = checkPointCore(program);

	if (command === "fmt") {
		await Bun.write(inputPath, formatPointSource(source));
		console.log(`Point fmt wrote ${input}`);
		return;
	}

	if (command === "fmt-check") {
		if (source !== formatPointSource(source)) {
			console.error(`Point fmt check failed: ${input}`);
			process.exit(1);
		}
		console.log(`Point fmt check passed: ${input}`);
		return;
	}

	if (command === "check") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		console.log(`Point core check passed: ${input}`);
		return;
	}

	if (command === "check-json") {
		const outputDiagnostics = mapPublicDiagnostics(program, diagnostics);
		console.log(JSON.stringify({ schemaVersion: "point.core.check.v1", ok: diagnostics.length === 0, diagnostics: outputDiagnostics }, null, 2));
		if (diagnostics.length > 0) process.exit(1);
		return;
	}

	if (command === "index") {
		if (program.semanticSource) {
			console.log(JSON.stringify(createSemanticIndex(program.semanticSource), null, 2));
			return;
		}
		console.log(JSON.stringify(createPointCoreIndex(program), null, 2));
		return;
	}

	if (command === "explain") {
		const ref = output;
		if (program.semanticSource && ref.startsWith("point://semantic/")) {
			console.log(JSON.stringify(explainSemanticRef(program.semanticSource, ref), null, 2));
			return;
		}
		console.log(JSON.stringify(explainPointCoreRef(program, ref), null, 2));
		return;
	}

	if (command === "repair-plan") {
		const outputDiagnostics = mapPublicDiagnostics(program, diagnostics);
		console.log(JSON.stringify(createPointCoreRepairPlan(outputDiagnostics), null, 2));
		if (diagnostics.length > 0) process.exit(1);
		return;
	}

	if (command === "print-ast") {
		console.log(JSON.stringify(program, null, 2));
		return;
	}

	if (command === "build" || command === "build-js") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const outputPath = resolve(process.cwd(), output === DEFAULT_OUTPUT ? DEFAULT_JS_OUTPUT : output);
		await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
		await Bun.write(outputPath, emitPointCoreJavaScript(program, { production: buildProduction }));
		const outputLabel = outputPath.replaceAll("\\", "/");
		console.log(
			buildProduction
				? `Point production JavaScript build wrote ${outputLabel} (optimized emit; use host minifier for final bundle)`
				: `Point core JavaScript build wrote ${outputLabel}`,
		);
		return;
	}

	if (command === "build-ast") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const outputPath = resolve(process.cwd(), output === DEFAULT_OUTPUT ? DEFAULT_OUTPUT : output);
		await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
		await Bun.write(outputPath, `${JSON.stringify(program, null, 2)}\n`);
		console.log(`Point core AST build wrote ${outputPath.replaceAll("\\", "/")}`);
		return;
	}

	if (command === "build-ts") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const outputPath = resolve(process.cwd(), output === DEFAULT_OUTPUT ? DEFAULT_TS_OUTPUT : output);
		await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
		await Bun.write(outputPath, emitPointCoreTypeScript(program, input));
		console.log(`Point core TypeScript build wrote ${outputPath.replaceAll("\\", "/")}`);
		return;
	}

	if (command === "build-py") {
		const lock = await readPointLock();
		const coreFile = await loadCoreFile(input, lock);
		const graph = await createModuleGraphForFile(coreFile, lock);
		const program = programWithDependencyDeclarations(coreFile, graph);
		const buildDiagnostics = checkPointCore(program);
		if (buildDiagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics: buildDiagnostics }, null, 2));
			process.exit(1);
		}
		const outputPath = resolve(process.cwd(), output === DEFAULT_OUTPUT ? DEFAULT_PY_OUTPUT : output);
		await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
		await Bun.write(outputPath, emitPointCorePython(program));
		console.log(`Point core Python build wrote ${outputPath.replaceAll("\\", "/")}`);
		return;
	}

	if (command === "run") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		let entryName: string | null = null;
		const emittedJavaScript = emitPointCoreJavaScript(program);
		let runOutput: string | undefined;
		let useBundle = false;
		try {
			entryName = findRunEntryName(program);
			if (!entryName) throw new Error("No zero-argument entrypoint found. Define an action or calculation with no inputs.");
			useBundle = runFlags?.bundle === true || (runFlags?.bundle !== false && canBundleRunInMemory(program));
			if (runFlags?.bundle === true && !canBundleRunInMemory(program)) {
				throw new Error("Cannot use --bundle: module has imports, externals, or non-pure logic (views, routes, workflows, commands).");
			}
			const value = useBundle
				? await executeBundledEntry(program, entryName)
				: await executeTempModuleRun(program, entryName, emittedJavaScript, (path) => {
						runOutput = path;
					});
			if (value !== undefined) console.log(typeof value === "string" ? value : JSON.stringify(value));
		} catch (error) {
			console.error(
				`Runtime error in ${runtimeSourceLocation(program, input, entryName, error, emittedJavaScript, {
					runtimeScriptPath: runOutput,
					evalBody: useBundle ? bundleJavaScriptForEval(emittedJavaScript).body : undefined,
				})}: ${error instanceof Error ? error.message : String(error)}`,
			);
			process.exit(1);
		}
		return;
	}

	if (command === "test") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const result = await runPointTests(program, input);
		console.log(JSON.stringify(result, null, 2));
		if (!result.ok) process.exit(1);
		return;
	}

	throw new Error(`Unknown point core command: ${command}`);
}

async function runProjectCommand(command: string) {
	const inputs = await discoverInputs();
	if (inputs.length === 0) throw new Error(`No Point core files matched ${DEFAULT_PATTERNS.join(", ")}`);
	const lock = await readPointLock();
	const results = await Promise.all(inputs.map((input) => loadCoreFile(input, lock)));
	const graph = createModuleGraph(results, lock);
	const orderedResults = orderByDependencies(results, graph);

	if (command === "fmt-all") {
		await Promise.all(results.map((result) => Bun.write(resolve(process.cwd(), result.input), formatPointSource(result.source))));
		console.log(`Point fmt wrote ${results.length} files`);
		return;
	}

	if (command === "fmt-check-all") {
		const unformatted = results.filter((result) => result.source !== formatPointSource(result.source));
		if (unformatted.length > 0) {
			console.error(JSON.stringify({ ok: false, unformatted: unformatted.map((result) => result.input) }, null, 2));
			process.exit(1);
		}
		console.log(`Point core fmt check passed: ${results.length} files`);
		return;
	}

	if (command === "check-all") {
		const cache = isIncrementalEnabled() ? await readBuildCache() : null;
		let manifest = cache ?? { schemaVersion: "point.cache.v1" as const, entries: {} };
		const diagnostics = [];
		let skipped = 0;
		for (const result of orderedResults) {
			if (cache && isCacheHit(manifest, result.input, result.source)) {
				skipped += 1;
				continue;
			}
			const fileDiagnostics = checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({
				...diagnostic,
				file: result.input,
			}));
			diagnostics.push(...fileDiagnostics);
			if (cache) manifest = recordCacheEntry(manifest, result.input, result.source, fileDiagnostics.length === 0);
		}
		if (cache) await writeBuildCache(manifest);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		console.log(`Point core check passed: ${results.length} files${skipped ? ` (${skipped} cached)` : ""}`);
		return;
	}

	if (command === "build-all" || command === "build-js-all") {
		const diagnostics = orderedResults.flatMap((result) =>
			checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({
				...diagnostic,
				file: result.input,
			})),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		for (const result of orderedResults) {
			const output = jsOutputFor(result.input);
			const outputPath = resolve(process.cwd(), output);
			await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
			const program = programWithTypeScriptImports(result, graph);
			await Bun.write(outputPath, emitPointCoreJavaScript(program));
		}
		console.log(`Point core JavaScript build wrote ${results.length} files`);
		return;
	}

	if (command === "build-ast-all") {
		const diagnostics = orderedResults.flatMap((result) =>
			checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({ ...diagnostic, file: result.input })),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		for (const result of orderedResults) {
			const output = astOutputFor(result.input);
			const outputPath = resolve(process.cwd(), output);
			await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
			await Bun.write(outputPath, `${JSON.stringify(result.program, null, 2)}\n`);
		}
		console.log(`Point core AST build wrote ${results.length} files`);
		return;
	}

	if (command === "build-ts-all") {
		const diagnostics = orderedResults.flatMap((result) =>
			checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({
				...diagnostic,
				file: result.input,
			})),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		for (const result of orderedResults) {
			const output = tsOutputFor(result.input);
			const outputPath = resolve(process.cwd(), output);
			await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
			const program = programWithTypeScriptImports(result, graph);
			await Bun.write(outputPath, emitPointCoreTypeScript(program, result.input));
		}
		console.log(`Point core TypeScript build wrote ${results.length} files`);
		return;
	}

	if (command === "build-py-all") {
		const diagnostics = orderedResults.flatMap((result) =>
			checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({ ...diagnostic, file: result.input })),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const pureLogicResults = orderedResults.filter((result) => isPureLogicProgram(result.program));
		for (const result of pureLogicResults) {
			const output = pyOutputFor(result.input);
			const outputPath = resolve(process.cwd(), output);
			await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
			await Bun.write(outputPath, emitPointCorePython(programWithTypeScriptImports(result, graph)));
		}
		const skipped = results.length - pureLogicResults.length;
		console.log(`Point core Python build wrote ${pureLogicResults.length} files${skipped ? ` (${skipped} skipped)` : ""}`);
		return;
	}

	if (command === "test-all") {
		const diagnostics = orderedResults.flatMap((result) =>
			checkPointCore(programWithDependencyDeclarations(result, graph)).map((diagnostic) => ({ ...diagnostic, file: result.input })),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const results = await Promise.all(orderedResults.map((result) => runPointTests(programWithTypeScriptImports(result, graph), result.input)));
		const failed = results.filter((result) => !result.ok);
		if (failed.length > 0) {
			console.error(JSON.stringify({ ok: false, files: failed }, null, 2));
			process.exit(1);
		}
		console.log(`Point tests passed: ${results.reduce((total, result) => total + result.tests.length, 0)} tests`);
		return;
	}

	throw new Error(`Unknown point core command: ${command}`);
}

async function discoverInputs(): Promise<string[]> {
	const inputs = new Set<string>();
	for (const pattern of DEFAULT_PATTERNS) {
		const glob = new Bun.Glob(pattern);
		for await (const input of glob.scan({ cwd: process.cwd(), onlyFiles: true })) {
			if (!input.includes("/generated/")) inputs.add(input.replaceAll("\\", "/"));
		}
	}
	return [...inputs].sort((a, b) => a.localeCompare(b));
}

async function runRepl(inlineSource: string) {
	const source = inlineSource ? inlineSource.replaceAll("\\n", "\n") : await Bun.stdin.text();
	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;
		if (line === ".exit" || line === "exit") return;
		try {
			const value = Function(`"use strict"; return (${line.replace(/\band\b/g, "&&").replace(/\bor\b/g, "||")});`)();
			console.log(`${formatReplValue(value)}: ${pointTypeOfRuntimeValue(value)}`);
		} catch (error) {
			console.error(`REPL error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

function formatReplValue(value: unknown): string {
	return typeof value === "string" ? value : JSON.stringify(value);
}

function pointTypeOfRuntimeValue(value: unknown): string {
	if (typeof value === "string") return "Text";
	if (typeof value === "boolean") return "Bool";
	if (typeof value === "number") return Number.isInteger(value) ? "Int" : "Float";
	if (value === null || value === undefined) return "Void";
	if (Array.isArray(value)) return "List";
	return "Record";
}

interface PointTestResult {
	file: string;
	ok: boolean;
	tests: Array<{ name: string; ok: boolean; error?: string }>;
}

async function runPointTests(program: PointCoreProgram, input: string): Promise<PointTestResult> {
	const tests = program.declarations.filter(
		(declaration) =>
			declaration.kind === "function" &&
			declaration.params.length === 0 &&
			declaration.returnType.name === "Bool" &&
			(declaration.semantic?.name.startsWith("test") || declaration.name.startsWith("test")),
	);
	if (tests.length === 0) return { file: input, ok: true, tests: [] };
	const testOutput = resolve(tmpdir(), `point-test-${Date.now()}-${Math.random().toString(16).slice(2)}.js`);
	await Bun.write(testOutput, emitPointCoreJavaScript(program));
	const mod = await import(pathToFileUrl(testOutput));
	const results = [];
	for (const test of tests) {
		try {
			const candidate = mod[test.name];
			if (typeof candidate !== "function") throw new Error(`Test ${test.name} was not exported.`);
			const value = await candidate();
			results.push({ name: test.semantic?.name ?? test.name, ok: value === true, error: value === true ? undefined : "Expected true." });
		} catch (error) {
			results.push({ name: test.semantic?.name ?? test.name, ok: false, error: error instanceof Error ? error.message : String(error) });
		}
	}
	return { file: input, ok: results.every((result) => result.ok), tests: results };
}

function pathToFileUrl(path: string): string {
	return `file://${path.replaceAll("\\", "/")}`;
}

async function executeTempModuleRun(
	_program: PointCoreProgram,
	entryName: string,
	emittedJavaScript: string,
	onWrite?: (path: string) => void,
): Promise<unknown> {
	const runOutput = resolve(tmpdir(), `point-run-${Date.now()}.js`);
	onWrite?.(runOutput);
	await Bun.write(runOutput, emittedJavaScript);
	const mod = await import(pathToFileUrl(runOutput));
	const entry = mod[entryName];
	if (typeof entry !== "function") throw new Error(`Entrypoint ${entryName} was not exported.`);
	return await entry();
}

function parseCliFlags(args: string[]): { flags: Record<string, boolean | undefined>; positional: string[] } {
	const flags: Record<string, boolean | undefined> = {};
	const positional: string[] = [];
	for (const arg of args) {
		if (arg === "--bundle") flags.bundle = true;
		else if (arg === "--no-bundle") flags.bundle = false;
		else positional.push(arg);
	}
	return { flags, positional };
}

export function parseBuildCliFlags(args: string[]): { production: boolean; positional: string[] } {
	let production = false;
	const positional: string[] = [];
	for (const arg of args) {
		if (arg === "--production") production = true;
		else positional.push(arg);
	}
	return { production, positional };
}

export function findRunEntryName(program: PointCoreProgram): string | null {
	const zeroArgFunctions = program.declarations.filter((declaration) => declaration.kind === "function" && declaration.params.length === 0);
	const preferred =
		zeroArgFunctions.find((declaration) => declaration.semantic?.kind === "command") ??
		zeroArgFunctions.find((declaration) => declaration.name === "main") ??
		zeroArgFunctions[0];
	return preferred?.name ?? null;
}

export async function loadCoreFile(input: string, lock: Awaited<ReturnType<typeof readPointLock>>, cwd = process.cwd()) {
	const source = await Bun.file(resolve(cwd, input)).text();
	return { input, source, program: parsePointSource(source), uses: parseUseDeclarations(source, input, lock) };
}

type CoreFile = Awaited<ReturnType<typeof loadCoreFile>>;
type ModuleGraph = Map<string, { result: CoreFile; dependencies: CoreFile[] }>;

interface UseDeclaration {
	moduleName: string;
	from: string;
	input: string;
}

function parseUseDeclarations(source: string, input: string, lock: Awaited<ReturnType<typeof readPointLock>>): UseDeclaration[] {
	return source
		.split(/\r?\n/)
		.map((line) => line.trim().match(/^use\s+([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*)(?:\s+from\s+"([^"]+)")?$/))
		.filter((match): match is RegExpMatchArray => Boolean(match))
		.map((match) => ({ moduleName: match[1]!, from: match[2] ?? modulePathFromLock(lock, match[1]!), input }));
}

function createModuleGraph(results: CoreFile[], lock: Awaited<ReturnType<typeof readPointLock>>): ModuleGraph {
	const byInput = new Map(results.map((result) => [normalizeInput(result.input), result]));
	const graph: ModuleGraph = new Map();
	for (const result of results) {
		const dependencies = result.uses.map((use) => {
			const resolved = normalizeInput(resolveDependencyInput(use.input, use.from));
			const dependency = byInput.get(resolved);
			if (!dependency) throw new Error(`Cannot resolve Point module ${use.moduleName} from ${use.from} in ${use.input}`);
			return dependency;
		});
		graph.set(normalizeInput(result.input), { result, dependencies });
	}
	return graph;
}

export async function createModuleGraphForFile(
	coreFile: CoreFile,
	lock: Awaited<ReturnType<typeof readPointLock>>,
	cwd = process.cwd(),
): Promise<ModuleGraph> {
	const loaded = new Map<string, CoreFile>();
	const pending = [coreFile];
	while (pending.length > 0) {
		const current = pending.pop()!;
		const key = normalizeInput(current.input);
		if (loaded.has(key)) continue;
		loaded.set(key, current);
		for (const use of current.uses) {
			const dependencyInput = resolveDependencyInput(current.input, use.from, cwd);
			const dependencyKey = normalizeInput(dependencyInput);
			if (loaded.has(dependencyKey)) continue;
			pending.push(await loadCoreFile(dependencyInput, lock, cwd));
		}
	}
	return createModuleGraph([...loaded.values()], lock);
}

export function orderByDependencies(results: CoreFile[], graph: ModuleGraph): CoreFile[] {
	const ordered: CoreFile[] = [];
	const visiting = new Set<string>();
	const visited = new Set<string>();
	const visit = (result: CoreFile) => {
		const key = normalizeInput(result.input);
		if (visited.has(key)) return;
		if (visiting.has(key)) throw new Error(`Cyclic Point module dependency involving ${result.input}`);
		visiting.add(key);
		for (const dependency of graph.get(key)?.dependencies ?? []) visit(dependency);
		visiting.delete(key);
		visited.add(key);
		ordered.push(result);
	};
	for (const result of results) visit(result);
	return ordered;
}

export function programWithDependencyDeclarations(result: CoreFile, graph: ModuleGraph): PointCoreProgram {
	const dependencies = graph.get(normalizeInput(result.input))?.dependencies ?? [];
	return {
		...result.program,
		declarations: [...dependencies.flatMap((dependency) => publicDeclarations(dependency.program)), ...result.program.declarations],
	};
}

export function programWithTypeScriptImports(result: CoreFile, graph: ModuleGraph): PointCoreProgram {
	const dependencies = graph.get(normalizeInput(result.input))?.dependencies ?? [];
	const imports: PointCoreDeclaration[] = dependencies.map((dependency) => ({
		kind: "import",
		names: publicDeclarations(dependency.program).map((declaration) => declaration.name).filter(Boolean),
		from: `./${outputBaseName(dependency.input)}`,
	}));
	return { ...result.program, declarations: [...imports.filter((declaration) => declaration.kind !== "import" || declaration.names.length > 0), ...result.program.declarations] };
}

function publicDeclarations(program: PointCoreProgram): Array<Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }>> {
	return program.declarations.filter(
		(declaration): declaration is Extract<PointCoreDeclaration, { kind: "type" | "function" | "value" | "external" }> =>
			declaration.kind === "type" || declaration.kind === "function" || declaration.kind === "value" || declaration.kind === "external",
	);
}

function resolveDependencyInput(input: string, from: string, cwd = process.cwd()): string {
	const normalized = from.replaceAll("\\", "/");
	if (normalized.startsWith("./") || normalized.startsWith("../")) {
		const base = dirname(resolve(cwd, input));
		return resolve(base, from).replace(resolve(cwd), "").replace(/^[/\\]/, "");
	}
	return normalized;
}

function normalizeInput(input: string): string {
	return input.replaceAll("\\", "/");
}

function outputFor(input: string): string {
	const name = outputBaseName(input);
	return `${GENERATED_DIR}/${name}.ast.json`;
}

function tsOutputFor(input: string): string {
	const name = outputBaseName(input);
	return `${GENERATED_DIR}/${name}.ts`;
}

export function jsOutputFor(input: string): string {
	const name = outputBaseName(input);
	return `${GENERATED_DIR}/${name}.js`;
}

function astOutputFor(input: string): string {
	return outputFor(input);
}

function pyOutputFor(input: string): string {
	const name = outputBaseName(input);
	return `${GENERATED_DIR}/${name}.py`;
}

function outputBaseName(input: string): string {
	return normalizeInput(input).split("/").pop()?.replace(/\.point$/, "") ?? "program";
}

