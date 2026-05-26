import type { PointIrFunction, PointIrInstruction, PointIrProgram } from "../ir/index.ts";
import type { PointCoreProgram } from "../../src/core/ast.ts";
import { lowerCheckedCoreProgramToBytecode } from "../ir/index.ts";

export type PointRuntimeJsonResponse = {
	readonly __pointRuntimeResponse: true;
	readonly body: PointRuntimeValue;
	readonly status: number;
	readonly headers: Record<string, string>;
};

export type PointRuntimeValue =
	| string
	| number
	| boolean
	| null
	| PointRuntimeValue[]
	| { [key: string]: PointRuntimeValue }
	| PointRuntimeJsonResponse;

export class PointInterpreterError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PointInterpreterError";
	}
}

type RuntimeScope = {
	globals: Map<string, PointRuntimeValue>;
	functions: Map<string, PointIrFunction>;
};

type FunctionFrame = {
	locals: Map<string, PointRuntimeValue>;
	stack: PointRuntimeValue[];
	iterators: Map<string, { items: PointRuntimeValue[]; index: number }>;
};

export function interpretPointIrFunction(
	program: PointIrProgram,
	functionName: string,
	args: PointRuntimeValue[] = [],
): PointRuntimeValue {
	const scope = createRuntimeScope(program);
	const fn = scope.functions.get(functionName);
	if (!fn) throw new Error(`Runtime function not found: ${functionName}`);
	return executeFunction(scope, fn, args);
}

export function interpretIrProgramEntry(program: PointIrProgram, entryName: string, args: PointRuntimeValue[] = []): PointRuntimeValue {
	return interpretPointIrFunction(program, entryName, args);
}

export function interpretPointIrEntry(program: PointIrProgram, entryName: string, args: PointRuntimeValue[] = []): PointRuntimeValue {
	return interpretPointIrFunction(program, entryName, args);
}

export function interpretCoreProgramEntry(program: PointCoreProgram, entryName: string, args: PointRuntimeValue[] = []): PointRuntimeValue {
	return interpretPointIrFunction(lowerCheckedCoreProgramToBytecode(program), entryName, args);
}

function createRuntimeScope(program: PointIrProgram): RuntimeScope {
	const scope: RuntimeScope = {
		globals: new Map(),
		functions: new Map(program.functions.map((fn) => [fn.name, fn])),
	};
	for (const global of program.globals) {
		executeInstructions(scope, createFrame(), global.bytecode);
	}
	return scope;
}

function executeFunction(scope: RuntimeScope, fn: PointIrFunction, args: PointRuntimeValue[]): PointRuntimeValue {
	const frame = createFrame();
	if (args.length !== fn.params.length) {
		throw new PointInterpreterError(`Function ${fn.name} expected ${fn.params.length} argument(s), got ${args.length}.`);
	}
	for (const [index, param] of fn.params.entries()) {
		frame.locals.set(param.name, args[index] ?? null);
	}
	return executeInstructions(scope, frame, fn.bytecode);
}

function executeInstructions(scope: RuntimeScope, frame: FunctionFrame, instructions: PointIrInstruction[]): PointRuntimeValue {
	const labels = indexLabels(instructions);
	for (let pc = 0; pc < instructions.length; pc += 1) {
		const instruction = instructions[pc]!;
		if (instruction.op === "PUSH_CONST") {
			frame.stack.push(instruction.value);
			continue;
		}
		if (instruction.op === "LOAD_LOCAL") {
			frame.stack.push(frame.locals.get(instruction.name) ?? null);
			continue;
		}
		if (instruction.op === "LOAD_GLOBAL") {
			frame.stack.push(scope.globals.get(instruction.name) ?? null);
			continue;
		}
		if (instruction.op === "STORE_LOCAL") {
			storeValue(frame.locals, instruction.name, pop(frame), instruction.operator);
			continue;
		}
		if (instruction.op === "STORE_GLOBAL") {
			storeValue(scope.globals, instruction.name, pop(frame), instruction.operator);
			continue;
		}
		if (instruction.op === "MAKE_LIST") {
			frame.stack.push(popMany(frame, instruction.count));
			continue;
		}
		if (instruction.op === "MAKE_RECORD") {
			const values = popMany(frame, instruction.fields.length);
			const record: { [key: string]: PointRuntimeValue } = {};
			for (const [index, field] of instruction.fields.entries()) {
				record[field] = values[index] ?? null;
			}
			frame.stack.push(record);
			continue;
		}
		if (instruction.op === "GET_FIELD") {
			const target = pop(frame);
			if (target === null || typeof target !== "object" || Array.isArray(target)) {
				throw new Error(`Cannot read field ${instruction.name} from non-record value.`);
			}
			frame.stack.push(target[instruction.name] ?? null);
			continue;
		}
		if (instruction.op === "CALL") {
			const args = popMany(frame, instruction.argc);
			if (instruction.callee === "pointJsonResponse") {
				frame.stack.push(pointJsonResponse(args));
				continue;
			}
			const fn = scope.functions.get(instruction.callee);
			if (!fn) throw new Error(`Runtime call target not found: ${instruction.callee}`);
			frame.stack.push(executeFunction(scope, fn, args));
			continue;
		}
		if (instruction.op === "AWAIT") {
			continue;
		}
		if (instruction.op === "BINARY") {
			const right = pop(frame);
			const left = pop(frame);
			frame.stack.push(evaluateBinary(left, right, instruction.operator));
			continue;
		}
		if (instruction.op === "POP") {
			pop(frame);
			continue;
		}
		if (instruction.op === "RETURN") {
			return instruction.hasValue ? pop(frame) : null;
		}
		if (instruction.op === "YIELD") {
			throw new Error("Runtime interpreter does not support yield yet.");
		}
		if (instruction.op === "LABEL") {
			continue;
		}
		if (instruction.op === "JUMP") {
			pc = jumpTo(labels, instruction.label);
			continue;
		}
		if (instruction.op === "JUMP_IF_FALSE") {
			if (!pop(frame)) pc = jumpTo(labels, instruction.label);
			continue;
		}
		if (instruction.op === "ITER_START") {
			const iterable = pop(frame);
			if (!Array.isArray(iterable)) throw new Error("Runtime for-each expected a list.");
			frame.iterators.set(instruction.iterator, { items: iterable, index: 0 });
			continue;
		}
		if (instruction.op === "ITER_NEXT") {
			const iterator = frame.iterators.get(instruction.iterator);
			if (!iterator) throw new Error(`Runtime iterator not found: ${instruction.iterator}`);
			if (iterator.index >= iterator.items.length) {
				pc = jumpTo(labels, instruction.doneLabel);
				continue;
			}
			frame.locals.set(instruction.item, iterator.items[iterator.index++] ?? null);
			continue;
		}
	}
	return null;
}

