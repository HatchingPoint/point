import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type { PointSemanticLayoutDeclaration, PointSemanticPageDeclaration, PointSemanticProgram } from "./ast.ts";

const ALLOWED_LAYOUT_SLOTS = new Set(["header", "sidebar", "main", "footer"]);
const REQUIRED_LAYOUT_SLOTS = new Set(["sidebar", "main"]);

export function checkSemanticLayouts(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const layouts = new Map<string, PointSemanticLayoutDeclaration>(
		program.declarations.filter((declaration): declaration is PointSemanticLayoutDeclaration => declaration.kind === "layout").map((declaration) => [declaration.name, declaration]),
	);

	for (const declaration of program.declarations) {
		if (declaration.kind !== "layout") continue;
		const slotNames = new Set<string>();
		for (const slot of declaration.slots) {
			if (!ALLOWED_LAYOUT_SLOTS.has(slot.name)) {
				diagnostics.push(
					layoutDiagnostic(
						"invalid-layout-slot",
						`Layout slot ${slot.name} must be one of: header, sidebar, main, footer`,
						moduleName,
						declaration,
						`Rename slot ${slot.name} to a supported layout slot name.`,
						slot.span,
					),
				);
			}
			if (slotNames.has(slot.name)) {
				diagnostics.push(
					layoutDiagnostic(
						"duplicate-layout-slot",
						`Layout ${declaration.name} declares slot ${slot.name} more than once`,
						moduleName,
						declaration,
						`Remove the duplicate slot ${slot.name} declaration.`,
						slot.span,
					),
				);
			}
			slotNames.add(slot.name);
		}
		for (const requiredSlot of REQUIRED_LAYOUT_SLOTS) {
			if (!slotNames.has(requiredSlot)) {
				diagnostics.push(
					layoutDiagnostic(
						"missing-layout-slot",
						`Layout ${declaration.name} requires a ${requiredSlot} slot`,
						moduleName,
						declaration,
						`Add slot ${requiredSlot} render ... to layout ${declaration.name}.`,
					),
				);
			}
		}
	}

	for (const declaration of program.declarations) {
		if (declaration.kind !== "page" || !declaration.layout) continue;
		if (!layouts.has(declaration.layout)) {
			diagnostics.push(
				pageLayoutDiagnostic(
					"unknown-layout",
					`Unknown layout ${declaration.layout} referenced by page ${declaration.name}`,
					moduleName,
					declaration,
					`Declare layout ${declaration.layout} before page ${declaration.name}.`,
				),
			);
		}
	}

	return diagnostics;
}

function layoutDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	layout: PointSemanticLayoutDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `layout.${layout.name}`,
		ref: `point://semantic/${moduleName}/layout.${layout.name}`,
		severity: "error",
		span: span ?? layout.span ?? null,
		repair,
	};
}

function pageLayoutDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	page: PointSemanticPageDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `page.${page.name}`,
		ref: `point://semantic/${moduleName}/page.${page.name}`,
		severity: "error",
		span: span ?? page.span ?? null,
		repair,
	};
}
