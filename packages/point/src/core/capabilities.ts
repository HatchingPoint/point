export const POINT_CAPABILITIES_SCHEMA = "point.capabilities.v1" as const;

export interface PointCapability {
	name: string;
	module: string;
	summary: string;
}

/** Built-in std modules addressable with `use <name>` (shorthand for `use std.<name>`). */
export const BUILTIN_CAPABILITIES: readonly PointCapability[] = [
	{ name: "text", module: "std.text", summary: "Text parse, format, and pad helpers" },
	{ name: "json", module: "std.json", summary: "JSON parse and stringify" },
	{ name: "http", module: "std.http", summary: "HTTP fetch and route test assertions" },
	{ name: "time", module: "std.time", summary: "Instant, duration, and timezone formatting" },
	{ name: "fs", module: "std.fs", summary: "Filesystem read and write actions" },
	{ name: "env", module: "std.env", summary: "Environment variable access" },
	{ name: "path", module: "std.path", summary: "Path join and basename helpers" },
	{ name: "process", module: "std.process", summary: "Spawn and run host processes" },
	{ name: "crypto", module: "std.crypto", summary: "Hashing, HMAC, and JWT helpers" },
	{ name: "yaml", module: "std.yaml", summary: "YAML parse and stringify" },
	{ name: "stream", module: "std.stream", summary: "Stream route helpers" },
	{ name: "sql", module: "std.sql", summary: "SQLite query actions and schema helpers" },
	{ name: "ai", module: "std.ai", summary: "OpenAI and Anthropic complete/stream actions" },
	{ name: "money", module: "std.money", summary: "Cents-based money formatting" },
] as const;

const capabilityByName = new Map(BUILTIN_CAPABILITIES.map((entry) => [entry.name, entry]));

export function isBuiltinCapabilityName(name: string): boolean {
	return capabilityByName.has(name);
}

/** Normalize `use http` → `use std.http`. Leaves `use std.http`, package modules, and `use X from "..."` unchanged. */
export function normalizeUseModuleName(moduleName: string, from?: string): string {
	if (from) return moduleName;
	if (moduleName.includes(".")) return moduleName;
	if (isBuiltinCapabilityName(moduleName)) return `std.${moduleName}`;
	return moduleName;
}

export function formatUseModuleNameForSource(moduleName: string): string {
	if (moduleName.startsWith("std.")) {
		const shortName = moduleName.slice("std.".length);
		if (isBuiltinCapabilityName(shortName)) return shortName;
	}
	return moduleName;
}

export interface PointCapabilitiesCatalog {
	schemaVersion: typeof POINT_CAPABILITIES_SCHEMA;
	capabilities: PointCapability[];
	shorthand: string;
	explicit: string;
}

export function listPointCapabilities(): PointCapabilitiesCatalog {
	return {
		schemaVersion: POINT_CAPABILITIES_SCHEMA,
		capabilities: [...BUILTIN_CAPABILITIES],
		shorthand: "use http",
		explicit: "use std.http",
	};
}

export function formatPointCapabilitiesCatalog(catalog: PointCapabilitiesCatalog): string {
	const lines = [
		"Built-in capabilities (shorthand → std module):",
		"",
		...catalog.capabilities.map((entry) => `  use ${entry.name.padEnd(8)}  ${entry.summary}`),
		"",
		`One line:  capabilities http json`,
		`Shorthand: ${catalog.shorthand}`,
		`Explicit:  ${catalog.explicit}`,
		"Local:     use Module from \"./file.point\"",
	];
	return lines.join("\n");
}

const CAPABILITIES_LINE = /^capabilities((?:\s+[a-z][a-z0-9]*)+)$/;

export function parseCapabilityNamesFromLine(line: string): string[] {
	const trimmed = line.trim();
	const match = trimmed.match(CAPABILITIES_LINE);
	if (!match) throw new Error(`Invalid capabilities declaration: ${line}`);
	return (match[1] ?? "").trim().split(/\s+/);
}

export function isCapabilitiesLine(line: string): boolean {
	return CAPABILITIES_LINE.test(line.trim());
}

export function expandCapabilityNamesToModuleNames(names: string[]): string[] {
	return names.map((name) => {
		if (!isBuiltinCapabilityName(name)) {
			throw new Error(`Unknown capability "${name}". Run: point capabilities`);
		}
		return normalizeUseModuleName(name);
	});
}
