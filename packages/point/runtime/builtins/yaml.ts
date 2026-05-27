import { createRequire } from "node:module";

export type PointRuntimeYamlError = { message: string };

const require = createRequire(import.meta.url);

function yamlModule(): { parse: (value: string) => unknown; stringify: (value: unknown) => string } {
	return require("yaml") as { parse: (value: string) => unknown; stringify: (value: unknown) => string };
}

export function yamlParse(value: string): string | PointRuntimeYamlError {
	try {
		return JSON.stringify(yamlModule().parse(value));
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export function yamlStringify(value: string): string {
	return yamlModule().stringify(JSON.parse(value));
}
