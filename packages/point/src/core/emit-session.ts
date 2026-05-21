import type { PointCoreProgram } from "./ast.ts";
import type { PointSemanticSessionDeclaration } from "../semantic/ast.ts";
import { semanticFunctionName, toIdentifier, toPascalCase } from "../semantic/naming.ts";

const SESSION_EVENT_SCHEMA = "point.session.event.v1";

export function programHasSessions(program: PointCoreProgram): boolean {
	const source = program.semanticSource;
	if (!source) return false;
	return source.declarations.some((declaration) => declaration.kind === "session");
}

export function sessionLogParamName(): string {
	return "__pointSessionLog";
}

export function emitPointSessionHelpers(): string[] {
	return [
		"function pointSessionNow(): number {",
		"  return Date.now();",
		"}",
		"",
		"function pointSessionShouldLog(log: PointSessionLog<PointSessionEventBase> | null | undefined): boolean {",
		"  return log != null;",
		"}",
		"",
		"function pointSessionEmitLog(",
		"  log: PointSessionLog<PointSessionEventBase> | null | undefined,",
		"  event: PointSessionEventBase,",
		"): void {",
		"  if (!pointSessionShouldLog(log)) return;",
		"  log!(event);",
		"}",
		"",
		"function pointIsSessionError(value: unknown): value is { message: string } {",
		'  return typeof value === "object" && value !== null && "message" in value && typeof (value as { message?: unknown }).message === "string";',
		"}",
		"",
		"function pointSessionChunkText(text: string): string[] {",
		"  if (text.length === 0) return [];",
		"  const words = text.split(/\\s+/).filter((part) => part.length > 0);",
		"  if (words.length <= 1) return [text];",
		"  return words.map((word, index) => (index === 0 ? word : ` ${word}`));",
		"}",
		"",
		"export type PointSessionLog<T extends PointSessionEventBase> = (event: T) => void;",
		"",
		"export interface PointSessionEventBase {",
		`  schemaVersion: "${SESSION_EVENT_SCHEMA}";`,
		"  session: string;",
		'  phase: "start" | "chunk" | "complete" | "failure";',
		"  at: number;",
		"}",
		"",
		"export function pointSessionEventJson(event: PointSessionEventBase): string {",
		"  return JSON.stringify(event);",
		"}",
		"",
	];
}

export function emitSessionStepEventTypes(program: PointCoreProgram): string[] {
	const source = program.semanticSource;
	if (!source) return [];
	const lines: string[] = [];
	for (const declaration of source.declarations) {
		if (declaration.kind !== "session") continue;
		lines.push(...emitSessionEventType(declaration));
		lines.push("");
	}
	return lines;
}

function emitSessionEventType(declaration: PointSemanticSessionDeclaration): string[] {
	const typeName = sessionEventTypeName(declaration.name);
	const sessionLabel = declaration.name;
	return [
		`export type ${typeName} =`,
		`  | { schemaVersion: "${SESSION_EVENT_SCHEMA}"; session: ${JSON.stringify(sessionLabel)}; phase: "start"; at: number }`,
		`  | { schemaVersion: "${SESSION_EVENT_SCHEMA}"; session: ${JSON.stringify(sessionLabel)}; phase: "chunk"; at: number; delta: string; content: string }`,
		`  | { schemaVersion: "${SESSION_EVENT_SCHEMA}"; session: ${JSON.stringify(sessionLabel)}; phase: "complete"; at: number; ok: true }`,
		`  | { schemaVersion: "${SESSION_EVENT_SCHEMA}"; session: ${JSON.stringify(sessionLabel)}; phase: "failure"; at: number; ok: false; error: { message: string } };`,
	];
}

export function emitSessionRuntime(program: PointCoreProgram): string[] {
	const source = program.semanticSource;
	if (!source) return [];
	const lines: string[] = [];
	for (const declaration of source.declarations) {
		if (declaration.kind !== "session") continue;
		lines.push(...emitSessionStateMachine(declaration, program));
		lines.push("");
	}
	return lines;
}

export function sessionEventTypeName(sessionName: string): string {
	return `${semanticFunctionName(sessionName, "session", "session")}Event`;
}

export function sessionStateTypeName(sessionName: string): string {
	return `${semanticFunctionName(sessionName, "session", "session")}State`;
}

