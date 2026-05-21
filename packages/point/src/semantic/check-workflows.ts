import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticPolicyDeclaration,
	PointSemanticProgram,
	PointSemanticWorkflowDeclaration,
	PointSemanticWorkflowStatement,
} from "./ast.ts";

export function checkSemanticWorkflows(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const policies = new Map<string, PointSemanticPolicyDeclaration>(
		program.declarations
			.filter((declaration): declaration is PointSemanticPolicyDeclaration => declaration.kind === "policy")
			.map((declaration) => [declaration.name, declaration]),
	);

	for (const declaration of program.declarations) {
		if (declaration.kind !== "workflow") continue;
		for (const statement of declaration.body) {
			if (statement.kind !== "step" || !statement.options?.requiredPolicy) continue;
			const policyName = statement.options.requiredPolicy;
			if (!policies.has(policyName)) {
				diagnostics.push(
					workflowStepDiagnostic(
						"unknown-policy",
						`Unknown policy ${policyName} required by workflow step ${statement.name}`,
						moduleName,
						declaration,
						statement,
						`Declare policy ${policyName} in this module or import it before workflow ${declaration.name}.`,
					),
				);
			}
		}
	}

	return diagnostics;
}

function workflowStepDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	workflow: PointSemanticWorkflowDeclaration,
	step: Extract<PointSemanticWorkflowStatement, { kind: "step" }>,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `workflow.${workflow.name}.step.${step.name}`,
		ref: `point://semantic/${moduleName}/workflow.${workflow.name}/step.${step.name}`,
		severity: "error",
		span: span ?? step.span ?? workflow.span ?? null,
		repair,
	};
}
