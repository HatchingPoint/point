import { createHmac, timingSafeEqual } from "node:crypto";

export type PointRuntimeAuthError = { message: string };

function base64UrlEncode(value: string): string {
	return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

export function authBearerToken(authorization: string | null | undefined): string {
	if (authorization == null) return "";
	const trimmed = authorization.trim();
	return trimmed.startsWith("Bearer ") ? trimmed.slice("Bearer ".length).trim() : trimmed;
}

export function authSignJwt(payload: string, secret: string): string {
	JSON.parse(payload);
	const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const body = base64UrlEncode(payload);
	const data = `${header}.${body}`;
	const signature = createHmac("sha256", secret).update(data, "utf8").digest("base64url");
	return `${data}.${signature}`;
}

export function authVerifyJwt(authorization: string | null | undefined, secret: string): string | PointRuntimeAuthError {
	const token = authBearerToken(authorization);
	if (!token) return { message: "Missing JWT" };
	const parts = token.split(".");
	if (parts.length !== 3) return { message: "Invalid JWT" };
	const [header, body, signature] = parts;
	const data = `${header}.${body}`;
	const expected = createHmac("sha256", secret).update(data, "utf8").digest("base64url");
	try {
		const expectedBuffer = Buffer.from(expected, "utf8");
		const signatureBuffer = Buffer.from(signature, "utf8");
		if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
			return { message: "Invalid JWT signature" };
		}
		const payload = base64UrlDecode(body);
		JSON.parse(payload);
		return payload;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export function authJwtOk(authorization: string | null | undefined, secret: string): boolean {
	return typeof authVerifyJwt(authorization, secret) === "string";
}

export function authUnauthorizedJson(): string {
	return '{"error":"unauthorized"}';
}
