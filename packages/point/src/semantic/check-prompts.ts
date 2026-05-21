import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type { PointSemanticProgram, PointSemanticPromptDeclaration, PointSemanticRecordDeclaration } from "./ast.ts";
import { toPascalCase } from "./naming.ts";

const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;

export function extractPromptPlaceholders(template: string): string[] {
	const placeholders: string[] = [];
	for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
		const label = match[1]?.trim();
		if (label) placeholders.push(label);
	}
	return placeholders;
}

export function checkSemanticPrompts(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const records = new Map<string, PointSemanticRecordDeclaration>();
	const promptNames = new Set<string>();

	for (const declaration of program.declarations) {
		if (declaration.kind === "record") {
			records.set(declaration.name, declaration);
			records.set(toPascalCase(declaration.name), declaration);
		}
	}

	for (const declaration of program.declarations) {
		if (declaration.kind !== "prompt") continue;
		if (promptNames.has(declaration.name)) {
			diagnostics.push(
				promptDiagnostic(
					"duplicate-prompt",
					`Duplicate prompt name ${declaration.name}`,
					moduleName,
					declaration,
					`Rename one of the prompt blocks named ${declaration.name}.`,
				),
			);
		}
		promptNames.add(declaration.name);

		const record = records.get(declaration.recordName);
		if (!record) {
			diagnostics.push(
				promptDiagnostic(
					"unknown-prompt-record",
					`Unknown record ${declaration.recordName} referenced by prompt ${declaration.name}`,
					moduleName,
					declaration,
					`Declare record ${declaration.recordName} before prompt ${declaration.name}.`,
				),
			);
			continue;
		}

		const fieldLabels = new Set(record.fields.map((field) => field.label));
		for (const placeholder of extractPromptPlaceholders(declaration.template)) {
			if (fieldLabels.has(placeholder)) continue;
			diagnostics.push(
				promptDiagnostic(
					"missing-prompt-placeholder",
					`Prompt ${declaration.name} references unknown placeholder {${placeholder}}; record ${record.name} has no field ${placeholder}`,
					moduleName,
					declaration,
					`Add field ${placeholder} to record ${record.name}, or fix the template placeholder.`,
				),
			);
		}
	}

	return diagnostics;
}

function promptDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	prompt: PointSemanticPromptDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `prompt.${prompt.name}`,
		ref: `point://semantic/${moduleName}/prompt.${prompt.name}`,
		severity: "error",
		span: span ?? prompt.span ?? null,
		repair,
	};
}
