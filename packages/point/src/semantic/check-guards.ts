import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticGuardDeclaration,
	PointSemanticPipelineDeclaration,
	PointSemanticProgram,
	PointSemanticWorkflowDeclaration,
	PointSemanticWorkflowStatement,
} from "./ast.ts";

type OrchestrationStep = Extract<PointSemanticWorkflowStatement, { kind: "step" }>;

export function checkSemanticGuards(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const guards = new Map<string, PointSemanticGuardDeclaration>(
		program.declarations
			.filter((declaration): declaration is PointSemanticGuardDeclaration => declaration.kind === "guard")
			.map((declaration) => [declaration.name, declaration]),
	);

	for (const declaration of program.declarations) {
		if (declaration.kind !== "pipeline" && declaration.kind !== "workflow") continue;
		for (const statement of declaration.body) {
			if (statement.kind !== "step" || !statement.options?.fileScopeGuard) continue;
			const guardName = statement.options.fileScopeGuard;
			if (guards.has(guardName)) continue;
			diagnostics.push(
				orchestrationStepGuardDiagnostic(
					"unknown-guard",
					`Unknown guard ${guardName} required by ${declaration.kind} step ${statement.name}`,
					moduleName,
					declaration,
					statement,
					`Declare guard ${guardName} in this module or import it before ${declaration.kind} ${declaration.name}.`,
				),
			);
		}
	}

	return diagnostics;
}

function orchestrationStepGuardDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	orchestration: PointSemanticPipelineDeclaration | PointSemanticWorkflowDeclaration,
	step: OrchestrationStep,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `${orchestration.kind}.${orchestration.name}.step.${step.name}`,
		ref: `point://semantic/${moduleName}/${orchestration.kind}.${orchestration.name}/step.${step.name}`,
		severity: "error",
		span: span ?? step.span ?? orchestration.span ?? null,
		repair,
	};
}
