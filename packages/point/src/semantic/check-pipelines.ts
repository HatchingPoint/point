import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticActionDeclaration,
	PointSemanticExpression,
	PointSemanticPipelineDeclaration,
	PointSemanticPolicyDeclaration,
	PointSemanticProgram,
	PointSemanticPipelineStatement,
	PointSemanticTypeExpression,
} from "./ast.ts";

export function checkSemanticPipelines(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const policies = new Map<string, PointSemanticPolicyDeclaration>(
		program.declarations
			.filter((declaration): declaration is PointSemanticPolicyDeclaration => declaration.kind === "policy")
			.map((declaration) => [declaration.name, declaration]),
	);
	const actions = new Map<string, PointSemanticActionDeclaration>(
		program.declarations
			.filter((declaration): declaration is PointSemanticActionDeclaration => declaration.kind === "action")
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
		diagnostics.push(...checkPipelineStepTypes(moduleName, declaration, actions));
	}

	return diagnostics;
}

function checkPipelineStepTypes(
	moduleName: string,
	pipeline: PointSemanticPipelineDeclaration,
	actions: ReadonlyMap<string, PointSemanticActionDeclaration>,
): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const pipelineInputs = new Map(pipeline.inputs.map((input) => [input.label, input.type]));
	const stepTypes = new Map<string, PointSemanticTypeExpression>();

	for (const statement of pipeline.body) {
		if (statement.kind !== "step") continue;
		const call = unwrapAwaitCall(statement.value);
		if (!call) continue;

		const action = actions.get(call.callee);
		if (!action) continue;

		if (call.args.length !== action.inputs.length) {
			diagnostics.push(
				pipelineStepDiagnostic(
					"pipeline-step-type-mismatch",
					`Pipeline step ${statement.name} calls ${call.callee} with ${call.args.length} argument(s) but action expects ${action.inputs.length}`,
					moduleName,
					pipeline,
					statement,
					`Call ${call.callee} with ${action.inputs.map((input) => input.label).join(", ")}.`,
					action.inputs.map((input) => input.label),
					call.args.map(formatArgLabel).join(", "),
					statement.span,
				),
			);
		}

		for (const [index, input] of action.inputs.entries()) {
			const arg = call.args[index];
			if (!arg) continue;
			const actualType = resolvePipelineExpressionType(arg, pipelineInputs, stepTypes);
			if (!actualType) continue;
			if (isAssignableSemanticType(actualType, input.type)) continue;
			diagnostics.push(
				pipelineStepDiagnostic(
					"pipeline-step-type-mismatch",
					`Pipeline step ${statement.name} passes ${formatArgLabel(arg)} (${formatSemanticType(actualType)}) to ${call.callee} input ${input.label} (${formatSemanticType(input.type)})`,
					moduleName,
					pipeline,
					statement,
					`Pass a ${formatSemanticType(input.type)} value to ${input.label}; previous step outputs are ${[...stepTypes.entries()].map(([name, type]) => `${name}: ${formatSemanticType(type)}`).join(", ") || "none yet"}.`,
					formatSemanticType(input.type),
					formatSemanticType(actualType),
					arg.span ?? statement.span,
				),
			);
		}

		stepTypes.set(statement.name, action.output.type);
	}

	const returnStatement = pipeline.body.find((statement) => statement.kind === "return");
	if (returnStatement?.kind === "return" && returnStatement.value.kind === "name") {
		const stepType = stepTypes.get(returnStatement.value.label);
		if (stepType && !isAssignableSemanticType(stepType, pipeline.output.type)) {
			diagnostics.push({
				code: "pipeline-step-type-mismatch",
				message: `Pipeline ${pipeline.name} returns step ${returnStatement.value.label} (${formatSemanticType(stepType)}) but output is ${pipeline.output.name}: ${formatSemanticType(pipeline.output.type)}`,
				path: `pipeline.${pipeline.name}.return`,
				ref: `point://semantic/${moduleName}/pipeline.${pipeline.name}`,
				severity: "error",
				span: returnStatement.span ?? pipeline.span ?? null,
				expected: formatSemanticType(pipeline.output.type),
				actual: formatSemanticType(stepType),
				repair: `Return a ${formatSemanticType(pipeline.output.type)} value or adjust pipeline output ${pipeline.output.name}.`,
			});
		}
	}

	return diagnostics;
}

function unwrapAwaitCall(
	expression: PointSemanticExpression,
): { callee: string; args: PointSemanticExpression[] } | null {
	if (expression.kind !== "await" || expression.value.kind !== "call") return null;
	return { callee: expression.value.callee, args: expression.value.args };
}

function resolvePipelineExpressionType(
	expression: PointSemanticExpression,
	pipelineInputs: ReadonlyMap<string, PointSemanticTypeExpression>,
	stepTypes: ReadonlyMap<string, PointSemanticTypeExpression>,
): PointSemanticTypeExpression | null {
	if (expression.kind === "name") {
		return stepTypes.get(expression.label) ?? pipelineInputs.get(expression.label) ?? null;
	}
	if (expression.kind === "literal") {
		if (typeof expression.value === "string") return primitiveType("Text");
		if (typeof expression.value === "number") return Number.isInteger(expression.value) ? primitiveType("Int") : primitiveType("Float");
		if (typeof expression.value === "boolean") return primitiveType("Bool");
		return null;
	}
	if (expression.kind === "error") return primitiveType("Error");
	return null;
}

function isAssignableSemanticType(actual: PointSemanticTypeExpression, expected: PointSemanticTypeExpression): boolean {
	if (sameSemanticType(actual, expected)) return true;
	if (expected.name === "Or") {
		return expected.args.some((candidate) => isAssignableSemanticType(actual, candidate));
	}
	if (actual.name === "Or") {
		return actual.args.every((candidate) => isAssignableSemanticType(candidate, expected));
	}
	return false;
}

function sameSemanticType(left: PointSemanticTypeExpression, right: PointSemanticTypeExpression): boolean {
	if (left.name !== right.name) return false;
	if (left.args.length !== right.args.length) return false;
	return left.args.every((arg, index) => sameSemanticType(arg, right.args[index]!));
}

function primitiveType(name: string): PointSemanticTypeExpression {
	return { kind: "typeRef", name, args: [] };
}

function formatSemanticType(type: PointSemanticTypeExpression): string {
	if (type.name === "Or") return type.args.map(formatSemanticType).join(" or ");
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatSemanticType).join(", ")}>`;
}

function formatArgLabel(expression: PointSemanticExpression): string {
	if (expression.kind === "name") return expression.label;
	if (expression.kind === "literal") return JSON.stringify(expression.value);
	if (expression.kind === "error") return `Error ${JSON.stringify(expression.message)}`;
	return "...";
}

function pipelineStepDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	pipeline: PointSemanticPipelineDeclaration,
	step: Extract<PointSemanticPipelineStatement, { kind: "step" }>,
	repair: string,
	expected?: string | string[],
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
