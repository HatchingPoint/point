import {
	textContains,
	textFromInt,
	textLength,
	textPadStart,
	textSplit,
	textTrim,
} from "./builtins/text.ts";
import { jsonParse, jsonStringify } from "./builtins/json.ts";
import {
	httpAssertJsonBody,
	httpAssertStatus,
	httpFetch,
	httpGet,
	httpPost,
} from "./builtins/http.ts";
import {
	durationFromMinutes,
	durationFromSeconds,
	durationToSeconds,
	formatInstant,
	formatInstantInTimezone,
	formatTime,
	instantNow,
	now,
	parseInstant,
	sleep,
} from "./builtins/time.ts";
import {
	authBearerToken,
	authJwtOk,
	authSignJwt,
	authUnauthorizedJson,
	authVerifyJwt,
} from "./builtins/auth.ts";
import {
	sqlJsonMemberRow,
	sqlJsonRowsList,
	sqlQueryRaw,
} from "./builtins/sql.ts";

export type PointRuntimeStdModule = "std.text" | "std.json" | "std.http" | "std.time" | "std.auth" | "std.sql";
export type PointRuntimeStdBuiltin = (...args: any[]) => unknown;
export type PointRuntimeStdDispatch = Record<PointRuntimeStdModule, Record<string, PointRuntimeStdBuiltin>>;

export const runtimeStdDispatch: PointRuntimeStdDispatch = {
	"std.text": {
		textLength,
		textContains,
		textSplit,
		textTrim,
		textFromInt,
		textPadStart,
	},
	"std.json": {
		jsonParse,
		jsonStringify,
	},
	"std.http": {
		httpGet,
		httpPost,
		httpFetch,
		httpAssertStatus,
		httpAssertJsonBody,
	},
	"std.time": {
		instantNow,
		parseInstant,
		formatInstant,
		formatInstantInTimezone,
		now,
		sleep,
		formatTime,
		durationFromSeconds,
		durationToSeconds,
		durationFromMinutes,
	},
	"std.auth": {
		authBearerToken,
		authJwtOk,
		authSignJwt,
		authVerifyJwt,
		authUnauthorizedJson,
	},
	"std.sql": {
		sqlQueryRaw,
		sqlJsonRowsList,
		sqlJsonMemberRow,
	},
};

const runtimeStdCallAliases: Record<string, [PointRuntimeStdModule, string]> = {
	textLength: ["std.text", "textLength"],
	textContains: ["std.text", "textContains"],
	textSplit: ["std.text", "textSplit"],
	textTrim: ["std.text", "textTrim"],
	textFromIntRaw: ["std.text", "textFromInt"],
	textPadStartRaw: ["std.text", "textPadStart"],
	jsonParse: ["std.json", "jsonParse"],
	jsonStringify: ["std.json", "jsonStringify"],
	httpGetRaw: ["std.http", "httpGet"],
	httpPostRaw: ["std.http", "httpPost"],
	httpFetchRaw: ["std.http", "httpFetch"],
	httpAssertStatusRaw: ["std.http", "httpAssertStatus"],
	httpAssertJsonBodyRaw: ["std.http", "httpAssertJsonBody"],
	instantNowRaw: ["std.time", "instantNow"],
	parseInstantRaw: ["std.time", "parseInstant"],
	formatInstantRaw: ["std.time", "formatInstant"],
	formatInstantInTimezoneRaw: ["std.time", "formatInstantInTimezone"],
	timeNow: ["std.time", "now"],
	sleepMilliseconds: ["std.time", "sleep"],
	formatTime: ["std.time", "formatTime"],
	durationFromSecondsRaw: ["std.time", "durationFromSeconds"],
	durationToSecondsRaw: ["std.time", "durationToSeconds"],
	durationFromMinutesRaw: ["std.time", "durationFromMinutes"],
	authBearerToken: ["std.auth", "authBearerToken"],
	authJwtOk: ["std.auth", "authJwtOk"],
	authSignJwt: ["std.auth", "authSignJwt"],
	authVerifyJwt: ["std.auth", "authVerifyJwt"],
	authUnauthorizedJson: ["std.auth", "authUnauthorizedJson"],
	sqlQueryRaw: ["std.sql", "sqlQueryRaw"],
	sqlJsonRowsList: ["std.sql", "sqlJsonRowsList"],
	sqlJsonMemberRow: ["std.sql", "sqlJsonMemberRow"],
};

export function resolveRuntimeStdBuiltin(moduleName: string, importName: string): PointRuntimeStdBuiltin | undefined {
	const module = runtimeStdDispatch[normalizeStdModuleName(moduleName) as PointRuntimeStdModule];
	return module?.[importName];
}

export function dispatchRuntimeStdCall(callee: string, args: unknown[]): unknown {
	const target = runtimeStdCallAliases[callee];
	if (!target) return undefined;
	const builtin = resolveRuntimeStdBuiltin(target[0], target[1]);
	return builtin?.(...args);
}

function normalizeStdModuleName(moduleName: string): string {
	const normalized = moduleName.replaceAll("/", ".");
	if (normalized.startsWith("@hatchingpoint.point.std.")) {
		return normalized.replace("@hatchingpoint.point.", "");
	}
	if (normalized.startsWith("@hatchingpoint/point.std.")) {
		return normalized.replace("@hatchingpoint/point.", "");
	}
	return normalized;
}
