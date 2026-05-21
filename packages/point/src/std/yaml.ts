import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export type PointStdError = { message: string };

export function yamlParse(value: string): string | PointStdError {
	try {
		return JSON.stringify(parseYaml(value));
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export function yamlStringify(value: string): string {
	return stringifyYaml(JSON.parse(value));
}
