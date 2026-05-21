import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type PointStdError = { message: string };

function base64UrlEncode(value: string): string {
	return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

function normalizeBearerToken(token: string | null | undefined): string {
	if (token == null) return "";
	const trimmed = token.trim();
	return trimmed.startsWith("Bearer ") ? trimmed.slice("Bearer ".length).trim() : trimmed;
}

export function cryptoSha256(value: string): string {
	return createHash("sha256").update(value, "utf8").digest("hex");
}

export function cryptoHmacSha256(value: string, secret: string): string {
	return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function cryptoJwtSign(payload: string, secret: string): string {
	JSON.parse(payload);
	const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const body = base64UrlEncode(payload);
	const data = `${header}.${body}`;
	const signature = createHmac("sha256", secret).update(data, "utf8").digest("base64url");
	return `${data}.${signature}`;
}

export function cryptoJwtVerify(token: string | null | undefined, secret: string): string | PointStdError {
	const normalized = normalizeBearerToken(token);
	if (!normalized) {
		return { message: "Missing JWT" };
	}
	const parts = normalized.split(".");
	if (parts.length !== 3) {
		return { message: "Invalid JWT" };
	}
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

export function cryptoJwtIsValid(token: string | null | undefined, secret: string): boolean {
	return typeof cryptoJwtVerify(token, secret) === "string";
}

export {
	cryptoSha256 as sha256Hash,
	cryptoHmacSha256 as hmacSha256,
	cryptoJwtSign as jwtSign,
	cryptoJwtVerify as jwtVerify,
	cryptoJwtIsValid as checkJwtValid,
};
