import type {
	PointSemanticMiddlewareDeclaration,
	PointSemanticRouteDeclaration,
} from "../semantic/ast.ts";
import {
	middlewareFunctionName,
	pathParamInputs,
	recordFieldNames,
	routeMatcherSpec,
	type RouteMatcherSpec,
} from "./emit-routes.ts";

function pythonExtractedArgExpression(route: PointSemanticRouteDeclaration, label: string): string | null {
	if (label === "query") return "query_record";
	if (label === "body") return "body_record";
	if (label === "headers") return "header_record";
	const pathIndex = pathParamInputs(route).findIndex((input) => input.label === label);
	if (pathIndex >= 0) return `match.group(${pathIndex + 1})`;
	return null;
}

function pythonMiddlewareArgExpressions(
	route: PointSemanticRouteDeclaration,
	middleware: PointSemanticMiddlewareDeclaration,
): string[] {
	return middleware.inputs.map((input) => {
		const expression = pythonExtractedArgExpression(route, input.label);
		if (!expression) throw new Error(`Middleware ${middleware.name} input ${input.label} is not available on route ${route.name}`);
		return expression;
	});
}

function pythonHandlerArgExpressions(matcher: RouteMatcherSpec, route: PointSemanticRouteDeclaration): string[] {
	return matcher.handlerArgExpressions.map((expression) => {
		const pathMatch = expression.match(/^match\[(\d+)\]$/);
		if (pathMatch) return `match.group(${pathMatch[1]})`;
		if (expression === "queryRecord") return "query_record";
		if (expression === "bodyRecord") return "body_record";
		if (expression === "headerRecord") return "header_record";
		return expression;
	});
}

export function emitPythonRouteRuntimeHelpers(): string[] {
	return [
		"def point_route_response(value, status: int = 200, headers: dict[str, str] | None = None):",
		'    if isinstance(value, tuple) and len(value) == 3:',
		"        return value",
		"    merged = {\"content-type\": \"application/json\", **(headers or {})}",
		"    if isinstance(value, str):",
		"        body = value.encode(\"utf-8\")",
		"    else:",
		"        body = json.dumps(value).encode(\"utf-8\")",
		"    return status, merged, body",
		"",
		"def point_json_response(body, status: int = 200, headers: dict[str, str] | None = None):",
		"    return point_route_response(body, status, headers)",
		"",
		"def point_query_record(query_params: dict[str, list[str]], fields: list[str]) -> dict[str, str]:",
		"    record: dict[str, str] = {}",
		"    for field in fields:",
		"        values = query_params.get(field)",
		"        record[field] = values[0] if values else \"\"",
		"    return record",
		"",
		"def point_header_record(request_headers, fields: list[str]) -> dict[str, str]:",
		"    record: dict[str, str] = {}",
		"    for field in fields:",
		"        value = request_headers.get(field) or request_headers.get(field.lower())",
		"        record[field] = value if value is not None else \"\"",
		"    return record",
		"",
		"def point_body_record(body_bytes: bytes, content_type: str | None, fields: list[str]) -> dict:",
		'    if "application/json" not in (content_type or ""):',
		"        return {}",
		"    try:",
		"        parsed = json.loads(body_bytes.decode(\"utf-8\") if body_bytes else \"{}\")",
		"        if not isinstance(parsed, dict):",
		"            return {}",
		"        record: dict = {}",
		"        for field in fields:",
		"            if field in parsed:",
		"                record[field] = parsed[field]",
		"        return record",
		"    except Exception:",
		"        return {}",
	];
}

