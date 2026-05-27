import { describe, expect, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";
import { join } from "node:path";

import {
	cryptoHmacSha256,
	cryptoJwtIsValid,
	cryptoJwtSign,
	cryptoJwtVerify,
	cryptoSha256,
	interpretCoreProgramEntry,
	interpretCoreProgramEntryAsync,
	lowerCheckedCoreProgramToBytecode,
	yamlParse,
	yamlStringify,
} from "../../packages/point/runtime/index.ts";
import { checkPointCore } from "../../packages/point/src/core/check.ts";
import {
	buildCoreFileFromSource,
	createModuleGraphForFile,
	programWithDependencyDeclarations,
} from "../../packages/point/src/core/cli.ts";
import { readPointLock } from "../../packages/point/src/core/packages.ts";

const repoRoot = join(import.meta.dir, "..", "..");

const source = `module RuntimeStdCryptoYaml

capabilities crypto yaml

calculation sha sample
  input value: Text
  output digest: Text
  return digest sha256(value)

calculation hmac sample
  input value: Text
  input secret: Text
  output digest: Text
  return digest hmac sha256(value, secret)

calculation sign sample
  input payload: Text
  input secret: Text
  output token: Text
  return sign jwt(payload, secret)

calculation verify sample
  input token: Text
  input secret: Text
  output payload: Text or Error
  return verify jwt(token, secret)

calculation jwt ok sample
  input token: Text
  input secret: Text
  output ok: Bool
  return jwt auth ok(token, secret)

action yaml parse sample
  input value: Text
  output result: Text or Error
  touches none
  return await parse yaml(value)

calculation yaml stringify sample
  input value: Text
  output result: Text
  return stringify yaml(value)
`;

async function checkedProgram() {
	const lock = await readPointLock(repoRoot);
	const coreFile = buildCoreFileFromSource("tests/runtime/builtins-crypto-yaml.inline.point", source, lock, repoRoot);
	const graph = await createModuleGraphForFile(coreFile, lock, repoRoot);
	const program = programWithDependencyDeclarations(coreFile, graph, repoRoot);
	expect(checkPointCore(program)).toEqual([]);
	return program;
}

describe("runtime crypto/yaml builtins", () => {
	test("mirror std.crypto and std.yaml raw exports", () => {
		const payload = '{"sub":"u-1","role":"admin"}';
		const token = cryptoJwtSign(payload, "secret");

		expect(cryptoSha256("hello")).toBe(createHash("sha256").update("hello", "utf8").digest("hex"));
		expect(cryptoHmacSha256("payload", "secret")).toBe(createHmac("sha256", "secret").update("payload", "utf8").digest("hex"));
		expect(cryptoJwtVerify(token, "secret")).toBe(payload);
		expect(cryptoJwtVerify(`Bearer ${token}`, "secret")).toBe(payload);
		expect(cryptoJwtVerify(token, "wrong")).toEqual({ message: "Invalid JWT signature" });
		expect(cryptoJwtIsValid(token, "secret")).toBe(true);
		expect(cryptoJwtIsValid(token, "wrong")).toBe(false);

		expect(yamlParse("name: Point\nready: true\n")).toBe('{"name":"Point","ready":true}');
		expect(yamlParse("[")).toEqual(expect.objectContaining({ message: expect.any(String) }));
		expect(yamlStringify('{"name":"Point","ready":true}')).toContain("name: Point");
	});

	test("interprets std.crypto and std.yaml wrappers through runtime std dispatch", async () => {
		const program = await checkedProgram();
		const ir = lowerCheckedCoreProgramToBytecode(program);
		expect(ir.externals.map((external) => `${external.from}:${external.importName ?? external.name}`).sort()).toEqual([
			"@hatchingpoint/point/std/crypto:cryptoHmacSha256",
			"@hatchingpoint/point/std/crypto:cryptoJwtIsValid",
			"@hatchingpoint/point/std/crypto:cryptoJwtSign",
			"@hatchingpoint/point/std/crypto:cryptoJwtVerify",
			"@hatchingpoint/point/std/crypto:cryptoSha256",
			"@hatchingpoint/point/std/yaml:yamlParse",
			"@hatchingpoint/point/std/yaml:yamlStringify",
		]);

		const payload = '{"sub":"u-1","role":"admin"}';
		const token = interpretCoreProgramEntry(program, "signSampleToken", [payload, "secret"]);

		expect(interpretCoreProgramEntry(program, "shaSampleDigest", ["hello"])).toBe(cryptoSha256("hello"));
		expect(interpretCoreProgramEntry(program, "hmacSampleDigest", ["payload", "secret"])).toBe(cryptoHmacSha256("payload", "secret"));
		expect(interpretCoreProgramEntry(program, "verifySamplePayload", [token, "secret"])).toBe(payload);
		expect(interpretCoreProgramEntry(program, "jwtOkSampleOk", [token, "secret"])).toBe(true);
		expect(interpretCoreProgramEntry(program, "jwtOkSampleOk", [token, "wrong"])).toBe(false);
		expect(await interpretCoreProgramEntryAsync(program, "yamlParseSampleResult", ["name: Point\nready: true\n"])).toBe('{"name":"Point","ready":true}');
		expect(interpretCoreProgramEntry(program, "yamlStringifySampleResult", ['{"name":"Point","ready":true}'])).toContain("ready: true");
	});
});