function pointJsonResponse(args: PointRuntimeValue[]): PointRuntimeJsonResponse {
	const status = typeof args[1] === "number" ? args[1] : 200;
	const headers = isRecord(args[2]) ? stringRecord(args[2]) : {};
	return {
		__pointRuntimeResponse: true,
		body: args[0] ?? null,
		status,
		headers,
	};
}

function createFrame(): FunctionFrame {
	return { locals: new Map(), stack: [], iterators: new Map() };
}

function indexLabels(instructions: PointIrInstruction[]): Map<string, number> {
	const labels = new Map<string, number>();
	for (const [index, instruction] of instructions.entries()) {
		if (instruction.op === "LABEL") labels.set(instruction.label, index);
	}
	return labels;
}

function jumpTo(labels: Map<string, number>, label: string): number {
	const index = labels.get(label);
	if (index === undefined) throw new Error(`Runtime label not found: ${label}`);
	return index;
}

function pop(frame: FunctionFrame): PointRuntimeValue {
	if (frame.stack.length === 0) throw new Error("Runtime stack underflow.");
	return frame.stack.pop()!;
}

function popMany(frame: FunctionFrame, count: number): PointRuntimeValue[] {
	if (frame.stack.length < count) throw new Error("Runtime stack underflow.");
	return frame.stack.splice(frame.stack.length - count, count);
}

function storeValue(target: Map<string, PointRuntimeValue>, name: string, value: PointRuntimeValue, operator: "=" | "+=" | "-="): void {
	if (operator === "=") {
		target.set(name, value);
		return;
	}
	const current = target.get(name);
	if (typeof current !== "number" || typeof value !== "number") {
		throw new Error(`Runtime assignment ${operator} requires numeric values.`);
	}
	target.set(name, operator === "+=" ? current + value : current - value);
}

function evaluateBinary(left: PointRuntimeValue, right: PointRuntimeValue, operator: string): PointRuntimeValue {
	if (operator === "==") return left === right;
	if (operator === "!=") return left !== right;
	if (operator === "and") return Boolean(left) && Boolean(right);
	if (operator === "or") return Boolean(left) || Boolean(right);
	if (typeof left !== "number" || typeof right !== "number") {
		if (operator === "+") return String(left) + String(right);
		throw new Error(`Runtime operator ${operator} requires numeric values.`);
	}
	if (operator === "+") return left + right;
	if (operator === "-") return left - right;
	if (operator === "*") return left * right;
	if (operator === "/") return left / right;
	if (operator === "<") return left < right;
	if (operator === "<=") return left <= right;
	if (operator === ">") return left > right;
	if (operator === ">=") return left >= right;
	throw new Error(`Runtime operator not supported: ${operator}`);
}

function isRecord(value: PointRuntimeValue | undefined): value is { [key: string]: PointRuntimeValue } {
	return value !== undefined && value !== null && typeof value === "object" && !Array.isArray(value) && !("__pointRuntimeResponse" in value);
}

function stringRecord(value: { [key: string]: PointRuntimeValue }): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (entry === null) continue;
		result[key] = String(entry);
	}
	return result;
}
