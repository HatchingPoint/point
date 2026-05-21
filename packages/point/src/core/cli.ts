import { dirname, resolve } from "node:path";
import { checkPointCore } from "./check.ts";
import { createPointCoreIndex, createPointCoreRepairPlan, explainPointCoreRef } from "./context.ts";
import { emitPointCoreTypeScript } from "./emit-typescript.ts";
import { formatPointCore } from "./format.ts";
import { isSemanticPointSyntax, parsePointSource } from "./parser.ts";

const DEFAULT_INPUT = "examples/math.point";
const DEFAULT_OUTPUT = "generated/math.ast.json";
const DEFAULT_TS_OUTPUT = "generated/math.ts";
const DEFAULT_PATTERN = "examples/**/*.point";
const GENERATED_DIR = "generated";

export async function main() {
	const [, , command = "check", input = DEFAULT_INPUT, output = DEFAULT_OUTPUT] = Bun.argv;
	if (command.endsWith("-all")) {
		await runProjectCommand(command);
		return;
	}

	const inputPath = resolve(process.cwd(), input);
	const source = await Bun.file(inputPath).text();
	const program = parsePointSource(source);
	const diagnostics = checkPointCore(program);

	if (command === "fmt") {
		if (isSemanticPointSyntax(source)) {
			console.log(`Point core fmt preserved semantic source: ${input}`);
			return;
		}
		await Bun.write(inputPath, formatPointCore(program));
		console.log(`Point core fmt wrote ${input}`);
		return;
	}

	if (command === "fmt-check") {
		if (isSemanticPointSyntax(source)) {
			console.log(`Point core fmt check passed: ${input}`);
			return;
		}
		const formatted = formatPointCore(program);
		if (source !== formatted) {
			console.error(`Point core fmt check failed: ${input}`);
			process.exit(1);
		}
		console.log(`Point core fmt check passed: ${input}`);
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
		console.log(JSON.stringify({ schemaVersion: "point.core.check.v1", ok: diagnostics.length === 0, diagnostics }, null, 2));
		if (diagnostics.length > 0) process.exit(1);
		return;
	}

	if (command === "index") {
		console.log(JSON.stringify(createPointCoreIndex(program), null, 2));
		return;
	}

	if (command === "explain") {
		const ref = output;
		console.log(JSON.stringify(explainPointCoreRef(program, ref), null, 2));
		return;
	}

	if (command === "repair-plan") {
		console.log(JSON.stringify(createPointCoreRepairPlan(diagnostics), null, 2));
		if (diagnostics.length > 0) process.exit(1);
		return;
	}

	if (command === "print-ast") {
		console.log(JSON.stringify(program, null, 2));
		return;
	}

	if (command === "build") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const outputPath = resolve(process.cwd(), output);
		await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
		await Bun.write(outputPath, `${JSON.stringify(program, null, 2)}\n`);
		console.log(`Point core build wrote ${output}`);
		return;
	}

	if (command === "build-ts") {
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		const outputPath = resolve(process.cwd(), output === DEFAULT_OUTPUT ? DEFAULT_TS_OUTPUT : output);
		await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
		await Bun.write(outputPath, emitPointCoreTypeScript(program));
		console.log(`Point core TypeScript build wrote ${outputPath.replaceAll("\\", "/")}`);
		return;
	}

	throw new Error(`Unknown point core command: ${command}`);
}

async function runProjectCommand(command: string) {
	const inputs = await discoverInputs();
	if (inputs.length === 0) throw new Error(`No Point core files matched ${DEFAULT_PATTERN}`);
	const results = await Promise.all(inputs.map((input) => loadCoreFile(input)));

	if (command === "fmt-all") {
		await Promise.all(
			results.map((result) =>
				isSemanticPointSyntax(result.source)
					? Promise.resolve()
					: Bun.write(resolve(process.cwd(), result.input), formatPointCore(result.program)),
			),
		);
		console.log(`Point core fmt wrote ${results.length} files`);
		return;
	}

	if (command === "fmt-check-all") {
		const unformatted = results.filter(
			(result) => !isSemanticPointSyntax(result.source) && result.source !== formatPointCore(result.program),
		);
		if (unformatted.length > 0) {
			console.error(JSON.stringify({ ok: false, unformatted: unformatted.map((result) => result.input) }, null, 2));
			process.exit(1);
		}
		console.log(`Point core fmt check passed: ${results.length} files`);
		return;
	}

	if (command === "check-all") {
		const diagnostics = results.flatMap((result) =>
			checkPointCore(result.program).map((diagnostic) => ({ ...diagnostic, file: result.input })),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		console.log(`Point core check passed: ${results.length} files`);
		return;
	}

	if (command === "build-all") {
		const diagnostics = results.flatMap((result) =>
			checkPointCore(result.program).map((diagnostic) => ({ ...diagnostic, file: result.input })),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		for (const result of results) {
			const output = outputFor(result.input);
			const outputPath = resolve(process.cwd(), output);
			await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
			await Bun.write(outputPath, `${JSON.stringify(result.program, null, 2)}\n`);
		}
		console.log(`Point core build wrote ${results.length} files`);
		return;
	}

	if (command === "build-ts-all") {
		const diagnostics = results.flatMap((result) =>
			checkPointCore(result.program).map((diagnostic) => ({ ...diagnostic, file: result.input })),
		);
		if (diagnostics.length > 0) {
			console.error(JSON.stringify({ ok: false, diagnostics }, null, 2));
			process.exit(1);
		}
		for (const result of results) {
			const output = tsOutputFor(result.input);
			const outputPath = resolve(process.cwd(), output);
			await Bun.$`mkdir -p ${dirname(outputPath)}`.quiet();
			await Bun.write(outputPath, emitPointCoreTypeScript(result.program));
		}
		console.log(`Point core TypeScript build wrote ${results.length} files`);
		return;
	}

	throw new Error(`Unknown point core command: ${command}`);
}

async function discoverInputs(): Promise<string[]> {
	const glob = new Bun.Glob(DEFAULT_PATTERN);
	const inputs: string[] = [];
	for await (const input of glob.scan({ cwd: process.cwd(), onlyFiles: true })) {
		if (!input.includes("/generated/")) inputs.push(input.replaceAll("\\", "/"));
	}
	return inputs.sort((a, b) => a.localeCompare(b));
}

async function loadCoreFile(input: string) {
	const source = await Bun.file(resolve(process.cwd(), input)).text();
	return { input, source, program: parsePointSource(source) };
}

function outputFor(input: string): string {
	const name = input.split("/").pop()?.replace(/\.point$/, "") ?? "program";
	return `${GENERATED_DIR}/${name}.ast.json`;
}

function tsOutputFor(input: string): string {
	const name = input.split("/").pop()?.replace(/\.point$/, "") ?? "program";
	return `${GENERATED_DIR}/${name}.ts`;
}
