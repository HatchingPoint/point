import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type { PointSemanticBinding, PointSemanticProgram, PointSemanticRouteDeclaration, PointSemanticStreamRouteDeclaration } from "./ast.ts";
import { ROUTE_HTTP_INPUTS } from "../core/emit-routes.ts";
import { toPascalCase } from "./naming.ts";

const PRIMITIVE_TYPES = new Set(["Text", "Int", "Float", "Bool", "Void", "List", "Maybe", "Error", "Or", "Page", "Handler"]);

export function checkSemanticRoutes(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const recordNames = new Set(
		program.declarations.filter((declaration) => declaration.kind === "record").map((declaration) => toPascalCase(declaration.name)),
	);
	const middlewareNames = new Map(
		program.declarations.filter((declaration) => declaration.kind === "middleware").map((declaration) => [declaration.name, declaration]),
	);

	for (const declaration of program.declarations) {
		if (declaration.kind === "streamRoute") {
			diagnostics.push(...checkStreamRoute(declaration, moduleName, recordNames));
			continue;
		}
		if (declaration.kind !== "route") continue;
		for (const middlewareName of declaration.before) {
			if (!middlewareNames.has(middlewareName)) {
				diagnostics.push(
					routeDiagnostic(
						"unknown-middleware",
						`Unknown middleware ${middlewareName} referenced by route ${declaration.name}`,
						moduleName,
						declaration,
						`Declare middleware ${middlewareName} before route ${declaration.name}.`,
					),
				);
			}
		}
		for (const input of declaration.inputs) {
			if (!ROUTE_HTTP_INPUTS.has(input.label)) continue;
			if (!isRecordType(input, recordNames)) {
				diagnostics.push(
					routeDiagnostic(
						"invalid-route-input",
						`Route input ${input.label} must use a record type`,
						moduleName,
						declaration,
						`Declare a record type for ${input.label} instead of ${formatType(input.type)}.`,
						input.span,
					),
				);
			}
		}
	}

	return diagnostics;
}

function checkStreamRoute(
	declaration: PointSemanticStreamRouteDeclaration,
	moduleName: string,
	recordNames: Set<string>,
): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	if (!isRecordTypeName(declaration.messageType.name, recordNames)) {
		diagnostics.push(
			streamRouteDiagnostic(
				"invalid-stream-route-message",
				`Stream route message type must use a record type`,
				moduleName,
				declaration,
				`Declare a record type for message instead of ${formatType(declaration.messageType)}.`,
				declaration.span,
			),
		);
	}
	const messageHandler = declaration.handlers.find((handler) => handler.event === "message");
	const connectStreamAction = declaration.handlers.find((handler) => handler.event === "connect" && handler.mode === "streamFromAction");
	if (!messageHandler && !connectStreamAction) {
		diagnostics.push(
			streamRouteDiagnostic(
				"missing-stream-route-handler",
				`Stream route ${declaration.name} requires an on message handler or on connect stream from action`,
				moduleName,
				declaration,
				`Add "on message <name> return ..." or "on connect stream from action <name>" to stream route ${declaration.name}.`,
				declaration.span,
			),
		);
	} else if (messageHandler && !messageHandler.inputLabel) {
		diagnostics.push(
			streamRouteDiagnostic(
				"missing-stream-route-handler",
				`Stream route message handler requires an input label`,
				moduleName,
				declaration,
				`Use "on message message return ..." with a binding label.`,
				messageHandler.span,
			),
		);
	}
	return diagnostics;
}

function isRecordTypeName(typeName: string, recordNames: Set<string>): boolean {
	if (PRIMITIVE_TYPES.has(typeName)) return false;
	return recordNames.has(toPascalCase(typeName)) || recordNames.has(typeName);
}

function isRecordType(binding: PointSemanticBinding, recordNames: Set<string>): boolean {
	const type = binding.type;
	if (PRIMITIVE_TYPES.has(type.name)) return false;
	return recordNames.has(toPascalCase(type.name)) || recordNames.has(type.name);
}

function formatType(type: PointSemanticBinding["type"]): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatType).join(", ")}>`;
}

function routeDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	route: PointSemanticRouteDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `route.${route.name}`,
		ref: `point://semantic/${moduleName}/route.${route.name}`,
		severity: "error",
		span: span ?? route.span ?? null,
		repair,
	};
}

function streamRouteDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	streamRoute: PointSemanticStreamRouteDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `streamRoute.${streamRoute.name}`,
		ref: `point://semantic/${moduleName}/streamRoute.${streamRoute.name}`,
		severity: "error",
		span: span ?? streamRoute.span ?? null,
		repair,
	};
}
