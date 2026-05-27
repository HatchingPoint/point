import type { PointCoreProgram } from "../../src/core/ast.ts";
import { pageNeedsFormClient, renderPointUiClientScript } from "./form-client.ts";
import { pageNeedsRefreshClient } from "./refresh-ssr.ts";
import { pageNeedsSseClient } from "./sse-ssr.ts";
import { pageNeedsWsClient } from "./ws-ssr.ts";
import { pageNeedsThemeClient, resolveSsrThemeShell, wrapThemeShell } from "./theme-ssr.ts";

export function pageNeedsSsrClient(body: string, program?: PointCoreProgram): boolean {
	const shell = program ? resolveSsrThemeShell(program) : undefined;
	return (
		pageNeedsFormClient(body) ||
		pageNeedsThemeClient(shell, body) ||
		pageNeedsRefreshClient(body) ||
		pageNeedsSseClient(body) ||
		pageNeedsWsClient(body)
	);
}

export function wrapSsrHtmlDocument(body: string, program?: PointCoreProgram): string {
	const shell = program ? resolveSsrThemeShell(program) : undefined;
	const wrappedBody = shell ? wrapThemeShell(body, shell) : body;
	const needsHead = Boolean(shell) || pageNeedsFormClient(wrappedBody);
	const head = needsHead
		? `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/point-ui.css"></head>`
		: "";
	const script = pageNeedsSsrClient(wrappedBody, program) ? renderPointUiClientScript() : "";
	return `<!doctype html><html lang="en">${head}<body>${wrappedBody}${script}</body></html>`;
}
