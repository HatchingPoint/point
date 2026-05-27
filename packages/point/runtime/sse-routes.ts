import type { PointCoreProgram } from "../src/core/ast.ts";
import { sseRouteSpec, type SseRouteSpec } from "../src/core/emit-routes.ts";
import type { PointSemanticSseRouteDeclaration } from "../src/semantic/ast.ts";
import { toIdentifier, toPascalCase } from "../src/semantic/naming.ts";
import { interpretCoreStreamActionAsync } from "./interpreter/index.ts";

export type RuntimeSseRoute = SseRouteSpec & {
	readonly method: "GET";
};

export function collectRuntimeSseRoutes(program: PointCoreProgram): RuntimeSseRoute[] {
	const semantic = program.semanticSource;
	if (!semantic) return [];
	const records = buildRecordFieldMap(semantic.declarations);
	const actionFnByName = buildActionFnMap(program);
	return semantic.declarations
		.filter((declaration): declaration is PointSemanticSseRouteDeclaration => declaration.kind === "sseRoute")
		.map((route) => ({ ...sseRouteSpec(route, records, actionFnByName), method: "GET" as const }));
}

function buildActionFnMap(program: PointCoreProgram): Map<string, string> {
	const actionFnByName = new Map<string, string>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "function" && declaration.semantic?.kind === "action") {
			actionFnByName.set(declaration.semantic.name, declaration.name);
		}
	}
	return actionFnByName;
}

function buildRecordFieldMap(
	declarations: Array<{ kind: string; name?: string; fields?: Array<{ label: string }> }>,
): Map<string, Map<string, string>> {
	const records = new Map<string, Map<string, string>>();
	for (const declaration of declarations) {
		if (declaration.kind !== "record" || !declaration.name || !declaration.fields) continue;
		const fields = new Map<string, string>();
		for (const field of declaration.fields) {
			fields.set(field.label, toIdentifier(field.label));
		}
		records.set(toPascalCase(declaration.name), fields);
	}
	return records;
}

export function wrapStreamLine(line: string, messageFields: string[]): Record<string, string> {
	if (messageFields.length === 1) return { [messageFields[0]!]: line };
	return { line };
}

export async function pumpStreamToSseResponse(
	source: AsyncIterable<string>,
	messageFields: string[],
): Promise<Response> {
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const line of source) {
					const payload = wrapStreamLine(line, messageFields);
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
				}
			} catch {
				/* stream ended */
			} finally {
				controller.close();
			}
		},
	});
	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache",
			connection: "keep-alive",
		},
	});
}

export async function handleRuntimeSseRoute(program: PointCoreProgram, spec: RuntimeSseRoute): Promise<Response | null> {
	if (!spec.connectStreamAction) return null;
	const source = await interpretCoreStreamActionAsync(program, spec.connectStreamAction);
	return pumpStreamToSseResponse(source, spec.messageFields);
}
