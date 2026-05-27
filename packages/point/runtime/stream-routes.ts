import type { PointCoreProgram } from "../src/core/ast.ts";
import { streamRouteSpec, type StreamRouteSpec } from "../src/core/emit-routes.ts";
import type { PointSemanticStreamRouteDeclaration } from "../src/semantic/ast.ts";
import { toIdentifier, toPascalCase } from "../src/semantic/naming.ts";
import { interpretCoreProgramEntryAsync, interpretCoreStreamActionAsync, type PointRuntimeValue } from "./interpreter/index.ts";
import { wrapStreamLine } from "./sse-routes.ts";

export type RuntimeStreamRoute = StreamRouteSpec;

const STREAM_BACKPRESSURE_LIMIT = 65536;

type RuntimeWebSocket = ServerWebSocket<{ route: string }>;

export function collectRuntimeStreamRoutes(program: PointCoreProgram): RuntimeStreamRoute[] {
	const semantic = program.semanticSource;
	if (!semantic) return [];
	const records = buildRecordFieldMap(semantic.declarations);
	const actionFnByName = buildActionFnMap(program);
	return semantic.declarations
		.filter((declaration): declaration is PointSemanticStreamRouteDeclaration => declaration.kind === "streamRoute")
		.map((route) => streamRouteSpec(route, records, actionFnByName));
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

export function parseStreamMessage(rawMessage: string | Buffer, messageFields: string[]): Record<string, PointRuntimeValue> {
	let parsed: unknown = rawMessage;
	if (typeof rawMessage === "string") {
		try {
			parsed = JSON.parse(rawMessage);
		} catch {
			parsed = {};
		}
	} else {
		try {
			parsed = JSON.parse(new TextDecoder().decode(rawMessage));
		} catch {
			parsed = {};
		}
	}
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {};
	const record: Record<string, PointRuntimeValue> = {};
	for (const field of messageFields) {
		if (Object.prototype.hasOwnProperty.call(parsed, field)) {
			record[field] = (parsed as Record<string, PointRuntimeValue>)[field] ?? null;
		}
	}
	return record;
}

function sendStreamPayload(ws: RuntimeWebSocket, value: PointRuntimeValue): void {
	if (value == null) return;
	ws.send(typeof value === "string" ? value : JSON.stringify(value));
}

function isProcessStreamChunkPayload(messageFields: string[]): boolean {
	return messageFields.length === 2 && new Set(messageFields).has("stream") && new Set(messageFields).has("text");
}

export async function pumpProcessStreamToWebSocket(
	ws: RuntimeWebSocket,
	source: AsyncIterable<string>,
	messageFields: string[],
): Promise<void> {
	try {
		if (isProcessStreamChunkPayload(messageFields)) {
			const iterator = source[Symbol.asyncIterator]();
			let iterResult = await iterator.next();
			while (!iterResult.done) {
				const line = iterResult.value;
				if (ws.readyState !== WebSocket.OPEN) break;
				if (ws.bufferedAmount <= STREAM_BACKPRESSURE_LIMIT) {
					sendStreamPayload(ws, { stream: "stdout", text: String(line) });
				}
				iterResult = await iterator.next();
			}
			const ret = iterResult.value;
			if (ret && typeof ret === "object" && !Array.isArray(ret)) {
				if ("message" in ret && typeof ret.message === "string") {
					sendStreamPayload(ws, { stream: "stderr", text: ret.message });
				} else {
					if ("stderr" in ret && ret.stderr != null && String(ret.stderr).length > 0) {
						for (const errLine of String(ret.stderr).split(/\r?\n/)) {
							if (!errLine) continue;
							if (ws.readyState !== WebSocket.OPEN) break;
							sendStreamPayload(ws, { stream: "stderr", text: errLine });
						}
					}
					if ("exitCode" in ret && ret.exitCode != null) {
						sendStreamPayload(ws, { stream: "exit", text: String(ret.exitCode) });
					}
				}
			}
			return;
		}
		for await (const line of source) {
			if (ws.readyState !== WebSocket.OPEN) break;
			if (ws.bufferedAmount > STREAM_BACKPRESSURE_LIMIT) continue;
			sendStreamPayload(ws, wrapStreamLine(line, messageFields));
		}
	} catch {
		/* stream ended */
	}
}

export function tryUpgradeRuntimeStreamRoute(
	program: PointCoreProgram,
	request: Request,
	server: { upgrade: (request: Request, options: { data: { route: string } }) => boolean },
): Response | undefined {
	const url = new URL(request.url);
	for (const spec of collectRuntimeStreamRoutes(program)) {
		if (url.pathname !== spec.path) continue;
		const upgraded = server.upgrade(request, { data: { route: spec.routeName } });
		if (upgraded) return undefined;
		return new Response(JSON.stringify({ error: "WebSocket upgrade failed" }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
	return undefined;
}

export function createRuntimeWebSocketHandlers(program: PointCoreProgram) {
	const specs = collectRuntimeStreamRoutes(program);
	const specByRoute = new Map(specs.map((spec) => [spec.routeName, spec]));

	return {
		open(ws: RuntimeWebSocket) {
			const spec = specByRoute.get(ws.data.route);
			if (!spec) return;
			void (async () => {
				if (spec.connectStreamAction) {
					const source = await interpretCoreStreamActionAsync(program, spec.connectStreamAction);
					await pumpProcessStreamToWebSocket(ws, source, spec.messageFields);
					return;
				}
				if (spec.connectHandler) {
					sendStreamPayload(ws, await interpretCoreProgramEntryAsync(program, spec.connectHandler));
				}
			})().catch(() => {
				/* stream/connect failed */
			});
		},
		message(ws: RuntimeWebSocket, rawMessage: string | Buffer) {
			const spec = specByRoute.get(ws.data.route);
			if (!spec?.messageHandler) return;
			void (async () => {
				const messageRecord = parseStreamMessage(rawMessage, spec.messageFields);
				sendStreamPayload(ws, await interpretCoreProgramEntryAsync(program, spec.messageHandler!, [messageRecord]));
			})().catch(() => {
				/* message handler failed */
			});
		},
		close(ws: RuntimeWebSocket) {
			const spec = specByRoute.get(ws.data.route);
			if (!spec?.disconnectHandler) return;
			void interpretCoreProgramEntryAsync(program, spec.disconnectHandler).catch(() => {
				/* disconnect handler failed */
			});
		},
	};
}
