import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { interpretPointIrEntry, lowerCheckedCoreProgramToBytecode } from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import { emitPointCoreJavaScript } from "../../packages/point/src/core/emit-javascript.ts";
import { parsePointSource } from "../../packages/point/src/core/parser.ts";
import { bundleJavaScriptForEval } from "../../packages/point/src/core/run-bridge.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const pureRoot = join(repoRoot, "examples/pure");

type ParityCase = {
	entry: string;
	args: unknown[];
};

const parityCasesByRelativePath: Record<string, ParityCase[]> = {
	"examples/pure/math-only.point": [
		{ entry: "annualPrice", args: [10] },
		{ entry: "annualPrice", args: [17] },
		{ entry: "demoResult", args: [] },
	],
};

type EmitModule = Record<string, (...args: unknown[]) => unknown>;

async function pointFilesUnder(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".point"))
		.map((entry) => join(entry.parentPath, entry.name))
		.sort();
}

async function loadCheckedProgram(filePath: string) {
	const source = await readFile(filePath, "utf8");
	const program = parsePointSource(source, { cwd: repoRoot, input: filePath });
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

function evalEmitModule(program: ReturnType<typeof parsePointSource>): EmitModule {
	const emitted = emitPointCoreJavaScript(program);
	const { body, exports } = bundleJavaScriptForEval(emitted);
	const factory = new Function(`"use strict";\n${body}\nreturn { ${exports.join(", ")} };`);
	return factory() as EmitModule;
}

describe("runtime emit/interpret parity", () => {
	test("covers every pure Point file with parity cases", async () => {
		const files = await pointFilesUnder(pureRoot);
		const missing = files
			.map((file) => relative(repoRoot, file).replaceAll("\\", "/"))
			.filter((path) => !parityCasesByRelativePath[path]?.length);

		expect(missing).toEqual([]);
	});

	for (const [relativePath, cases] of Object.entries(parityCasesByRelativePath)) {
		test(`${relativePath} interpreter matches JavaScript emit oracle`, async () => {
			const filePath = join(repoRoot, relativePath);
			const program = await loadCheckedProgram(filePath);
			const ir = lowerCheckedCoreProgramToBytecode(program);
			const emitModule = evalEmitModule(program);

			for (const parityCase of cases) {
				expect(Object.keys(emitModule)).toContain(parityCase.entry);
				const emitValue = await emitModule[parityCase.entry]!(...parityCase.args);
				const interpretValue = await interpretPointIrEntry(ir, parityCase.entry, parityCase.args);

				expect(interpretValue).toEqual(emitValue);
			}
		});
	}
});
