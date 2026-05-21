import type { PointCoreProgram } from "./ast.ts";
import type { PointSemanticPipelineDeclaration } from "../semantic/ast.ts";
import { semanticFunctionName } from "../semantic/naming.ts";

const PIPELINE_EVENT_SCHEMA = "point.pipeline.event.v1";

export function programHasPipelines(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some((declaration) => declaration.kind === "pipeline");
}

export function programHasPipelineExtensions(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some((declaration) => {
		if (declaration.kind !== "pipeline") return false;
		return declaration.body.some((statement) => {
			if (statement.kind !== "step" || !statement.options) return false;
			const options = statement.options;
			return Boolean(
				options.retryCount ||
					options.timeoutSeconds ||
					options.requiredPolicy ||
					options.fileScopeGuard ||
					options.onFailure,
			);
		});
	});
}

export function emitPointPipelineHelpers(): string[] {
	return [
		"function pointPipelineNow(): number {",
		"  return Date.now();",
		"}",
		"",
		"function pointPipelineShouldLog(log: PointPipelineLog<PointPipelineEventBase> | null | undefined): boolean {",
		"  return log != null;",
		"}",
		"",
		"function pointPipelineEmitLog(",
		"  log: PointPipelineLog<PointPipelineEventBase> | null | undefined,",
		"  pipeline: string,",
		"  step: string,",
		"  phase: PointPipelineEventBase[\"phase\"],",
		"  ok?: boolean,",
		"  error?: { message: string },",
		"): void {",
		"  if (!pointPipelineShouldLog(log)) return;",
		"  const event: PointPipelineEventBase = {",
		`    schemaVersion: "${PIPELINE_EVENT_SCHEMA}",`,
		"    pipeline,",
		"    step,",
		"    phase,",
		"    at: pointPipelineNow(),",
		"    ...(ok === true ? { ok: true as const } : {}),",
		"    ...(ok === false ? { ok: false as const, error: error ?? { message: \"\" } } : {}),",
		"  };",
		"  log!(event);",
		"}",
		"",
		"export type PointPipelineLog<T extends PointPipelineEventBase> = (event: T) => void;",
		"",
		"export interface PointPipelineEventBase {",
		`  schemaVersion: "${PIPELINE_EVENT_SCHEMA}";`,
		"  pipeline: string;",
		"  step: string;",
		'  phase: "start" | "complete" | "failure";',
		"  at: number;",
		"}",
		"",
		"export function pointPipelineEventJson(event: PointPipelineEventBase): string {",
		"  return JSON.stringify(event);",
		"}",
		"",
		"export function pointPipelineEventsJson(events: readonly PointPipelineEventBase[]): string {",
		"  return JSON.stringify(events);",
		"}",
		"",
	];
}

export function emitPipelineStepEventTypes(program: PointCoreProgram): string[] {
	const source = program.semanticSource;
	if (!source) return [];
	const lines: string[] = [];
	for (const declaration of source.declarations) {
		if (declaration.kind !== "pipeline") continue;
		lines.push(...emitPipelineEventType(declaration));
		lines.push("");
	}
	return lines;
}

function emitPipelineEventType(declaration: PointSemanticPipelineDeclaration): string[] {
	const typeName = `${semanticFunctionName(declaration.name, "pipeline", "pipeline")}Event`;
	const pipelineLabel = declaration.name;
	const members: string[] = [];
	for (const statement of declaration.body) {
		if (statement.kind !== "step") continue;
		const stepLabel = statement.name;
		members.push(
			`  | { schemaVersion: "${PIPELINE_EVENT_SCHEMA}"; pipeline: ${JSON.stringify(pipelineLabel)}; step: ${JSON.stringify(stepLabel)}; phase: "start"; at: number }`,
			`  | { schemaVersion: "${PIPELINE_EVENT_SCHEMA}"; pipeline: ${JSON.stringify(pipelineLabel)}; step: ${JSON.stringify(stepLabel)}; phase: "complete"; at: number; ok: true }`,
			`  | { schemaVersion: "${PIPELINE_EVENT_SCHEMA}"; pipeline: ${JSON.stringify(pipelineLabel)}; step: ${JSON.stringify(stepLabel)}; phase: "failure"; at: number; ok: false; error: { message: string } }`,
		);
	}
	if (members.length === 0) {
		return [`export type ${typeName} = PointPipelineEventBase;`];
	}
	return [`export type ${typeName} =`, ...members, ";"];
}

export function pipelineEventTypeName(pipelineName: string): string {
	return `${semanticFunctionName(pipelineName, "pipeline", "pipeline")}Event`;
}

export function pipelineLogParamName(): string {
	return "__pointPipelineLog";
}
