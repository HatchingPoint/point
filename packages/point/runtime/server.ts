import type { PointCoreDeclaration, PointCoreProgram } from "../src/core/ast.ts";
import { checkPointCore } from "../src/core/check.ts";
import {
	handlerInputs,
	middlewareArgExpressions,
	pathParamInputs,
	pathSegmentNames,
	toPathSegment,
} from "../src/core/emit-routes.ts";
import type { PointSemanticMiddlewareDeclaration, PointSemanticRouteDeclaration } from "../src/semantic/ast.ts";
import { semanticFunctionName } from "../src/semantic/naming.ts";
import { interpretCoreProgramEntryAsync, type PointRuntimeJsonResponse, type PointRuntimeValue } from "./interpreter/index.ts";
import { renderPointRuntimePage } from "./ssr/index.ts";
import { servePointUiCss } from "./ssr/theme-ssr.ts";
import { collectRuntimeSseRoutes, handleRuntimeSseRoute } from "./sse-routes.ts";
import { collectRuntimeStreamRoutes, createRuntimeWebSocketHandlers, tryUpgradeRuntimeStreamRoute } from "./stream-routes.ts";

type RuntimeFetchServer = { upgrade: (request: Request, options: { data: { route: string } }) => boolean };

export type PointRuntimeRoute = {
	readonly method: string;
	readonly path: string;
	readonly name: string;
};

export type PointRuntimeRouteRegistry = {
	readonly routes: PointRuntimeRoute[];
	fetch(request: Request, server?: RuntimeFetchServer): Promise<Response | undefined>;
};

type RouteRegistration = {
	route: PointSemanticRouteDeclaration;
	handlerName: string;
	middleware: Array<{ declaration: PointSemanticMiddlewareDeclaration; handlerName: string }>;
	pattern: RegExp;
};

export function registerRuntimeRoutes(program: PointCoreProgram): PointRuntimeRouteRegistry {
	const diagnostics = checkPointCore(program);
	if (diagnostics.length > 0) {
		throw new Error(`Cannot register runtime routes for unchecked program: ${diagnostics.length} diagnostic(s).`);
	}
	const semantic = program.semanticSource;
	if (!semantic) {
		return { routes: [], fetch: async () => jsonResponse({ error: "Not found" }, 404) };
	}
	const middlewareByName = new Map(
		semantic.declarations
			.filter((declaration): declaration is PointSemanticMiddlewareDeclaration => declaration.kind === "middleware")
			.map((declaration) => [declaration.name, declaration]),
	);
	const registrations: RouteRegistration[] = semantic.declarations
		.filter((declaration): declaration is PointSemanticRouteDeclaration => declaration.kind === "route")
		.map((route) => ({
			route,
			handlerName: semanticFunctionName(route.name, "route", "route"),
			middleware: route.before.flatMap((name) => {
				const declaration = middlewareByName.get(name);
				return declaration ? [{ declaration, handlerName: semanticFunctionName(name, "response", "middleware") }] : [];
			}),
			pattern: pathPattern(route.path),
		}));
	const sseRoutes = collectRuntimeSseRoutes(program);
	const streamRoutes = collectRuntimeStreamRoutes(program);

	return {
		routes: [
			...registrations.map(({ route }) => ({ method: route.method.toUpperCase(), path: route.path, name: route.name })),
			...sseRoutes.map((route) => ({ method: route.method, path: route.path, name: route.routeName })),
			...streamRoutes.map((route) => ({ method: "GET", path: route.path, name: route.routeName })),
		],
		async fetch(request: Request, server?: RuntimeFetchServer): Promise<Response | undefined> {
			return handleRuntimeRoute(program, registrations, request, server);
		},
	};
}

export function createPointRuntimeFetchHandler(
	program: PointCoreProgram,
): (request: Request, server?: RuntimeFetchServer) => Promise<Response | undefined> {
	const registry = registerRuntimeRoutes(program);
	return (request, server) => registry.fetch(request, server);
}

export type PointRuntimeDevOptions = {
	port: number;
};

