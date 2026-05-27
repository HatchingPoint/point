import type { PointSemanticViewControls } from "../../src/core/ast.ts";
import { renderPointThemeClientSnippet } from "./theme-ssr.ts";
import { renderPointRefreshClientSnippet } from "./refresh-ssr.ts";
import { renderPointSseClientSnippet } from "./sse-ssr.ts";
import { renderPointWsClientSnippet } from "./ws-ssr.ts";

export { wrapSsrHtmlDocument } from "./document.ts";

export const POINT_AUTH_TOKEN_KEY = "point.auth.token";

export type PointFormSubmitConfig = {
	url: string;
	fields: string[];
	withAuth?: boolean;
	saveTokenField?: string;
	navigateTo?: string;
	successToast?: string;
	errorToast?: string;
};

export function serializePointFormSubmitConfig(controls: PointSemanticViewControls): PointFormSubmitConfig | undefined {
	const submit = controls.submit;
	if (!submit) return undefined;
	return {
		url: submit.url,
		fields: controls.fields.map((field) => field.fieldName),
		...(submit.withAuth ? { withAuth: true } : {}),
		...(submit.saveTokenField ? { saveTokenField: submit.saveTokenField } : {}),
		...(submit.navigateTo ? { navigateTo: submit.navigateTo } : {}),
		...(controls.successToast ? { successToast: controls.successToast } : {}),
		...(controls.errorToast ? { errorToast: controls.errorToast } : {}),
	};
}

export function pageNeedsUiClient(html: string): boolean {
	return (
		html.includes("data-point-form-submit") ||
		html.includes("data-point-view-button") ||
		html.includes("data-point-tabs") ||
		html.includes("data-point-theme-toggle") ||
		html.includes("data-point-refresh") ||
		html.includes("data-point-sse-subscribe") ||
		html.includes("data-point-ws-subscribe")
	);
}

export function pageNeedsFormClient(html: string): boolean {
	return pageNeedsUiClient(html);
}

export function renderPointUiClientScript(): string {
	const themeSnippet = renderPointThemeClientSnippet();
	const refreshSnippet = renderPointRefreshClientSnippet();
	const sseSnippet = renderPointSseClientSnippet();
	const wsSnippet = renderPointWsClientSnippet();
	return `<script>(function(){${themeSnippet}${refreshSnippet}${sseSnippet}${wsSnippet}const TOKEN_KEY=${JSON.stringify(POINT_AUTH_TOKEN_KEY)};function getToken(){try{return localStorage.getItem(TOKEN_KEY)||""}catch{return""}}function setToken(value){try{localStorage.setItem(TOKEN_KEY,String(value||""))}catch{}}function clearToken(){try{localStorage.removeItem(TOKEN_KEY)}catch{}}function showToast(form,message,kind){let el=form.querySelector(".point-toast-live");if(!el){el=document.createElement("p");el.className="point-toast point-toast-live";el.setAttribute("role","status");form.appendChild(el)}el.className="point-toast point-toast-live point-toast-"+kind;el.textContent=message}function readField(input){if(!(input instanceof HTMLElement))return null;if(input instanceof HTMLInputElement&&input.type==="checkbox")return input.checked;return"value"in input?input.value:null}document.querySelectorAll("[data-point-view-button]").forEach(function(button){button.addEventListener("click",function(){let config;try{config=JSON.parse(button.getAttribute("data-point-view-button")||"{}")}catch{return}if(config.clearAuth)clearToken();if(config.navigateTo)window.location.href=config.navigateTo})});document.querySelectorAll("[data-point-tabs]").forEach(function(root){root.querySelectorAll("[data-point-tab]").forEach(function(tab){tab.addEventListener("click",function(){const index=tab.getAttribute("data-point-tab");root.querySelectorAll("[data-point-tab]").forEach(function(candidate){const active=candidate===tab;candidate.classList.toggle("point-tab-active",active);candidate.setAttribute("aria-selected",active?"true":"false")});root.querySelectorAll("[data-point-tabpanel]").forEach(function(panel){const active=panel.getAttribute("data-point-tabpanel")===index;panel.hidden=!active;panel.classList.toggle("point-tabpanel-active",active)})})})});document.querySelectorAll("form[data-point-form-submit]").forEach(function(form){const raw=form.getAttribute("data-point-form-submit");if(!raw)return;let config;try{config=JSON.parse(raw)}catch{return}form.addEventListener("submit",async function(event){event.preventDefault();const body={};for(const field of config.fields||[]){const input=form.querySelector('[data-point-field="'+field+'"]');if(!input)continue;body[field]=readField(input)}const headers={"content-type":"application/json"};if(config.withAuth){const token=getToken();if(token)headers.authorization="Bearer "+token}const submitButton=form.querySelector(".point-form-submit");if(submitButton instanceof HTMLButtonElement)submitButton.disabled=true;try{const response=await fetch(config.url,{method:"POST",headers,body:JSON.stringify(body)});if(!response.ok)throw new Error("HTTP "+response.status);const payload=await response.json();if(config.saveTokenField&&payload&&payload[config.saveTokenField]!=null)setToken(payload[config.saveTokenField]);if(config.successToast)showToast(form,config.successToast,"success");if(config.navigateTo)window.location.href=config.navigateTo}catch(error){const message=config.errorToast||(error instanceof Error?error.message:"Submit failed");showToast(form,message,"error")}finally{if(submitButton instanceof HTMLButtonElement)submitButton.disabled=false}})})})();</script>`;
}
