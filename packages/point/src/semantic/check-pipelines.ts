import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticPipelineDeclaration,
	PointSemanticPolicyDeclaration,
	PointSemanticProgram,
	PointSemanticPipelineStatement,
} from "./ast.ts";

export function checkSemanticPipelines(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const policies = new Map<string, PointSemanticPolicyDeclaration>(
		program.declarations
			.filter((declaration): declaration is PointSemanticPolicyDeclaration => declaration.kind === "policy")
			.map((declaration) => [declaration.name, declaration]),
	);

	for (const declaration of program.declarations) {
		if (declaration.kind !== "pipeline") continue;
		for (const statement of declaration.body) {
			if (statement.kind !== "step" || !statement.options?.requiredPolicy) continue;
			const policyName = statement.options.requiredPolicy;
			if (!policies.has(policyName)) {
				diagnostics.push(
					pipelineStepDiagnostic(
						"unknown-policy",
						`Unknown policy ${policyName} required by pipeline step ${statement.name}`,
						moduleName,
						declaration,
						statement,
						`Declare policy ${policyName} in this module or import it before pipeline ${declaration.name}.`,
						[...policies.keys()].sort(),
						policyName,
						statement.options?.requiredPolicySpan ?? statement.span ?? undefined,
					),
				);
			}
		}
	}

	return diagnostics;
}

function pipelineStepDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	pipeline: PointSemanticPipelineDeclaration,
	step: Extract<PointSemanticPipelineStatement, { kind: "step" }>,
	repair: string,
	expected?: string[],
	actual?: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `pipeline.${pipeline.name}.step.${step.name}`,
		ref: `point://semantic/${moduleName}/pipeline.${pipeline.name}/step.${step.name}`,
		severity: "error",
		span: span ?? step.span ?? pipeline.span ?? null,
		repair,
		expected,
		actual,
	};
}