export function emitPythonRouteMatchBlock(
	matcher: RouteMatcherSpec,
	route: PointSemanticRouteDeclaration,
	middlewareByName: Map<string, PointSemanticMiddlewareDeclaration>,
	records: Map<string, Map<string, string>>,
): string[] {
	const pattern = `^${matcher.pattern}$`;
	const lines: string[] = [];
	lines.push(`    if method == ${JSON.stringify(matcher.method)} and re.fullmatch(${JSON.stringify(pattern)}, path):`);
	lines.push(`        match = re.fullmatch(${JSON.stringify(pattern)}, path)`);
	if (route.inputs.some((input) => input.label === "query")) {
		lines.push(`        query_record = point_query_record(query_params, ${JSON.stringify(recordFieldNames(route, "query", records))})`);
	}
	if (route.inputs.some((input) => input.label === "headers")) {
		lines.push(`        header_record = point_header_record(headers, ${JSON.stringify(recordFieldNames(route, "headers", records))})`);
	}
	if (route.inputs.some((input) => input.label === "body")) {
		lines.push(`        body_record = point_body_record(body_bytes, headers.get("Content-Type"), ${JSON.stringify(recordFieldNames(route, "body", records))})`);
	}
	for (const middlewareName of matcher.middlewareNames) {
		const middleware = middlewareByName.get(middlewareName);
		if (!middleware) continue;
		const mwName = middlewareFunctionName(middlewareName);
		const mwArgs = pythonMiddlewareArgExpressions(route, middleware);
		lines.push(`        middleware_result = ${mwName}(${mwArgs.join(", ")})`);
		lines.push("        if middleware_result is not None:");
		lines.push("            return point_route_response(middleware_result, status=401)");
	}
	const handlerArgs = pythonHandlerArgExpressions(matcher, route);
	lines.push(`        handler_result = ${matcher.handlerName}(${handlerArgs.join(", ")})`);
	lines.push("        return point_route_response(handler_result)");
	return lines;
}

export function emitPythonRouteServerRuntime(
	routes: PointSemanticRouteDeclaration[],
	middlewareByName: Map<string, PointSemanticMiddlewareDeclaration>,
	records: Map<string, Map<string, string>>,
): string[] {
	const matchLines = routes.flatMap((route) =>
		emitPythonRouteMatchBlock(routeMatcherSpec(route), route, middlewareByName, records),
	).map((line) => `    ${line}`);
	return [
		"# Route runtime uses stdlib http.server (no FastAPI dependency).",
		...emitPythonRouteRuntimeHelpers(),
		"",
		"def create_point_route_handler():",
		"    def handle_point_route(method: str, path: str, headers, body_bytes: bytes, query_params: dict[str, list[str]]):",
		...matchLines,
		'        return point_route_response({"error": "Not found"}, status=404)',
		"    return handle_point_route",
		"",
		"def start_routes_server():",
		"    from http.server import BaseHTTPRequestHandler, HTTPServer",
		"    from urllib.parse import parse_qs, urlparse",
		"",
		"    route_handler = create_point_route_handler()",
		"",
		"    class PointHTTPRequestHandler(BaseHTTPRequestHandler):",
		"        def _dispatch(self) -> None:",
		"            parsed = urlparse(self.path)",
		"            query_params = parse_qs(parsed.query, keep_blank_values=True)",
		"            content_length = int(self.headers.get(\"Content-Length\", \"0\") or \"0\")",
		"            body_bytes = self.rfile.read(content_length) if content_length else b\"\"",
		"            result = route_handler(self.command, parsed.path, self.headers, body_bytes, query_params)",
		"            status, resp_headers, body = result",
		"            self.send_response(status)",
		"            for key, value in resp_headers.items():",
		"                self.send_header(key, value)",
		"            self.send_header(\"Content-Length\", str(len(body)))",
		"            self.end_headers()",
		"            self.wfile.write(body)",
		"",
		"        def do_GET(self) -> None:",
		"            self._dispatch()",
		"",
		"        def do_POST(self) -> None:",
		"            self._dispatch()",
		"",
		"        def do_PUT(self) -> None:",
		"            self._dispatch()",
		"",
		"        def do_PATCH(self) -> None:",
		"            self._dispatch()",
		"",
		"        def do_DELETE(self) -> None:",
		"            self._dispatch()",
		"",
		"        def log_message(self, _format: str, *_args) -> None:",
		"            return",
		"",
		"    port = int(os.environ.get(\"PORT\", \"3456\"))",
		"    server = HTTPServer((\"\", port), PointHTTPRequestHandler)",
		"    bound_port = server.server_address[1]",
		"    print(f\"Routes listening on http://localhost:{bound_port}\")",
		"    server.serve_forever()",
		"    return server",
	];
}

export function emitPythonRouteServeCommand(functionName: string, params: string[]): string[] {
	return [
		`def ${functionName}(${params.join(", ")}) -> str:`,
		"    start_routes_server()",
		'    return "Routes server stopped"',
	];
}
