import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticPageDeclaration,
	PointSemanticProgram,
	PointSemanticStreamRouteDeclaration,
	PointSemanticSseRouteDeclaration,
	PointSemanticViewDeclaration,
	PointSemanticViewStatement,
} from "./ast.ts";
import { resolveViewStreamSubscribeStatements } from "./view-stream-subscribe-resolve.ts";

export function checkSemanticStreamSubscribe(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const streamRoutes = new Map<string, PointSemanticStreamRouteDeclaration>();
	const streamRoutesByPath = new Map<string, PointSemanticStreamRouteDeclaration>();
	const sseRoutes = new Map<string, PointSemanticSseRouteDeclaration>();
	for (const declaration of program.declarations) {
		if (declaration.kind === "streamRoute") {
			streamRoutes.set(declaration.name, declaration);
			streamRoutesByPath.set(declaration.path, declaration);
		}
		if (declaration.kind === "sseRoute") {
			sseRoutes.set(declaration.name, declaration);
		}
	}

	for (const declaration of program.declarations) {
		if (declaration.kind === "view") {
			diagnostics.push(...checkViewStreamSubscribe(moduleName, declaration, streamRoutes, streamRoutesByPath, sseRoutes));
		}
		if (declaration.kind === "page") {
			diagnostics.push(...checkPageStreamSubscribe(moduleName, declaration, streamRoutes, streamRoutesByPath));
		}
	}

	return diagnostics;
}

function checkViewStreamSubscribe(
	moduleName: string,
	declaration: PointSemanticViewDeclaration,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	streamRoutesByPath: Map<string, PointSemanticStreamRouteDeclaration>,
	sseRoutes: Map<string, PointSemanticSseRouteDeclaration>,
): PointCoreDiagnostic[] {
	const resolved = resolveViewStreamSubscribeStatements(declaration);
	const { subscribePath, subscribeRoute, sseSubscribeRoute } = resolved;
	if (!subscribePath && !subscribeRoute && !sseSubscribeRoute) return [];

	const diagnostics: PointCoreDiagnostic[] = [];
	if (resolved.isTerminal && resolved.hasLegacySubscribe) {
		diagnostics.push(
			streamSubscribeDiagnostic(
				"terminal-stream-subscribe-conflict",
				`View ${declaration.name} cannot combine terminal subscribe with subscribe to …; use only one style`,
				moduleName,
				`view.${declaration.name}`,
				declaration.name,
				`Remove either the terminal subscribe line or the plain subscribe line.`,
				subscribeRoute?.span ?? subscribePath?.span ?? sseSubscribeRoute?.span,
			),
		);
		return diagnostics;
	}
	if (sseSubscribeRoute && (subscribePath || subscribeRoute)) {
		diagnostics.push(
			streamSubscribeDiagnostic(
				"sse-stream-subscribe-conflict",
				`View ${declaration.name} cannot combine subscribe to sse with subscribe to stream`,
				moduleName,
				`view.${declaration.name}`,
				declaration.name,
				`Use either subscribe to sse <name> or subscribe to stream <name>, not both.`,
				sseSubscribeRoute.span,
			),
		);
		return diagnostics;
	}
	if (sseSubscribeRoute) {
		if (!sseRoutes.has(sseSubscribeRoute.routeName)) {
			diagnostics.push(
				streamSubscribeDiagnostic(
					"unknown-sse-subscribe-route",
					`Unknown sse route ${sseSubscribeRoute.routeName} in subscribe to sse ${sseSubscribeRoute.routeName}`,
					moduleName,
					`view.${declaration.name}`,
					declaration.name,
					`Declare sse route ${sseSubscribeRoute.routeName} or fix the subscribe to sse name.`,
					sseSubscribeRoute.span,
					[...sseRoutes.keys()].sort(),
				),
			);
		}
		return diagnostics;
	}
	const onMessageCall = declaration.body.find((statement) => statement.kind === "onMessageCall");
	diagnostics.push(
		...validateSubscribeTarget(
			moduleName,
			`view.${declaration.name}`,
			declaration.name,
			subscribePath,
			subscribeRoute,
			streamRoutes,
			streamRoutesByPath,
		),
	);
	diagnostics.push(...validateMessageHandler(moduleName, `view.${declaration.name}`, declaration.name, onMessageCall, declaration.inputs, declaration.body, subscribePath, subscribeRoute, streamRoutes, streamRoutesByPath));
	return diagnostics;
}