function emitSessionStateMachine(declaration: PointSemanticSessionDeclaration, program: PointCoreProgram): string[] {
	const sessionLabel = declaration.name;
	const stateType = sessionStateTypeName(sessionLabel);
	const eventType = sessionEventTypeName(sessionLabel);
	const messageType = toPascalCase(declaration.messageRecordName);
	const messagesField = toIdentifier(declaration.messagesField.label);
	const logParam = sessionLogParamName();
	const streamAction = program.declarations.find(
		(candidate) => candidate.kind === "function" && candidate.semantic?.kind === "action" && candidate.semantic.name === declaration.streamActionName,
	);
	const streamOutputName =
		streamAction?.kind === "function" && streamAction.semantic?.outputName
			? toIdentifier(streamAction.semantic.outputName)
			: "text";
	const streamFn = semanticFunctionName(declaration.streamActionName, streamOutputName, "action");
	const streamParams =
		streamAction?.kind === "function"
			? streamAction.params.map((param) => param.name).join(", ")
			: "";
	const streamArgs =
		streamAction?.kind === "function"
			? streamAction.params.map((param) => param.name).join(", ")
			: "";
	const streamCall = streamParams ? `await ${streamFn}(${streamArgs})` : `await ${streamFn}()`;

	return [
		`export type ${stateType} = { ${messagesField}: ${messageType}[] };`,
		"",
		`export function ${semanticFunctionName(sessionLabel, "session", "session")}Create(): ${stateType} {`,
		`  return { ${messagesField}: [] };`,
		"}",
		"",
		`export function ${semanticFunctionName(sessionLabel, "session", "session")}AddUserMessage(`,
		`  state: ${stateType},`,
		"  content: string,",
		`): ${stateType} {`,
		`  return {`,
		`    ${messagesField}: [`,
		`      ...state.${messagesField},`,
		`      { role: { kind: "User" }, content },`,
		`      { role: { kind: "Pending" }, content: "" },`,
		`    ],`,
		`  };`,
		"}",
		"",
		`function ${toIdentifier(sessionLabel)}ApplyAssistantContent(state: ${stateType}, content: string): ${stateType} {`,
		`  const messages = [...state.${messagesField}];`,
		"  for (let index = messages.length - 1; index >= 0; index -= 1) {",
		"    const message = messages[index];",
		'    if (message?.role?.kind === "Pending") {',
		"      messages[index] = { role: { kind: \"Assistant\" }, content };",
		`      return { ${messagesField}: messages };`,
		"    }",
		"  }",
		`  return { ${messagesField}: [...messages, { role: { kind: "Assistant" }, content }] };`,
		"}",
		"",
		`function ${toIdentifier(sessionLabel)}UpdatePendingContent(state: ${stateType}, content: string): ${stateType} {`,
		`  const messages = [...state.${messagesField}];`,
		"  for (let index = messages.length - 1; index >= 0; index -= 1) {",
		"    const message = messages[index];",
		'    if (message?.role?.kind === "Pending") {',
		"      messages[index] = { ...message, content };",
		`      return { ${messagesField}: messages };`,
		"    }",
		"  }",
		"  return state;",
		"}",
		"",
		`export async function* ${semanticFunctionName(sessionLabel, "session", "session")}StreamResponse(`,
		`  state: ${stateType},`,
		...(streamAction?.kind === "function" ? streamAction.params.map((param) => `  ${param.name}: ${emitParamType(param.type)},`) : []),
		`  ${logParam}?: PointSessionLog<${eventType}> | null,`,
		`): AsyncGenerator<${eventType}, ${stateType}, void> {`,
		`  const startEvent: ${eventType} = {`,
		`    schemaVersion: "${SESSION_EVENT_SCHEMA}",`,
		`    session: ${JSON.stringify(sessionLabel)},`,
		`    phase: "start",`,
		"    at: pointSessionNow(),",
		"  };",
		`  pointSessionEmitLog(${logParam}, startEvent);`,
		"  yield startEvent;",
		`  const result = ${streamCall};`,
		"  if (pointIsSessionError(result)) {",
		`    const failureEvent: ${eventType} = {`,
		`      schemaVersion: "${SESSION_EVENT_SCHEMA}",`,
		`      session: ${JSON.stringify(sessionLabel)},`,
		`      phase: "failure",`,
		"      at: pointSessionNow(),",
		"      ok: false,",
		"      error: { message: result.message },",
		"    };",
		`    pointSessionEmitLog(${logParam}, failureEvent);`,
		"    yield failureEvent;",
		"    return state;",
		"  }",
		"  let content = \"\";",
		"  let current = state;",
		"  for (const delta of pointSessionChunkText(result)) {",
		"    content += delta;",
		"    current = " + `${toIdentifier(sessionLabel)}UpdatePendingContent(current, content)`,
		`    const chunkEvent: ${eventType} = {`,
		`      schemaVersion: "${SESSION_EVENT_SCHEMA}",`,
		`      session: ${JSON.stringify(sessionLabel)},`,
		`      phase: "chunk",`,
		"      at: pointSessionNow(),",
		"      delta,",
		"      content,",
		"    };",
		`    pointSessionEmitLog(${logParam}, chunkEvent);`,
		"    yield chunkEvent;",
		"  }",
		`  const finalState = ${toIdentifier(sessionLabel)}ApplyAssistantContent(current, content);`,
		`  const completeEvent: ${eventType} = {`,
		`    schemaVersion: "${SESSION_EVENT_SCHEMA}",`,
		`    session: ${JSON.stringify(sessionLabel)},`,
		`    phase: "complete",`,
		"    at: pointSessionNow(),",
		"    ok: true,",
		"  };",
		`  pointSessionEmitLog(${logParam}, completeEvent);`,
		"  yield completeEvent;",
		"  return finalState;",
		"}",
	];
}

function emitParamType(type: { kind: string; name: string; args: unknown[] }): string {
	if (type.name === "List" || type.name === "Maybe" || type.name === "Or") {
		const args = (type.args as { name: string; args: unknown[] }[]).map(emitParamType).join(", ");
		return `${type.name}<${args}>`;
	}
	const primitives = new Set(["Text", "Int", "Float", "Bool", "Void", "Error"]);
	if (primitives.has(type.name)) return type.name;
	return toPascalCase(type.name);
}
