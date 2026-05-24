import { cryptoJwtIsValid, cryptoJwtSign, cryptoJwtVerify } from "./crypto.ts";

export function authBearerToken(authorization: string | null | undefined): string {
	if (authorization == null) return "";
	const trimmed = authorization.trim();
	return trimmed.startsWith("Bearer ") ? trimmed.slice("Bearer ".length).trim() : trimmed;
}

export function authJwtOk(authorization: string | null | undefined, secret: string): boolean {
	return cryptoJwtIsValid(authorization, secret);
}

export function authSignJwt(payload: string, secret: string): string {
	return cryptoJwtSign(payload, secret);
}

export function authVerifyJwt(authorization: string | null | undefined, secret: string): string | { message: string } {
	return cryptoJwtVerify(authorization, secret);
}

export function authUnauthorizedJson(): string {
	return '{"error":"unauthorized"}';
}
