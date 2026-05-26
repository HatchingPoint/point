import { describe, expect, test } from "bun:test";

import { sha256 } from "../../packages/point/runtime/builtins/crypto";

describe("runtime crypto builtins", () => {
	test("sha256 returns stable lowercase hex digests", () => {
		expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
		expect(sha256("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
		expect(sha256("The quick brown fox jumps over the lazy dog")).toBe(
			"d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
		);
	});

	test("sha256 is deterministic for idempotency key material", () => {
		const keyMaterial = "POST:/deployments:tenant=acme:request=42";

		expect(sha256(keyMaterial)).toBe(sha256(keyMaterial));
		expect(sha256(keyMaterial)).not.toBe(sha256(`${keyMaterial}:retry=1`));
	});

	test("sha256 handles request text as stable UTF-8 input", () => {
		expect(sha256("Point ships: deploy=ready")).toBe(sha256("Point ships: deploy=ready"));
		expect(sha256("Point ships: deploy=ready")).not.toBe(sha256("Point ships"));
	});
});
