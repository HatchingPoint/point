import type { PointSemanticViewDeclaration, PointSemanticViewStatement } from "./ast.ts";

/** Resolves stream/SSE subscription target from terminal, subscribe to stream, or subscribe to sse view lines. */
export function resolveViewStreamSubscribeStatements(declaration: PointSemanticViewDeclaration): {
	subscribePath: Extract<PointSemanticViewStatement, { kind: "streamSubscribePath" }> | undefined;
	subscribeRoute: Extract<PointSemanticViewStatement, { kind: "streamSubscribeRoute" }> | undefined;
	sseSubscribeRoute: Extract<PointSemanticViewStatement, { kind: "sseSubscribeRoute" }> | undefined;
	isTerminal: boolean;
	hasLegacySubscribe: boolean;
} {
	const terminal = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "terminal" }> => statement.kind === "terminal",
	);
	const legacyPath = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "streamSubscribePath" }> =>
			statement.kind === "streamSubscribePath",
	);
	const legacyRoute = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "streamSubscribeRoute" }> =>
			statement.kind === "streamSubscribeRoute",
	);
	const sseRoute = declaration.body.find(
		(statement): statement is Extract<PointSemanticViewStatement, { kind: "sseSubscribeRoute" }> =>
			statement.kind === "sseSubscribeRoute",
	);
	const hasLegacySubscribe = Boolean(legacyPath || legacyRoute || sseRoute);
	const subscribePath =
		legacyPath ??
		(terminal?.path !== undefined ? { kind: "streamSubscribePath" as const, path: terminal.path, span: terminal.span } : undefined);
	const subscribeRoute =
		legacyRoute ??
		(terminal?.routeName !== undefined
			? { kind: "streamSubscribeRoute" as const, routeName: terminal.routeName, span: terminal.span }
			: undefined);
	return {
		subscribePath,
		subscribeRoute,
		sseSubscribeRoute: sseRoute,
		isTerminal: Boolean(terminal),
		hasLegacySubscribe,
	};
}
