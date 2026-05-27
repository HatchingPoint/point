import type { PointIrFunction, PointIrInstruction, PointIrProgram } from "../ir/index.ts";
import type { PointCoreProgram } from "../../src/core/ast.ts";
import { lowerCheckedCoreProgramToBytecode } from "../ir/index.ts";
import { resolveRuntimeStdBuiltin, type PointRuntimeStdBuiltin } from "../std-dispatch.ts";

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
	stdFunctions: Map<string, PointRuntimeStdBuiltin>;
};

type RuntimeStackValue = PointRuntimeValue | Promise<PointRuntimeValue>;

type FunctionFrame = {
	locals: Map<string, PointRuntimeValue>;
	stack: RuntimeStackValue[];
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

export async function interpretPointIrFunctionAsync(
	program: PointIrProgram,
	functionName: string,
	args: PointRuntimeValue[] = [],
): Promise<PointRuntimeValue> {
	const scope = createRuntimeScope(program);
	const fn = scope.functions.get(functionName);
	if (!fn) throw new Error(`Runtime function not found: ${functionName}`);
	return executeFunctionAsync(scope, fn, args);
}

export async function interpretIrProgramEntryAsync(
	program: PointIrProgram,
	entryName: string,
	args: PointRuntimeValue[] = [],
): Promise<PointRuntimeValue> {
	return interpretPointIrFunctionAsync(program, entryName, args);
}

export async function interpretPointIrEntryAsync(
	program: PointIrProgram,
	entryName: string,
	args: PointRuntimeValue[] = [],
): Promise<PointRuntimeValue> {
	return interpretPointIrFunctionAsync(program, entryName, args);
}

export async function interpretCoreProgramEntryAsync(
	program: PointCoreProgram,
	entryName: string,
	args: PointRuntimeValue[] = [],
): Promise<PointRuntimeValue> {
	return interpretPointIrFunctionAsync(lowerCheckedCoreProgramToBytecode(program), entryName, args);
}

function createRuntimeScope(program: PointIrProgram): RuntimeScope {
	const scope: RuntimeScope = {
		globals: new Map(),
		functions: new Map(program.functions.map((fn) => [fn.name, fn])),
		stdFunctions: new Map(),
	};
	for (const external of program.externals) {
		const builtin = resolveRuntimeStdBuiltin(external.from, external.importName ?? external.name);
		if (builtin) scope.stdFunctions.set(external.name, builtin);
	}
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

async function executeFunctionAsync(scope: RuntimeScope, fn: PointIrFunction, args: PointRuntimeValue[]): Promise<PointRuntimeValue> {
	const frame = createFrame();
	if (args.length !== fn.params.length) {
		throw new PointInterpreterError(`Function ${fn.name} expected ${fn.params.length} argument(s), got ${args.length}.`);
	}
	for (const [index, param] of fn.params.entries()) {
		frame.locals.set(param.name, args[index] ?? null);
	}
	return executeInstructionsAsync(scope, frame, fn.bytecode);
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
			storeValue(frame.locals, instruction.name, popSync(frame), instruction.operator);
			continue;
		}
		if (instruction.op === "STORE_GLOBAL") {
			storeValue(scope.globals, instruction.name, popSync(frame), instruction.operator);
			continue;
		}
		if (instruction.op === "MAKE_LIST") {
			frame.stack.push(popManySync(frame, instruction.count));
			continue;
		}
		if (instruction.op === "MAKE_RECORD") {
			const values = popManySync(frame, instruction.fields.length);
			const record: { [key: string]: PointRuntimeValue } = {};
			for (const [index, field] of instruction.fields.entries()) {
				record[field] = values[index] ?? null;
			}
			frame.stack.push(record);
			continue;
		}
		if (instruction.op === "GET_FIELD") {
			const target = popSync(frame);
			if (target === null || typeof target !== "object" || Array.isArray(target)) {
				throw new Error(`Cannot read field ${instruction.name} from non-record value.`);
			}
			frame.stack.push(target[instruction.name] ?? null);
			continue;
		}
		if (instruction.op === "CALL") {
			const args = popManySync(frame, instruction.argc);
			if (instruction.callee === "pointJsonResponse") {
				frame.stack.push(pointJsonResponse(args));
				continue;
			}
			const stdFn = scope.stdFunctions.get(instruction.callee);
			if (stdFn) {
				const value = stdFn(...(args as never[]));
				if (value instanceof Promise) throw new Error(`Runtime std function ${instruction.callee} requires async execution.`);
				frame.stack.push(value as PointRuntimeValue);
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
			const right = popSync(frame);
			const left = popSync(frame);
			frame.stack.push(evaluateBinary(left, right, instruction.operator));
			continue;
		}
		if (instruction.op === "POP") {
			pop(frame);
			continue;
		}
		if (instruction.op === "RETURN") {
			return instruction.hasValue ? popSync(frame) : null;
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
			if (!popSync(frame)) pc = jumpTo(labels, instruction.label);
			continue;
		}
		if (instruction.op === "ITER_START") {
			const iterable = popSync(frame);
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

async function executeInstructionsAsync(scope: RuntimeScope, frame: FunctionFrame, instructions: PointIrInstruction[]): Promise<PointRuntimeValue> {
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
			storeValue(frame.locals, instruction.name, await resolveRuntimeValue(pop(frame)), instruction.operator);
			continue;
		}
		if (instruction.op === "STORE_GLOBAL") {
			storeValue(scope.globals, instruction.name, await resolveRuntimeValue(pop(frame)), instruction.operator);
			continue;
		}
		if (instruction.op === "MAKE_LIST") {
			frame.stack.push(await Promise.all(popMany(frame, instruction.count).map(resolveRuntimeValue)));
			continue;
		}
		if (instruction.op === "MAKE_RECORD") {
			const values = await Promise.all(popMany(frame, instruction.fields.length).map(resolveRuntimeValue));
			const record: { [key: string]: PointRuntimeValue } = {};
			for (const [index, field] of instruction.fields.entries()) {
				record[field] = values[index] ?? null;
			}
			frame.stack.push(record);
			continue;
		}
		if (instruction.op === "GET_FIELD") {
			const target = await resolveRuntimeValue(pop(frame));
			if (target === null || typeof target !== "object" || Array.isArray(target)) {
				throw new Error(`Cannot read field ${instruction.name} from non-record value.`);
			}
			frame.stack.push(target[instruction.name] ?? null);
			continue;
		}
		if (instruction.op === "CALL") {
			const args = await Promise.all(popMany(frame, instruction.argc).map(resolveRuntimeValue));
			if (instruction.callee === "pointJsonResponse") {
				frame.stack.push(pointJsonResponse(args));
				continue;
			}
			const stdFn = scope.stdFunctions.get(instruction.callee);
			if (stdFn) {
				frame.stack.push((await stdFn(...(args as never[]))) as PointRuntimeValue);
				continue;
			}
			const fn = scope.functions.get(instruction.callee);
			if (!fn) throw new Error(`Runtime call target not found: ${instruction.callee}`);
			frame.stack.push(await executeFunctionAsync(scope, fn, args));
			continue;
		}
		if (instruction.op === "AWAIT") {
			frame.stack.push(await resolveRuntimeValue(pop(frame)));
			continue;
		}
		if (instruction.op === "BINARY") {
			const right = await resolveRuntimeValue(pop(frame));
			const left = await resolveRuntimeValue(pop(frame));
			frame.stack.push(evaluateBinary(left, right, instruction.operator));
			continue;
		}
		if (instruction.op === "POP") {
			pop(frame);
			continue;
		}
		if (instruction.op === "RETURN") {
			return instruction.hasValue ? await resolveRuntimeValue(pop(frame)) : null;
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
			if (!(await resolveRuntimeValue(pop(frame)))) pc = jumpTo(labels, instruction.label);
			continue;
		}
		if (instruction.op === "ITER_START") {
			const iterable = await resolveRuntimeValue(pop(frame));
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

async function resolveRuntimeValue(value: RuntimeStackValue): Promise<PointRuntimeValue> {
	return value;
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

function pop(frame: FunctionFrame): RuntimeStackValue {
	if (frame.stack.length === 0) throw new Error("Runtime stack underflow.");
	return frame.stack.pop()!;
}

function popMany(frame: FunctionFrame, count: number): RuntimeStackValue[] {
	if (frame.stack.length < count) throw new Error("Runtime stack underflow.");
	return frame.stack.splice(frame.stack.length - count, count);
}

function popSync(frame: FunctionFrame): PointRuntimeValue {
	const value = pop(frame);
	if (value instanceof Promise) throw new Error("Runtime async value requires async execution.");
	return value;
}

function popManySync(frame: FunctionFrame, count: number): PointRuntimeValue[] {
	return popMany(frame, count).map((value) => {
		if (value instanceof Promise) throw new Error("Runtime async value requires async execution.");
		return value;
	});
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
