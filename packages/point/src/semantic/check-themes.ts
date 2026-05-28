import type { PointCoreDiagnostic } from "../core/check.ts";
import {
	POINT_THEME_ACCENTS,
	POINT_THEME_DENSITIES,
	POINT_THEME_RADII,
	isPointThemeAccent,
	isPointThemeDensity,
	isPointThemeRadius,
} from "../core/ui-style.ts";
import type { PointSemanticProgram, PointSemanticThemeDeclaration } from "./ast.ts";

export function checkSemanticThemes(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const themes = program.declarations.filter(
		(declaration): declaration is PointSemanticThemeDeclaration => declaration.kind === "theme",
	);
	if (themes.length > 1) {
		diagnostics.push(
			themeDiagnostic(
				"duplicate-theme",
				"Only one theme block is allowed per module",
				program.module ?? "anonymous",
				themes[1]?.name ?? "theme",
				"Remove extra theme blocks or merge settings into one theme.",
				themes[1]?.span,
			),
		);
	}
	for (const theme of themes) {
		if (theme.accent && !isPointThemeAccent(theme.accent)) {
			diagnostics.push(
				themeDiagnostic(
					"unknown-theme-accent",
					`Theme ${theme.name} uses unknown accent "${theme.accent}"`,
					program.module ?? "anonymous",
					theme.name,
					`Use one of: ${POINT_THEME_ACCENTS.join(", ")}.`,
					theme.span,
				),
			);
		}
		if (theme.density && !isPointThemeDensity(theme.density)) {
			diagnostics.push(
				themeDiagnostic(
					"unknown-theme-density",
					`Theme ${theme.name} uses unknown density "${theme.density}"`,
					program.module ?? "anonymous",
					theme.name,
					`Use one of: ${POINT_THEME_DENSITIES.join(", ")}.`,
					theme.span,
				),
			);
		}
		if (theme.radius && !isPointThemeRadius(theme.radius)) {
			diagnostics.push(
				themeDiagnostic(
					"unknown-theme-radius",
					`Theme ${theme.name} uses unknown radius "${theme.radius}"`,
					program.module ?? "anonymous",
					theme.name,
					`Use one of: ${POINT_THEME_RADII.join(", ")}.`,
					theme.span,
				),
			);
		}
	}
	for (const declaration of program.declarations) {
		if (declaration.kind !== "view") continue;
		if (!declaration.body.some((statement) => statement.kind === "toggleTheme")) continue;
		const theme = themes[0];
		if (!theme?.toggle) {
			diagnostics.push(
				themeDiagnostic(
					"theme-toggle-disabled",
					`View ${declaration.name} uses toggle theme but the theme block has no toggle setting`,
					program.module ?? "anonymous",
					theme?.name ?? "theme",
					'Add `toggle` under the theme block (for example `theme app theme` then `  toggle`).',
					declaration.body.find((statement) => statement.kind === "toggleTheme")?.span,
					["toggle"],
				),
			);
		}
	}
	return diagnostics;
}

function themeDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	themeName: string,
	repair: string,
	span?: { start: { line: number; column: number; offset: number }; end: { line: number; column: number; offset: number } },
	expected?: string[],
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `theme.${themeName}`,
		severity: "error",
		ref: `point://semantic/${moduleName}/theme.${themeName}`,
		repair,
		span,
		...(expected ? { expected } : {}),
	};
}