export type PointRuntimeServeOptions = {
	port: number;
};

export type PointRuntimeServerOptions = {
	port?: number;
	hostname?: string;
};

export type PointRuntimeServer = ReturnType<typeof Bun.serve>;
export type PointRuntimeDevServer = PointRuntimeServer;

export function createPointRuntimeDevFetchHandler(
	filePath: string,
	program: PointCoreProgram,
): (request: Request, server?: RuntimeFetchServer) => Promise<Response | undefined> {
	const routes = registerRuntimeRoutes(program);
	return async (request: Request, server?: RuntimeFetchServer) => {
		const url = new URL(request.url);
		if (url.pathname === "/" || url.pathname === "/runtime") {
			return jsonResponse({
				schemaVersion: "point.runtime.dev.v1",
				ok: true,
				file: filePath,
				module: program.module ?? null,
				commands: runtimeCommands(program).map((command) => command.semantic?.name ?? command.name),
				routes: routes.routes,
			});
		}
		if (request.method === "GET" && url.pathname.startsWith("/runtime/command/")) {
			const commandName = decodeURIComponent(url.pathname.slice("/runtime/command/".length));
			const command = runtimeCommands(program).find((candidate) => candidate.semantic?.name === commandName || candidate.name === commandName);
			if (!command) return jsonResponse({ ok: false, error: `Unknown command ${commandName}` }, 404);
			const value = await interpretCoreProgramEntryAsync(program, command.name);
			return jsonResponse({ ok: true, command: command.semantic?.name ?? command.name, value });
		}
		return routes.fetch(request, server);
	};
}

function createRuntimeServeOptions(program: PointCoreProgram) {
	const streamRoutes = collectRuntimeStreamRoutes(program);
	const fetch = createPointRuntimeFetchHandler(program);
	return {
		fetch,
		...(streamRoutes.length > 0 ? { websocket: createRuntimeWebSocketHandlers(program) } : {}),
	};
}

export function startPointRuntimeServer(program: PointCoreProgram, options: PointRuntimeServerOptions = {}): PointRuntimeServer {
	return Bun.serve({
		port: options.port ?? 0,
		hostname: options.hostname,
		...createRuntimeServeOptions(program),
	});
}

export async function runPointRuntimeDev(filePath: string, program: PointCoreProgram, options: PointRuntimeDevOptions): Promise<PointRuntimeDevServer> {
	const streamRoutes = collectRuntimeStreamRoutes(program);
	const server = Bun.serve({
		port: options.port,
		fetch: createPointRuntimeDevFetchHandler(filePath, program),
		...(streamRoutes.length > 0 ? { websocket: createRuntimeWebSocketHandlers(program) } : {}),
	});
	console.log(`Point runtime dev listening on http://localhost:${server.port}`);
	await new Promise<void>(() => {});
	return server;
}

export async function runPointRuntimeServe(filePath: string, program: PointCoreProgram, options: PointRuntimeServeOptions): Promise<PointRuntimeServer> {
	const server = startPointRuntimeServer(program, { port: options.port });
	console.log(`Point runtime HTTP listening on http://localhost:${server.port} for ${filePath}`);
	await new Promise<void>(() => {});
	return server;
}

