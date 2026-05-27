import type { PointSemanticStreamSubscribe, PointSemanticViewEachSpec } from "../../src/core/ast.ts";
import { escapeThemeAttribute } from "./theme-ssr.ts";

export type PointSseSubscribeConfig = {
	path: string;
	renderField?: string;
	messageFields: string[];
	connectingHtml?: string;
	disconnectedHtml?: string;
	errorHtml?: string;
};

export function resolveSseRenderField(spec: PointSemanticViewEachSpec | undefined): string | undefined {
	if (!spec) return undefined;
	if (spec.render.kind !== "property") return undefined;
	if (spec.render.target.kind !== "identifier" || spec.render.target.name !== spec.itemIdentifier) return undefined;
	return spec.render.name;
}

export function serializePointSseSubscribeConfig(config: PointSseSubscribeConfig): string {
	return JSON.stringify(config);
}

export function wrapSseSubscribeHtml(content: string, config: PointSseSubscribeConfig): string {
	return `<div class="point-sse-subscribe" data-point-sse-subscribe="${escapeThemeAttribute(serializePointSseSubscribeConfig(config))}">${content}</div>`;
}

export function pageNeedsSseClient(html: string): boolean {
	return html.includes("data-point-sse-subscribe");
}

export function buildSseSubscribeConfig(
	spec: PointSemanticStreamSubscribe,
	eachSpec: PointSemanticViewEachSpec | undefined,
	connectingHtml?: string,
	disconnectedHtml?: string,
	errorHtml?: string,
): PointSseSubscribeConfig {
	const renderField = resolveSseRenderField(eachSpec);
	const messageFields = renderField ? [renderField] : ["value"];
	return {
		path: spec.path,
		renderField,
		messageFields,
		...(connectingHtml ? { connectingHtml } : {}),
		...(disconnectedHtml ? { disconnectedHtml } : {}),
		...(errorHtml ? { errorHtml } : {}),
	};
}

export function renderSseSubscribeRegion(config: PointSseSubscribeConfig, messagesHtml: string): string {
	const parts = [
		config.connectingHtml ? `<div class="point-sse-connecting">${config.connectingHtml}</div>` : "",
		config.errorHtml ? `<div class="point-sse-error" hidden>${config.errorHtml}</div>` : "",
		config.disconnectedHtml ? `<div class="point-sse-disconnected" hidden>${config.disconnectedHtml}</div>` : "",
		`<ul class="point-sse-messages point-list" role="list" data-point-sse-messages hidden>${messagesHtml}</ul>`,
	];
	return wrapSseSubscribeHtml(parts.join(""), config);
}

export function renderPointSseClientSnippet(): string {
	return [
		`document.querySelectorAll("[data-point-sse-subscribe]").forEach(function(root){`,
		`let config;try{config=JSON.parse(root.getAttribute("data-point-sse-subscribe")||"{}")}catch{return}`,
		`const connecting=root.querySelector(".point-sse-connecting");`,
		`const disconnected=root.querySelector(".point-sse-disconnected");`,
		`const errorEl=root.querySelector(".point-sse-error");`,
		`const list=root.querySelector("[data-point-sse-messages]");`,
		`if(!(list instanceof HTMLElement))return;`,
		`const renderField=config.renderField||((config.messageFields&&config.messageFields[0])||"value");`,
		`const source=new EventSource(config.path);`,
		`source.onopen=function(){if(connecting instanceof HTMLElement)connecting.hidden=true;if(errorEl instanceof HTMLElement)errorEl.hidden=true;if(disconnected instanceof HTMLElement)disconnected.hidden=true;list.hidden=false;};`,
		`source.onmessage=function(event){try{`,
		`const parsed=JSON.parse(String(event.data));`,
		`const item=document.createElement("li");`,
		`item.className="point-sse-message";`,
		`item.setAttribute("role","listitem");`,
		`item.textContent=String(parsed&&parsed[renderField]!=null?parsed[renderField]:"");`,
		`list.appendChild(item);`,
		`}catch{}};`,
		`source.onerror=function(){if(connecting instanceof HTMLElement)connecting.hidden=true;if(errorEl instanceof HTMLElement){errorEl.hidden=false;}if(disconnected instanceof HTMLElement)disconnected.hidden=false;source.close();};`,
		`});`,
	].join("");
}
