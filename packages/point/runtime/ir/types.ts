import type { PointCoreBinaryOperator, PointCoreTypeExpression } from "../../src/core/ast.ts";
import type { PointCoreDiagnostic } from "../../src/core/check.ts";

export const POINT_IR_SCHEMA_VERSION = "point.runtime.ir.v1" as const;

export type PointIrProgram = {
	schemaVersion: typeof POINT_IR_SCHEMA_VERSION;
	module?: string;
	records: PointIrRecord[];
	externals: PointIrExternal[];
	globals: PointIrGlobal[];
	functions: PointIrFunction[];
};

export type PointIrRecord = {
	name: string;
	fields: Array<{ name: string; type: PointCoreTypeExpression; semanticName?: string }>;
};

export type PointIrExternal = {
	name: string;
	params: Array<{ name: string; type: PointCoreTypeExpression }>;
	returnType: PointCoreTypeExpression;
	from: string;
	importName?: string;
};

export type PointIrGlobal = {
	name: string;
	type: PointCoreTypeExpression;
	mutable: boolean;
	bytecode: PointIrInstruction[];
};

export type PointIrFunction = {
	name: string;
	params: Array<{ name: string; type: PointCoreTypeExpression; semanticName?: string }>;
	returnType: PointCoreTypeExpression;
	semantic?: { kind: string; name: string };
	bytecode: PointIrInstruction[];
};

export type PointIrInstruction =
	| { op: "PUSH_CONST"; value: string | number | boolean | null }
	| { op: "LOAD_LOCAL"; name: string }
	| { op: "LOAD_GLOBAL"; name: string }
	| { op: "STORE_LOCAL"; name: string; operator: "=" | "+=" | "-="; mutable?: boolean; type?: PointCoreTypeExpression }
	| { op: "STORE_GLOBAL"; name: string; operator: "=" | "+=" | "-=" }
	| { op: "MAKE_LIST"; count: number }
	| { op: "MAKE_RECORD"; fields: string[] }
	| { op: "GET_FIELD"; name: string }
	| { op: "CALL"; callee: string; argc: number }
	| { op: "AWAIT" }
	| { op: "BINARY"; operator: PointCoreBinaryOperator }
	| { op: "POP" }
	| { op: "RETURN"; hasValue: boolean }
	| { op: "YIELD"; hasValue: boolean }
	| { op: "LABEL"; label: string }
	| { op: "JUMP"; label: string }
	| { op: "JUMP_IF_FALSE"; label: string }
	| { op: "ITER_START"; iterator: string }
	| { op: "ITER_NEXT"; iterator: string; item: string; doneLabel: string };

export class PointIrLoweringError extends Error {
	constructor(readonly diagnostics: PointCoreDiagnostic[]) {
		super(`Cannot lower unchecked Point core program: ${diagnostics.length} diagnostic(s).`);
		this.name = "PointIrLoweringError";
	}
}
