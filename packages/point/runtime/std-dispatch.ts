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
	cryptoHmacSha256,
	cryptoJwtIsValid,
	cryptoJwtSign,
	cryptoJwtVerify,
	cryptoSha256,
} from "./builtins/crypto.ts";
import { yamlParse, yamlStringify } from "./builtins/yaml.ts";
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
import { readFile, writeFile } from "./builtins/fs.ts";
import {
	pathBasename,
	pathDirname,
	pathExtname,
	pathIsAbsolute,
	pathJoin,
	pathResolve,
} from "./builtins/path.ts";
import { envGet } from "./builtins/env.ts";
import { formatCentsUsd } from "./builtins/money.ts";
import {
	streamJoinLines,
	streamReadLines,
	streamReadText,
	streamWriteLines,
	streamWriteText,
} from "./builtins/stream.ts";
import {
	processSpawn,
	processStreamLines,
} from "./builtins/process.ts";
import {
	imageMetadata,
	imageResize,
} from "./builtins/image.ts";
import {
	ptySpawn,
	ptyStreamLines,
	ptyWrite,
} from "./builtins/pty.ts";
import {
	anthropicComplete,
	anthropicStream,
	openaiComplete,
	openaiStream,
} from "./builtins/ai.ts";

export type PointRuntimeStdModule =
	| "std.text"
	| "std.json"
	| "std.http"
	| "std.time"
	| "std.auth"
	| "std.sql"
	| "std.fs"
	| "std.path"
	| "std.env"
	| "std.crypto"
	| "std.yaml"
	| "std.money"
	| "std.stream"
	| "std.process"
	| "std.image"
	| "std.pty"
	| "std.ai";
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
	"std.crypto": {
		cryptoSha256,
		cryptoHmacSha256,
		cryptoJwtSign,
		cryptoJwtVerify,
		cryptoJwtIsValid,
	},
	"std.yaml": {
		yamlParse,
		yamlStringify,
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
	"std.fs": {
		readFile,
		writeFile,
	},
	"std.path": {
		pathJoin,
		pathBasename,
		pathDirname,
		pathExtname,
		pathResolve,
		pathIsAbsolute,
	},
	"std.env": {
		envGet,
	},
	"std.money": {
		formatCentsUsd,
	},
	"std.stream": {
		streamReadText,
		streamWriteText,
		streamReadLines,
		streamWriteLines,
		streamJoinLines,
	},
	"std.process": {
		processSpawn,
		processStreamLines,
	},
	"std.image": {
		imageMetadata,
		imageResize,
	},
	"std.pty": {
		ptySpawn,
		ptyWrite,
		ptyStreamLines,
	},
	"std.ai": {
		openaiComplete,
		openaiStream,
		anthropicComplete,
		anthropicStream,
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
	cryptoSha256: ["std.crypto", "cryptoSha256"],
	cryptoHmacSha256: ["std.crypto", "cryptoHmacSha256"],
	cryptoJwtSign: ["std.crypto", "cryptoJwtSign"],
	cryptoJwtVerify: ["std.crypto", "cryptoJwtVerify"],
	cryptoJwtIsValid: ["std.crypto", "cryptoJwtIsValid"],
	yamlParse: ["std.yaml", "yamlParse"],
	yamlStringify: ["std.yaml", "yamlStringify"],
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
	readFileRaw: ["std.fs", "readFile"],
	writeFileRaw: ["std.fs", "writeFile"],
	joinPaths: ["std.path", "pathJoin"],
	pathBasename: ["std.path", "pathBasename"],
	pathDirname: ["std.path", "pathDirname"],
	pathExtname: ["std.path", "pathExtname"],
	resolvePath: ["std.path", "pathResolve"],
	pathIsAbsolute: ["std.path", "pathIsAbsolute"],
	envGetRaw: ["std.env", "envGet"],
	formatCentsUsdRaw: ["std.money", "formatCentsUsd"],
	streamReadTextRaw: ["std.stream", "streamReadText"],
	streamWriteTextRaw: ["std.stream", "streamWriteText"],
	streamReadLinesRaw: ["std.stream", "streamReadLines"],
	streamWriteLinesRaw: ["std.stream", "streamWriteLines"],
	streamJoinLinesRaw: ["std.stream", "streamJoinLines"],
	processSpawn: ["std.process", "processSpawn"],
	processStreamLines: ["std.process", "processStreamLines"],
	imageMetadata: ["std.image", "imageMetadata"],
	imageResize: ["std.image", "imageResize"],
	ptySpawn: ["std.pty", "ptySpawn"],
	ptyWrite: ["std.pty", "ptyWrite"],
	ptyStreamLines: ["std.pty", "ptyStreamLines"],
	openaiComplete: ["std.ai", "openaiComplete"],
	openaiStream: ["std.ai", "openaiStream"],
	anthropicComplete: ["std.ai", "anthropicComplete"],
	anthropicStream: ["std.ai", "anthropicStream"],
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
