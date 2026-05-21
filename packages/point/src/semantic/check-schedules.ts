import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type { PointSemanticProgram, PointSemanticScheduleDeclaration } from "./ast.ts";

export function checkSemanticSchedules(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const actionNames = new Map(
		program.declarations
			.filter((declaration) => declaration.kind === "action")
			.map((declaration) => [declaration.name, declaration]),
	);
	const scheduleNames = new Set<string>();

	for (const declaration of program.declarations) {
		if (declaration.kind !== "schedule") continue;
		if (scheduleNames.has(declaration.name)) {
			diagnostics.push(
				scheduleDiagnostic(
					"duplicate-schedule",
					`Duplicate schedule name ${declaration.name}`,
					moduleName,
					declaration,
					`Rename one of the schedule blocks named ${declaration.name}.`,
				),
			);
		}
		scheduleNames.add(declaration.name);

		const action = actionNames.get(declaration.actionName);
		if (!action) {
			diagnostics.push(
				scheduleDiagnostic(
					"unknown-schedule-action",
					`Unknown action ${declaration.actionName} referenced by schedule ${declaration.name}`,
					moduleName,
					declaration,
					`Declare action ${declaration.actionName} before schedule ${declaration.name}.`,
				),
			);
			continue;
		}
		if (action.inputs.length > 0) {
			diagnostics.push(
				scheduleDiagnostic(
					"schedule-action-needs-inputs",
					`Schedule ${declaration.name} calls action ${declaration.actionName} which requires inputs`,
					moduleName,
					declaration,
					`Use a zero-input action for schedule ${declaration.name}, or wrap ${declaration.actionName} in a parameterless action.`,
				),
			);
		}
	}

	return diagnostics;
}

function scheduleDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	schedule: PointSemanticScheduleDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `schedule.${schedule.name}`,
		ref: `point://semantic/${moduleName}/schedule.${schedule.name}`,
		severity: "error",
		span: span ?? schedule.span ?? null,
		repair,
	};
}
