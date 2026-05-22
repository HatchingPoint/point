import type {
	PointSemanticBinding,
	PointSemanticMiddlewareDeclaration,
	PointSemanticRouteDeclaration,
	PointSemanticStreamRouteDeclaration,
} from "../semantic/ast.ts";
import { semanticFunctionName, streamRouteHandlerName, toIdentifier, toPascalCase } from "../semantic/naming.ts";

export const ROUTE_HTTP_INPUTS = new Set(["query", "body", "headers"]);

export interface RouteMatcherSpec {
	method: string;
	pattern: string;
	handlerName: string;
	middlewareNames: string[];
	handlerArgExpressions: string[];
	hasBody: boolean;
}

export interface StreamRouteSpec {
	path: string;
	routeName: string;
	messageFields: string[];
	connectHandler?: string;
	connectStreamAction?: string;
	messageHandler?: string;
	disconnectHandler?: string;
}

export function pathParamInputs(route: PointSemanticRouteDeclaration): PointSemanticBinding[] {
	return route.inputs.filter((input) => !ROUTE_HTTP_INPUTS.has(input.label) && pathSegmentNames(route.path).includes(toPathSegment(input.label)));
}

export function handlerInputs(route: PointSemanticRouteDeclaration): PointSemanticBinding[] {
	return [...pathParamInputs(route), ...route.inputs.filter((input) => ROUTE_HTTP_INPUTS.has(input.label))];
}

export function pathSegmentNames(path: string): string[] {
	const segments: string[] = [];
	for (const part of path.split("/")) {
		if (part.startsWith(":")) segments.push(part.slice(1));
	}
	return segments;
}

export function toPathSegment(label: string): string {
	return toIdentifier(label);
}

