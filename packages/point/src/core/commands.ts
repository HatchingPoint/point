import type { PointCoreProgram } from "./ast.ts";
import { semanticFunctionName } from "../semantic/naming.ts";
import type { PointSemanticProgram } from "../semantic/ast.ts";

export const POINT_COMMANDS_SCHEMA = "point.commands.v1" as const;

export interface PointCommandEntry {
	name: string;
	module: string;
	file: string;
	run: string;
	launch: string;
	outputType: string;
}

export interface PointCommandsCatalog {
	schemaVersion: typeof POINT_COMMANDS_SCHEMA;
	commands: PointCommandEntry[];
	defaultRun: string;
}

export function scanCommandDeclarations(source: string): Array<{ name: string; outputType: string }> {
	const commands: Array<{ name: string; outputType: string }> = [];
	const lines = source.split(/\r?\n/);
	let index = 0;
	while (index < lines.length) {
		const trimmed = (lines[index] ?? "").trim();
		if (!trimmed.startsWith("command ")) {
			index += 1;
			continue;
		}
		const name = trimmed.slice("command ".length).trim();
		let outputType = "Void";
		index += 1;
		while (index < lines.length) {
			const bodyLine = (lines[index] ?? "").trim();
			if (!bodyLine) {
				index += 1;
				continue;
			}
			if (/^(module|use|capabilities|record|variant|calculation|rule|label|external|action|policy|guard|view|layout|navigation|page|middleware|stream route|route|workflow|pipeline|session|command|schedule|prompt|theme)\s+/.test(bodyLine)) {
				break;
			}
			const outputMatch = bodyLine.match(/^output\s+([A-Za-z][A-Za-z0-9 ]*(?:<[^>]+>)?(?:\s+or\s+[A-Za-z][A-Za-z0-9 ]*(?:<[^>]+>)?)?)\s*:/);
			if (outputMatch) outputType = outputMatch[1]?.trim() ?? outputType;
			index += 1;
		}
		commands.push({ name, outputType });
	}
	return commands;
}

export function commandEntryForFile(
	command: { name: string; outputType: string },
	file: string,
	moduleName?: string,
): PointCommandEntry {
	const moduleLabel = moduleName ?? file;
	return {
		name: command.name,
		module: moduleLabel,
		file,
		run: `point run ${file} ${command.name}`,
		launch: `point launch ${file} ${command.name}`,
		outputType: command.outputType,
	};
}

export function listPointCommandsFromSource(source: string, file: string, moduleName?: string): PointCommandEntry[] {
	return scanCommandDeclarations(source).map((command) => commandEntryForFile(command, file, moduleName));
}

export function listPointCommandsCatalog(commands: PointCommandEntry[]): PointCommandsCatalog {
	return {
		schemaVersion: POINT_COMMANDS_SCHEMA,
		commands,
		defaultRun: "point run <file> <command name>",
	};
}

export function formatPointCommandsCatalog(catalog: PointCommandsCatalog): string {
	const lines = [
		"Commands (zero-arg entrypoints):",
		"",
		...catalog.commands.map((entry) => `  ${entry.name.padEnd(20)}  ${entry.run}`),
		"",
		"Run:    point run <file> <command name>",
		"Launch: point launch <file> <command name>  (alias)",
	];
	return lines.join("\n");
}

export function findRunEntryName(program: PointCoreProgram, commandName?: string): string | null {
	const zeroArgFunctions = program.declarations.filter((declaration) => declaration.kind === "function" && declaration.params.length === 0);
	if (commandName) {
		const normalized = commandName.trim().toLowerCase();
		const match = zeroArgFunctions.find((declaration) => {
			const semanticName = declaration.semantic?.name?.toLowerCase();
			if (semanticName === normalized) return true;
			if (declaration.semantic?.kind === "command") {
				const lowered = semanticFunctionName(declaration.semantic.name, declaration.semantic.outputName ?? "result", "command").toLowerCase();
				if (lowered === normalized.replace(/\s+/g, "")) return true;
			}
			return declaration.name.toLowerCase() === normalized.replace(/\s+/g, "");
		});
		return match?.name ?? null;
	}
	const isServeCommand = (declaration: (typeof zeroArgFunctions)[number]) => {
		const name = declaration.semantic?.name ?? "";
		return declaration.semantic?.kind === "command" && name.toLowerCase().startsWith("serve ");
	};
	const preferred =
		zeroArgFunctions.find((declaration) => declaration.semantic?.kind === "command" && !isServeCommand(declaration)) ??
		zeroArgFunctions.find((declaration) => declaration.semantic?.kind === "command") ??
		zeroArgFunctions.find((declaration) => declaration.name === "main") ??
		zeroArgFunctions[0];
	return preferred?.name ?? null;
}

export function availableCommandNames(program: PointCoreProgram): string[] {
	return program.declarations
		.filter((declaration) => declaration.kind === "function" && declaration.params.length === 0 && declaration.semantic?.kind === "command")
		.map((declaration) => declaration.semantic?.name ?? declaration.name);
}

export function listPointCommandsFromProgram(program: PointSemanticProgram, file: string): PointCommandEntry[] {
	return program.declarations
		.filter((declaration): declaration is Extract<(typeof program.declarations)[number], { kind: "command" }> => declaration.kind === "command")
		.map((declaration) =>
			commandEntryForFile(
				{ name: declaration.name, outputType: formatOutputType(declaration.output.type) },
				file,
				program.module,
			),
		);
}

function formatOutputType(type: import("../semantic/ast.ts").PointSemanticTypeExpression): string {
	if (type.args.length > 0) return `${type.name}<${type.args.map(formatOutputType).join(", ")}>`;
	return type.name;
}
