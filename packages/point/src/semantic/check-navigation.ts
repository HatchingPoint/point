import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticBinding,
	PointSemanticNavigationDeclaration,
	PointSemanticNavigationRoute,
	PointSemanticPageDeclaration,
	PointSemanticProgram,
} from "./ast.ts";
import { pathSegmentNames, toPathSegment } from "../core/emit-routes.ts";

const NAV_PARAM_TYPES = new Set(["Text", "Int"]);

export function checkSemanticNavigation(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const pages = new Map<string, PointSemanticPageDeclaration>(
		program.declarations.filter((declaration): declaration is PointSemanticPageDeclaration => declaration.kind === "page").map((declaration) => [declaration.name, declaration]),
	);
	const seenPaths = new Map<string, string>();

	for (const declaration of program.declarations) {
		if (declaration.kind !== "navigation") continue;
		for (const route of declaration.routes) {
			if (seenPaths.has(route.path)) {
				diagnostics.push(
					navigationDiagnostic(
						"duplicate-nav-path",
						`Duplicate client path ${route.path} in navigation ${declaration.name}`,
						moduleName,
						declaration,
						`Use a unique path for each route in navigation ${declaration.name}.`,
						route.span,
						[`point://semantic/${moduleName}/navigation.${declaration.name}.route.${encodeURIComponent(route.path)}`],
					),
				);
			} else {
				seenPaths.set(route.path, route.pageName);
			}
			const page = pages.get(route.pageName);
			if (!page) {
				diagnostics.push(
					navigationDiagnostic(
						"unknown-nav-page",
						`Unknown page ${route.pageName} referenced by navigation ${declaration.name}`,
						moduleName,
						declaration,
						`Declare page ${route.pageName} before navigation ${declaration.name}.`,
						route.span,
						[`point://semantic/${moduleName}/page.${route.pageName}`],
					),
				);
				continue;
			}
			diagnostics.push(...checkNavigationPathParams(moduleName, declaration, route, page));
		}
	}

	return diagnostics;
}

function checkNavigationPathParams(
	moduleName: string,
	navigation: PointSemanticNavigationDeclaration,
	route: PointSemanticNavigationRoute,
	page: PointSemanticPageDeclaration,
): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const segments = pathSegmentNames(route.path);
	const inputBySegment = new Map(page.inputs.map((input) => [toPathSegment(input.label), input]));

	for (const segment of segments) {
		const input = inputBySegment.get(segment);
		if (!input) {
			diagnostics.push(
				navigationDiagnostic(
					"missing-nav-param",
					`Page ${page.name} is missing input ${segment} required by path ${route.path}`,
					moduleName,
					navigation,
					`Add input ${segment}: Text to page ${page.name}.`,
					route.span,
					[`point://semantic/${moduleName}/page.${page.name}`],
				),
			);
			continue;
		}
		if (!NAV_PARAM_TYPES.has(input.type.name)) {
			diagnostics.push(
				navigationDiagnostic(
					"invalid-nav-param-type",
					`Navigation param ${input.label} on page ${page.name} must be Text or Int`,
					moduleName,
					navigation,
					`Change input ${input.label} to Text or Int for client route ${route.path}.`,
					input.span ?? route.span,
					[`point://semantic/${moduleName}/page.${page.name}.input.${input.label}`],
				),
			);
		}
	}

	for (const input of page.inputs) {
		const segment = toPathSegment(input.label);
		if (segments.includes(segment)) continue;
		if (segments.length === 0) continue;
		// Non-path page inputs are allowed when pages are reused across routes.
	}

	return diagnostics;
}

function navigationDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	navigation: PointSemanticNavigationDeclaration,
	repair: string,
	span?: PointSourceSpan,
	relatedRefs?: string[],
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `navigation.${navigation.name}`,
		ref: `point://semantic/${moduleName}/navigation.${navigation.name}`,
		severity: "error",
		span: span ?? navigation.span ?? null,
		repair,
		relatedRefs,
	};
}