export function routeMatcherSpec(route: PointSemanticRouteDeclaration): RouteMatcherSpec {
	const handlerName = semanticFunctionName(route.name, "route", "route");
	const pattern = route.path.replace(/:[A-Za-z][A-Za-z0-9_]*/g, "([^/]+)").replace(/\//g, "\\/");
	const pathParams = pathParamInputs(route);
	const pathArgExpressions = pathParams.map((_input, index) => `match[${index + 1}]`);
	const handlerArgs: string[] = [...pathArgExpressions];
	for (const input of route.inputs) {
		if (input.label === "query") handlerArgs.push("queryRecord");
		if (input.label === "body") handlerArgs.push("bodyRecord");
		if (input.label === "headers") handlerArgs.push("headerRecord");
	}
	return {
		method: route.method.toUpperCase(),
		pattern,
		handlerName,
		middlewareNames: route.before,
		handlerArgExpressions: handlerArgs,
		hasBody: route.inputs.some((input) => input.label === "body"),
	};
}

export function streamRouteSpec(
	streamRoute: PointSemanticStreamRouteDeclaration,
	records: Map<string, Map<string, string>>,
	actionFnByName: Map<string, string>,
): StreamRouteSpec {
	const messageFields = recordFieldNamesForType(streamRoute.messageType.name, records);
	const connectHandler = streamRoute.handlers.find((handler) => handler.event === "connect");
	const messageHandler = streamRoute.handlers.find((handler) => handler.event === "message");
	const disconnectHandler = streamRoute.handlers.find((handler) => handler.event === "disconnect");
	const connectStreamAction =
		connectHandler?.mode === "streamFromAction" && connectHandler.actionName
			? actionFnByName.get(connectHandler.actionName)
			: undefined;
	return {
		path: streamRoute.path,
		routeName: streamRoute.name,
		messageFields,
		connectHandler:
			connectHandler?.mode === "return" ? streamRouteHandlerName(streamRoute.name, "connect") : undefined,
		connectStreamAction,
		messageHandler: messageHandler ? streamRouteHandlerName(streamRoute.name, "message") : undefined,
		disconnectHandler: disconnectHandler ? streamRouteHandlerName(streamRoute.name, "disconnect") : undefined,
	};
}

export function middlewareFunctionName(name: string): string {
	return semanticFunctionName(name, "response", "middleware");
}

function recordFieldNamesForType(typeName: string, records: Map<string, Map<string, string>>): string[] {
	const fields = records.get(toPascalCase(typeName)) ?? records.get(typeName);
	if (!fields) return [];
	return [...fields.values()];
}

export function emitRouteRuntimeHelpers(): string[] {
	return [
		"function pointRouteResponse(value, init = {}) {",
		'  if (value instanceof Response) return value;',
		"  const status = init.status ?? 200;",
		'  const headers = { "content-type": "application/json", ...(init.headers ?? {}) };',
		'  const body = typeof value === "string" ? value : JSON.stringify(value);',
		"  return new Response(body, { status, headers });",
		"}",
		"",
		"function pointJsonResponse(body, status = 200, headers = {}) {",
		"  return pointRouteResponse(body, { status, headers });",
		"}",
		"",
		"function pointQueryRecord(searchParams, fields) {",
		"  const record = {};",
		"  for (const field of fields) {",
		"    const value = searchParams.get(field);",
		"    if (value !== null) record[field] = value;",
		"  }",
		"  return record;",
		"}",
		"",
		"function pointHeaderRecord(requestHeaders, fields) {",
		"  const record = {};",
		"  for (const field of fields) {",
		"    const value = requestHeaders.get(field) ?? requestHeaders.get(field.toLowerCase());",
		"    if (value !== null && value !== undefined) record[field] = value;",
		"  }",
		"  return record;",
		"}",
		"",
		"async function pointBodyRecord(request, fields) {",
		'  const contentType = request.headers.get("content-type") ?? "";',
		'  if (!contentType.includes("application/json")) return {};',
		"  try {",
		"    const parsed = await request.json();",
		'    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};',
		"    const record = {};",
		"    for (const field of fields) {",
		"      if (Object.prototype.hasOwnProperty.call(parsed, field)) record[field] = parsed[field];",
		"    }",
		"    return record;",
		"  } catch {",
		"    return {};",
		"  }",
		"}",
		"",
		"function pointParseStreamMessage(rawMessage, fields) {",
		"  let parsed = rawMessage;",
		'  if (typeof rawMessage === "string") {',
		"    try {",
		"      parsed = JSON.parse(rawMessage);",
		"    } catch {",
		"      parsed = {};",
		"    }",
		"  }",
		'  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {};',
		"  const record = {};",
		"  for (const field of fields) {",
		"    if (Object.prototype.hasOwnProperty.call(parsed, field)) record[field] = parsed[field];",
		"  }",
		"  return record;",
		"}",
		"",
		"function pointSendStreamPayload(ws, value) {",
		"  if (value == null) return;",
		'  ws.send(typeof value === "string" ? value : JSON.stringify(value));',
		"}",
		"",
		"function pointWrapStreamLine(line, fields) {",
		"  if (fields.length === 1) return { [fields[0]]: line };",
		"  return { line };",
		"}",
		"",
		"const POINT_STREAM_BACKPRESSURE_LIMIT = 65536;",
		"",
		"async function pointPumpProcessStreamToWebSocket(ws, streamFactory, messageFields) {",
		"  const stream = streamFactory();",
		"  try {",
		"    for await (const line of stream) {",
		"      if (ws.readyState !== 1) break;",
		"      if (ws.bufferedAmount > POINT_STREAM_BACKPRESSURE_LIMIT) continue;",
		"      pointSendStreamPayload(ws, pointWrapStreamLine(line, messageFields));",
		"    }",
		"  } catch {",
		"    /* stream ended */",
		"  }",
		"}",
	];
}

function typeName(type: { name: string }): string {
	return type.name;
}

export function recordFieldNames(
	route: PointSemanticRouteDeclaration,
	label: "query" | "body" | "headers",
	records: Map<string, Map<string, string>>,
): string[] {
	const binding = route.inputs.find((input) => input.label === label);
	if (!binding) return [];
	const fields = records.get(toPascalCase(typeName(binding.type))) ?? records.get(typeName(binding.type));
	if (!fields) return [];
	return [...fields.values()];
}

function extractedArgExpression(route: PointSemanticRouteDeclaration, label: string): string | null {
	if (label === "query") return "queryRecord";
	if (label === "body") return "bodyRecord";
	if (label === "headers") return "headerRecord";
	const pathIndex = pathParamInputs(route).findIndex((input) => input.label === label);
	if (pathIndex >= 0) return `match[${pathIndex + 1}]`;
	return null;
}

export function middlewareArgExpressions(
	route: PointSemanticRouteDeclaration,
	middleware: PointSemanticMiddlewareDeclaration,
): string[] {
	return middleware.inputs.map((input) => {
		const expression = extractedArgExpression(route, input.label);
		if (!expression) throw new Error(`Middleware ${middleware.name} input ${input.label} is not available on route ${route.name}`);
		return expression;
	});
}

export function emitRouteMatchBlock(
	matcher: RouteMatcherSpec,
	route: PointSemanticRouteDeclaration,
	middlewareByName: Map<string, PointSemanticMiddlewareDeclaration>,
	records: Map<string, Map<string, string>>,
): string[] {
	const lines: string[] = [];
	lines.push(`  if (req.method === ${JSON.stringify(matcher.method)} && new RegExp(${JSON.stringify(`^${matcher.pattern}$`)}).test(url.pathname)) {`);
	lines.push(`    const match = url.pathname.match(new RegExp(${JSON.stringify(`^${matcher.pattern}$`)}));`);
	if (route.inputs.some((input) => input.label === "query")) {
		lines.push(`    const queryRecord = pointQueryRecord(url.searchParams, ${JSON.stringify(recordFieldNames(route, "query", records))});`);
	}
	if (route.inputs.some((input) => input.label === "headers")) {
		lines.push(`    const headerRecord = pointHeaderRecord(req.headers, ${JSON.stringify(recordFieldNames(route, "headers", records))});`);
	}
	if (route.inputs.some((input) => input.label === "body")) {
		lines.push(`    const bodyRecord = await pointBodyRecord(req, ${JSON.stringify(recordFieldNames(route, "body", records))});`);
	}
	for (const middlewareName of matcher.middlewareNames) {
		const middleware = middlewareByName.get(middlewareName);
		if (!middleware) continue;
		const mwName = middlewareFunctionName(middlewareName);
		const mwArgs = middlewareArgExpressions(route, middleware);
		lines.push("    {");
		lines.push(`      const middlewareResult = ${mwName}(${mwArgs.join(", ")});`);
		lines.push("      if (middlewareResult != null) return pointRouteResponse(middlewareResult, { status: 401 });");
		lines.push("    }");
	}
	lines.push(`    const handlerResult = ${matcher.handlerName}(${matcher.handlerArgExpressions.join(", ")});`);
	lines.push("    return pointRouteResponse(await handlerResult);");
	lines.push("  }");
	return lines;
}

function emitStreamRouteUpgradeBlock(spec: StreamRouteSpec): string[] {
	return [
		`  if (url.pathname === ${JSON.stringify(spec.path)}) {`,
		`    const upgraded = server.upgrade(req, { data: { route: ${JSON.stringify(spec.routeName)} } });`,
		"    if (upgraded) return undefined;",
		'    return new Response(JSON.stringify({ error: "WebSocket upgrade failed" }), { status: 500, headers: { "content-type": "application/json" } });',
		"  }",
	];
}

function emitStreamRouteWebSocketHandlers(specs: StreamRouteSpec[]): string[] {
	const openLines = ["  open(ws) {"];
	for (const spec of specs) {
		if (spec.connectStreamAction) {
			openLines.push(`    if (ws.data.route === ${JSON.stringify(spec.routeName)}) {`);
			openLines.push(`      void pointPumpProcessStreamToWebSocket(ws, () => ${spec.connectStreamAction}(), ${JSON.stringify(spec.messageFields)});`);
			openLines.push("      return;");
			openLines.push("    }");
			continue;
		}
		if (!spec.connectHandler) continue;
		openLines.push(`    if (ws.data.route === ${JSON.stringify(spec.routeName)}) {`);
		openLines.push(`      pointSendStreamPayload(ws, ${spec.connectHandler}());`);
		openLines.push("      return;");
		openLines.push("    }");
	}
	openLines.push("  },");

	const messageLines = ["  message(ws, rawMessage) {"];
	for (const spec of specs) {
		if (!spec.messageHandler) continue;
		messageLines.push(`    if (ws.data.route === ${JSON.stringify(spec.routeName)}) {`);
		messageLines.push(`      const messageRecord = pointParseStreamMessage(rawMessage, ${JSON.stringify(spec.messageFields)});`);
		messageLines.push(`      pointSendStreamPayload(ws, ${spec.messageHandler}(messageRecord));`);
		messageLines.push("      return;");
		messageLines.push("    }");
	}
	messageLines.push("  },");

	const closeLines = ["  close(ws) {"];
	for (const spec of specs) {
		if (!spec.disconnectHandler) continue;
		closeLines.push(`    if (ws.data.route === ${JSON.stringify(spec.routeName)}) {`);
		closeLines.push(`      ${spec.disconnectHandler}();`);
		closeLines.push("      return;");
		closeLines.push("    }");
	}
	closeLines.push("  },");

	return [
		"export function createPointRouteWebSocketHandlers() {",
		"  return {",
		...openLines,
		...messageLines,
		...closeLines,
		"  };",
		"}",
	];
}

export function emitRouteServerRuntime(
	routes: PointSemanticRouteDeclaration[],
	streamRoutes: PointSemanticStreamRouteDeclaration[],
	middlewareByName: Map<string, PointSemanticMiddlewareDeclaration>,
	records: Map<string, Map<string, string>>,
	actionFnByName: Map<string, string> = new Map(),
): string[] {
	const matchLines = routes.flatMap((route) => emitRouteMatchBlock(routeMatcherSpec(route), route, middlewareByName, records));
	const streamSpecs = streamRoutes.map((streamRoute) => streamRouteSpec(streamRoute, records, actionFnByName));
	const streamUpgradeLines = streamSpecs.flatMap((spec) => emitStreamRouteUpgradeBlock(spec));
	const fetchParams = streamRoutes.length > 0 ? "req, server" : "req";
	return [
		...emitRouteRuntimeHelpers(),
		"",
		"export function createPointRouteFetchHandler() {",
		`  return async (${fetchParams}) => {`,
		"    const url = new URL(req.url);",
		...streamUpgradeLines,
		...matchLines,
		'    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });',
		"  };",
		"}",
		"",
		...(streamRoutes.length > 0 ? ["", ...emitStreamRouteWebSocketHandlers(streamSpecs), ""] : []),
		"export function startRoutesServer() {",
		"  const port = Number(process.env.PORT ?? 0);",
		...(streamRoutes.length > 0
			? [
					"  return Bun.serve({",
					"    port,",
					"    fetch: createPointRouteFetchHandler(),",
					"    websocket: createPointRouteWebSocketHandlers(),",
					"  });",
				]
			: ["  return Bun.serve({ port, fetch: createPointRouteFetchHandler() });"]),
		"}",
	];
}