function checkPageStreamSubscribe(
	moduleName: string,
	declaration: PointSemanticPageDeclaration,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	streamRoutesByPath: Map<string, PointSemanticStreamRouteDeclaration>,
): PointCoreDiagnostic[] {
	if (!declaration.streamSubscribePath && !declaration.streamSubscribeRoute) return [];

	const diagnostics: PointCoreDiagnostic[] = [];
	const subscribePath = declaration.streamSubscribePath
		? ({ kind: "streamSubscribePath" as const, path: declaration.streamSubscribePath })
		: undefined;
	const subscribeRoute = declaration.streamSubscribeRoute
		? ({ kind: "streamSubscribeRoute" as const, routeName: declaration.streamSubscribeRoute })
		: undefined;
	const onMessageCall = declaration.onMessageCall ? ({ kind: "onMessageCall" as const, callback: declaration.onMessageCall }) : undefined;
	diagnostics.push(
		...validateSubscribeTarget(
			moduleName,
			`page.${declaration.name}`,
			declaration.name,
			subscribePath,
			subscribeRoute,
			streamRoutes,
			streamRoutesByPath,
		),
	);
	diagnostics.push(...validateMessageHandler(moduleName, `page.${declaration.name}`, declaration.name, onMessageCall, declaration.inputs, [], subscribePath, subscribeRoute, streamRoutes, streamRoutesByPath));
	return diagnostics;
}

function validateSubscribeTarget(
	moduleName: string,
	path: string,
	name: string,
	subscribePath: Extract<PointSemanticViewStatement, { kind: "streamSubscribePath" }> | { kind: "streamSubscribePath"; path: string } | undefined,
	subscribeRoute: Extract<PointSemanticViewStatement, { kind: "streamSubscribeRoute" }> | { kind: "streamSubscribeRoute"; routeName: string } | undefined,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	streamRoutesByPath: Map<string, PointSemanticStreamRouteDeclaration>,
): PointCoreDiagnostic[] {
	if (subscribeRoute && !streamRoutes.has(subscribeRoute.routeName)) {
		return [
			streamSubscribeDiagnostic(
				"unknown-stream-subscribe-route",
				`Unknown stream route ${subscribeRoute.routeName} in subscribe to stream ${subscribeRoute.routeName}`,
				moduleName,
				path,
				name,
				`Declare stream route ${subscribeRoute.routeName} or fix the subscribe to stream name.`,
				subscribeRoute.span,
				[...streamRoutes.keys()].sort(),
			),
		];
	}
	if (subscribePath && !streamRoutesByPath.has(subscribePath.path)) {
		return [
			streamSubscribeDiagnostic(
				"unknown-stream-subscribe-path",
				`No stream route registered at path ${subscribePath.path}`,
				moduleName,
				path,
				name,
				`Add a stream route with path ${JSON.stringify(subscribePath.path)} or subscribe to stream <name>.`,
				subscribePath.span,
			),
		];
	}
	return [];
}

function validateMessageHandler(
	moduleName: string,
	path: string,
	name: string,
	onMessageCall: Extract<PointSemanticViewStatement, { kind: "onMessageCall" }> | { kind: "onMessageCall"; callback: string } | undefined,
	inputs: Array<{ label: string; type: { name: string; args: Array<{ name: string; args: unknown[] }> } }>,
	body: PointSemanticViewStatement[],
	subscribePath: { path: string } | undefined,
	subscribeRoute: { routeName: string } | undefined,
	streamRoutes: Map<string, PointSemanticStreamRouteDeclaration>,
	streamRoutesByPath: Map<string, PointSemanticStreamRouteDeclaration>,
): PointCoreDiagnostic[] {
	if (!onMessageCall) return [];
	const handlerInput = inputs.find((input) => input.label === onMessageCall.callback);
	if (!handlerInput) {
		return [
			streamSubscribeDiagnostic(
				"missing-stream-message-handler",
				`on message call ${onMessageCall.callback} requires input ${onMessageCall.callback}: Handler <MessageType>`,
				moduleName,
				path,
				name,
				`Add input ${onMessageCall.callback}: Handler <MessageType> to ${name}.`,
				onMessageCall.span,
			),
		];
	}
	if (handlerInput.type.name !== "Handler" || handlerInput.type.args.length !== 1) {
		return [
			streamSubscribeDiagnostic(
				"invalid-stream-message-handler",
				`Input ${onMessageCall.callback} must be Handler <MessageType>`,
				moduleName,
				path,
				name,
				`Use Handler with the stream route message record type.`,
				onMessageCall.span,
			),
		];
	}
	const route = subscribeRoute
		? streamRoutes.get(subscribeRoute.routeName)
		: subscribePath
			? streamRoutesByPath.get(subscribePath.path)
			: undefined;
	if (route && handlerInput.type.args[0]?.name !== route.messageType.name) {
		return [
			streamSubscribeDiagnostic(
				"stream-message-handler-type-mismatch",
				`Handler ${onMessageCall.callback} expects ${handlerInput.type.args[0]?.name}, but stream route message is ${route.messageType.name}`,
				moduleName,
				path,
				name,
				`Change input ${onMessageCall.callback} to Handler ${route.messageType.name}.`,
				onMessageCall.span,
			),
		];
	}
	return [];
}

function streamSubscribeDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	path: string,
	name: string,
	repair: string,
	span?: PointSourceSpan,
	expected?: string[],
): PointCoreDiagnostic {
	return {
		code,
		message,
		path,
		ref: `point://semantic/${moduleName}/${path}`,
		severity: "error",
		span: span ?? null,
		repair,
		...(expected ? { expected } : {}),
	};
}
