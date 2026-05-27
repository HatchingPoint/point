import type { PointSemanticStreamSubscribe, PointSemanticViewEachSpec } from "../../src/core/ast.ts";
import { resolveSseRenderField } from "./sse-ssr.ts";
import { escapeThemeAttribute } from "./theme-ssr.ts";

export type PointWsSubscribeConfig = {
	path: string;
	terminal?: boolean;
	renderField?: string;
	messageFields: string[];
	connectingHtml?: string;
	disconnectedHtml?: string;
	errorHtml?: string;
};

export function serializePointWsSubscribeConfig(config: PointWsSubscribeConfig): string {
	return JSON.stringify(config);
}

export function wrapWsSubscribeHtml(content: string, config: PointWsSubscribeConfig): string {
	return `<div class="point-ws-subscribe" data-point-ws-subscribe="${escapeThemeAttribute(serializePointWsSubscribeConfig(config))}">${content}</div>`;
}

export function pageNeedsWsClient(html: string): boolean {
	return html.includes("data-point-ws-subscribe");
}

export function buildWsSubscribeConfig(
	spec: PointSemanticStreamSubscribe,
	eachSpec: PointSemanticViewEachSpec | undefined,
	connectingHtml?: string,
	disconnectedHtml?: string,
	errorHtml?: string,
): PointWsSubscribeConfig {
	const renderField = resolveSseRenderField(eachSpec);
	const messageFields = renderField ? [renderField] : spec.terminal ? ["stream", "text"] : ["value"];
	return {
		path: spec.path,
		terminal: spec.terminal === true,
		renderField,
		messageFields,
		...(connectingHtml ? { connectingHtml } : {}),
		...(disconnectedHtml ? { disconnectedHtml } : {}),
		...(errorHtml ? { errorHtml } : {}),
	};
}

export function renderWsSubscribeRegion(config: PointWsSubscribeConfig): string {
	const parts = [
		config.connectingHtml ? `<div class="point-ws-connecting">${config.connectingHtml}</div>` : "",
		config.errorHtml ? `<div class="point-ws-error" hidden>${config.errorHtml}</div>` : "",
		config.disconnectedHtml ? `<div class="point-ws-disconnected" hidden>${config.disconnectedHtml}</div>` : "",
	];
	if (config.terminal) {
		parts.push('<pre class="point-terminal" role="log" aria-live="polite" data-point-terminal-output hidden></pre>');
	} else {
		parts.push('<ul class="point-ws-messages point-list" role="list" data-point-ws-messages hidden></ul>');
	}
	return wrapWsSubscribeHtml(parts.join(""), config);
}

export function renderPointWsClientSnippet(): string {
	return [
		`document.querySelectorAll("[data-point-ws-subscribe]").forEach(function(root){`,
		`let config;try{config=JSON.parse(root.getAttribute("data-point-ws-subscribe")||"{}")}catch{return}`,
		`const connecting=root.querySelector(".point-ws-connecting");`,
		`const disconnected=root.querySelector(".point-ws-disconnected");`,
		`const errorEl=root.querySelector(".point-ws-error");`,
		`const protocol=window.location.protocol==="https:"?"wss:":"ws:";`,
		`const ws=new WebSocket(protocol+"//"+window.location.host+config.path);`,
		`function showLive(){if(connecting instanceof HTMLElement)connecting.hidden=true;if(errorEl instanceof HTMLElement)errorEl.hidden=true;if(disconnected instanceof HTMLElement)disconnected.hidden=true;`,
		`if(config.terminal){const output=root.querySelector("[data-point-terminal-output]");if(output instanceof HTMLElement)output.hidden=false;}else{const list=root.querySelector("[data-point-ws-messages]");if(list instanceof HTMLElement)list.hidden=false;}}`,
		`function showFailure(){if(connecting instanceof HTMLElement)connecting.hidden=true;if(disconnected instanceof HTMLElement)disconnected.hidden=false;}`,
		`ws.onopen=function(){showLive();};`,
		`ws.onerror=function(){showFailure();if(errorEl instanceof HTMLElement)errorEl.hidden=false;};`,
		`ws.onclose=function(){showFailure();};`,
		`ws.onmessage=function(event){try{`,
		`const message=JSON.parse(String(event.data));`,
		`if(config.terminal){`,
		`const output=root.querySelector("[data-point-terminal-output]");`,
		`if(!(output instanceof HTMLElement))return;`,
		`const text=typeof message.line==="string"?message.line:typeof message.text==="string"?message.text:JSON.stringify(message);`,
		`const stream=typeof message.stream==="string"?message.stream:typeof message.channel==="string"?message.channel:"stdout";`,
		`const line=document.createElement("div");`,
		`line.className="point-terminal-line"+(stream==="stderr"||stream==="err"?" point-terminal-stderr":stream==="exit"?" point-terminal-exit":"");`,
		`line.textContent=String(text);`,
		`output.appendChild(line);`,
		`return;`,
		`}`,
		`const list=root.querySelector("[data-point-ws-messages]");`,
		`if(!(list instanceof HTMLElement))return;`,
		`const renderField=config.renderField||((config.messageFields&&config.messageFields[0])||"value");`,
		`const item=document.createElement("li");`,
		`item.className="point-ws-message";`,
		`item.setAttribute("role","listitem");`,
		`item.textContent=String(message&&message[renderField]!=null?message[renderField]:typeof message.line==="string"?message.line:"");`,
		`list.appendChild(item);`,
		`}catch{}};`,
		`});`,
	].join("");
}
