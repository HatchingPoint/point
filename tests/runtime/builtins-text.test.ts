import { describe, expect, test } from "bun:test";

import {
	contains,
	lowercase,
	stripPrefix,
	trim,
} from "../../packages/point/runtime/builtins/text";

describe("runtime text builtins", () => {
	test("trim removes leading and trailing whitespace", () => {
		expect(trim("  Ready \n")).toBe("Ready");
		expect(trim("\t deploy readiness \r\n")).toBe("deploy readiness");
	});

	test("lowercase lowercases text without changing punctuation", () => {
		expect(lowercase("Deploy READY!")).toBe("deploy ready!");
		expect(lowercase("Already lower")).toBe("already lower");
	});

	test("contains reports substring membership", () => {
		expect(contains("bundle id present", "bundle id")).toBe(true);
		expect(contains("bundle id present", "deploy key")).toBe(false);
		expect(contains("abc", "")).toBe(true);
	});

	test("stripPrefix removes only a matching leading prefix", () => {
		expect(stripPrefix("deploy:ready", "deploy:")).toBe("ready");
		expect(stripPrefix("deploy:ready", "ready")).toBe("deploy:ready");
		expect(stripPrefix("deploy:ready", "")).toBe("deploy:ready");
	});
});