async function handleRuntimeRoute(
	program: PointCoreProgram,
	registrations: RouteRegistration[],
	request: Request,
	server?: RuntimeFetchServer,
): Promise<Response | undefined> {
	const url = new URL(request.url);
	if (request.method === "GET" && url.pathname === "/point-ui.css") return servePointUiCss();
	if (server) {
		const upgraded = tryUpgradeRuntimeStreamRoute(program, request, server);
		if (upgraded !== undefined) return upgraded;
	}
	if (request.method === "GET") {
		for (const sseRoute of collectRuntimeSseRoutes(program)) {
			if (url.pathname !== sseRoute.path) continue;
			const response = await handleRuntimeSseRoute(program, sseRoute);
			if (response) return response;
		}
	}
	for (const registration of registrations) {
		if (request.method.toUpperCase() !== registration.route.method.toUpperCase()) continue;
		const match = url.pathname.match(registration.pattern);
		if (!match) continue;

		const routeValues = await routeInputValues(registration.route, request, url, match);
		for (const middleware of registration.middleware) {
			const middlewareArgs = middlewareArgExpressions(registration.route, middleware.declaration).map((expression) =>
				valueForExpression(expression, routeValues, match),
			);
			const result = await interpretCoreProgramEntryAsync(program, middleware.handlerName, middlewareArgs);
			if (result !== null) return runtimeValueToResponse(result, 401);
		}

		const args = handlerInputs(registration.route).map((input) => routeValues[input.label] ?? null);
		return runtimeValueToResponse(await interpretCoreProgramEntryAsync(program, registration.handlerName, args));
	}
	const page = await renderPointRuntimePage(program, request);
	if (page) return page;
	return jsonResponse({ error: "Not found" }, 404);
}

async function routeInputValues(
	route: PointSemanticRouteDeclaration,
	request: Request,
	url: URL,
	match: RegExpMatchArray,
): Promise<Record<string, PointRuntimeValue>> {
	const values: Record<string, PointRuntimeValue> = {};
	for (const [index, input] of pathParamInputs(route).entries()) {
		values[input.label] = match[index + 1] ?? "";
	}
	for (const input of route.inputs) {
		if (input.label === "query") values.query = queryRecord(url.searchParams);
		if (input.label === "headers") values.headers = headerRecord(request.headers);
		if (input.label === "body") values.body = await bodyRecord(request);
	}
	return values;
}

function valueForExpression(
	expression: string,
	values: Record<string, PointRuntimeValue>,
	match: RegExpMatchArray,
): PointRuntimeValue {
	if (expression === "queryRecord") return values.query ?? {};
	if (expression === "headerRecord") return values.headers ?? {};
	if (expression === "bodyRecord") return values.body ?? {};
	const matchExpression = expression.match(/^match\[(\d+)\]$/);
	if (matchExpression) return match[Number(matchExpression[1])] ?? "";
	return values[expression] ?? null;
}

function pathPattern(path: string): RegExp {
	const names = new Set(pathSegmentNames(path));
	const escaped = path
		.split("/")
		.map((segment) => {
			if (segment.startsWith(":") && names.has(segment.slice(1))) return "([^/]+)";
			return escapeRegex(segment);
		})
		.join("/");
	return new RegExp(`^${escaped}$`);
}

function queryRecord(searchParams: URLSearchParams): PointRuntimeValue {
	const record: Record<string, PointRuntimeValue> = {};
	for (const [key, value] of searchParams.entries()) record[toPathSegment(key)] = value;
	return record;
}

function headerRecord(headers: Headers): PointRuntimeValue {
	const record: Record<string, PointRuntimeValue> = {};
	for (const [key, value] of headers.entries()) record[toPathSegment(key)] = value;
	return record;
}

async function bodyRecord(request: Request): Promise<PointRuntimeValue> {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) return {};
	const parsed = await request.json().catch(() => ({}));
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
	return parsed as Record<string, PointRuntimeValue>;
}

function runtimeValueToResponse(value: PointRuntimeValue, defaultStatus = 200): Response {
	if (isRuntimeResponse(value)) return jsonResponse(value.body, value.status, value.headers);
	return jsonResponse(value, defaultStatus);
}

function jsonResponse(body: PointRuntimeValue | Record<string, unknown>, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(typeof body === "string" ? body : JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});
}

function isRuntimeResponse(value: PointRuntimeValue): value is PointRuntimeJsonResponse {
	return value !== null && typeof value === "object" && !Array.isArray(value) && "__pointRuntimeResponse" in value;
}

function runtimeCommands(program: PointCoreProgram): Array<Extract<PointCoreDeclaration, { kind: "function" }>> {
	return program.declarations.filter(
		(declaration): declaration is Extract<PointCoreDeclaration, { kind: "function" }> =>
			declaration.kind === "function" && declaration.params.length === 0 && declaration.semantic?.kind === "command",
	);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
