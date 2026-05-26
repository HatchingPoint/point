import type {
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreFunctionDeclaration,
	PointCoreProgram,
	PointCoreStatement,
	PointCoreTypeDeclaration,
	PointCoreValueDeclaration,
} from "../../src/core/ast.ts";
import { checkPointCore } from "../../src/core/check.ts";
import { POINT_IR_SCHEMA_VERSION, PointIrLoweringError, type PointIrFunction, type PointIrGlobal, type PointIrInstruction, type PointIrProgram } from "./types.ts";

type FunctionLoweringContext = {
	instructions: PointIrInstruction[];
	locals: Set<string>;
	labelCounter: number;
	iteratorCounter: number;
};

export function lowerCheckedCoreProgramToBytecode(program: PointCoreProgram): PointIrProgram {
	const diagnostics = checkPointCore(program);
	if (diagnostics.length > 0) throw new PointIrLoweringError(diagnostics);

	return {
		schemaVersion: POINT_IR_SCHEMA_VERSION,
		module: program.module,
		records: program.declarations.filter(isTypeDeclaration).map((declaration) => ({
			name: declaration.name,
			fields: declaration.fields.map((field) => ({ name: field.name, type: field.type, semanticName: field.semanticName })),
		})),
		externals: program.declarations
			.filter((declaration): declaration is Extract<PointCoreDeclaration, { kind: "external" }> => declaration.kind === "external")
			.map((declaration) => ({
				name: declaration.name,
				params: declaration.params.map((param) => ({ name: param.name, type: param.type })),
				returnType: declaration.returnType,
				from: declaration.from,
				importName: declaration.importName,
			})),
		globals: program.declarations.filter(isValueDeclaration).map(lowerGlobal),
		functions: program.declarations.filter(isFunctionDeclaration).map(lowerFunction),
	};
}

function lowerGlobal(declaration: PointCoreValueDeclaration): PointIrGlobal {
	const instructions: PointIrInstruction[] = [];
	lowerExpression(declaration.value, instructions, new Set());
	instructions.push({ op: "STORE_GLOBAL", name: declaration.name, operator: "=" });
	return {
		name: declaration.name,
		type: declaration.type,
		mutable: declaration.mutable,
		bytecode: instructions,
	};
}

function lowerFunction(declaration: PointCoreFunctionDeclaration): PointIrFunction {
	const ctx: FunctionLoweringContext = {
		instructions: [],
		locals: new Set(declaration.params.map((param) => param.name)),
		labelCounter: 0,
		iteratorCounter: 0,
	};
	for (const statement of declaration.body) lowerStatement(statement, ctx);
	return {
		name: declaration.name,
		params: declaration.params.map((param) => ({ name: param.name, type: param.type, semanticName: param.semanticName })),
		returnType: declaration.returnType,
		semantic: declaration.semantic ? { kind: declaration.semantic.kind, name: declaration.semantic.name } : undefined,
		bytecode: ctx.instructions,
	};
}

function lowerStatement(statement: PointCoreStatement, ctx: FunctionLoweringContext): void {
	if (statement.kind === "return") {
		if (statement.value) lowerExpression(statement.value, ctx.instructions, ctx.locals);
		ctx.instructions.push({ op: "RETURN", hasValue: statement.value !== undefined });
		return;
	}
	if (statement.kind === "yield") {
		if (statement.value) lowerExpression(statement.value, ctx.instructions, ctx.locals);
		ctx.instructions.push({ op: "YIELD", hasValue: statement.value !== undefined });
		return;
	}
	if (statement.kind === "value") {
		lowerExpression(statement.value, ctx.instructions, ctx.locals);
		ctx.locals.add(statement.name);
		ctx.instructions.push({ op: "STORE_LOCAL", name: statement.name, operator: "=", mutable: statement.mutable, type: statement.type });
		return;
	}
	if (statement.kind === "assignment") {
		lowerExpression(statement.value, ctx.instructions, ctx.locals);
		ctx.instructions.push(
			ctx.locals.has(statement.name)
				? { op: "STORE_LOCAL", name: statement.name, operator: statement.operator }
				: { op: "STORE_GLOBAL", name: statement.name, operator: statement.operator },
		);
		return;
	}
	if (statement.kind === "if") {
		const elseLabel = nextLabel(ctx, "else");
		const endLabel = nextLabel(ctx, "endif");
		lowerExpression(statement.condition, ctx.instructions, ctx.locals);
		ctx.instructions.push({ op: "JUMP_IF_FALSE", label: elseLabel });
		for (const child of statement.thenBody) lowerStatement(child, ctx);
		ctx.instructions.push({ op: "JUMP", label: endLabel }, { op: "LABEL", label: elseLabel });
		for (const child of statement.elseBody) lowerStatement(child, ctx);
		ctx.instructions.push({ op: "LABEL", label: endLabel });
		return;
	}
	if (statement.kind === "for") {
		const iterator = `__iter${ctx.iteratorCounter++}`;
		const startLabel = nextLabel(ctx, "for");
		const doneLabel = nextLabel(ctx, "endfor");
		lowerExpression(statement.iterable, ctx.instructions, ctx.locals);
		ctx.instructions.push({ op: "ITER_START", iterator }, { op: "LABEL", label: startLabel });
		ctx.locals.add(statement.itemName);
		ctx.instructions.push({ op: "ITER_NEXT", iterator, item: statement.itemName, doneLabel });
		for (const child of statement.body) lowerStatement(child, ctx);
		ctx.instructions.push({ op: "JUMP", label: startLabel }, { op: "LABEL", label: doneLabel });
		return;
	}
	lowerExpression(statement.value, ctx.instructions, ctx.locals);
	ctx.instructions.push({ op: "POP" });
}

function lowerExpression(expression: PointCoreExpression, instructions: PointIrInstruction[], locals: Set<string>): void {
	if (expression.kind === "literal") {
		instructions.push({ op: "PUSH_CONST", value: expression.value });
		return;
	}
	if (expression.kind === "identifier") {
		instructions.push(locals.has(expression.name) ? { op: "LOAD_LOCAL", name: expression.name } : { op: "LOAD_GLOBAL", name: expression.name });
		return;
	}
	if (expression.kind === "list") {
		for (const item of expression.items) lowerExpression(item, instructions, locals);
		instructions.push({ op: "MAKE_LIST", count: expression.items.length });
		return;
	}
	if (expression.kind === "record") {
		for (const field of expression.fields) lowerExpression(field.value, instructions, locals);
		instructions.push({ op: "MAKE_RECORD", fields: expression.fields.map((field) => field.name) });
		return;
	}
	if (expression.kind === "property") {
		lowerExpression(expression.target, instructions, locals);
		instructions.push({ op: "GET_FIELD", name: expression.name });
		return;
	}
	if (expression.kind === "await") {
		lowerExpression(expression.value, instructions, locals);
		instructions.push({ op: "AWAIT" });
		return;
	}
	if (expression.kind === "binary") {
		lowerExpression(expression.left, instructions, locals);
		lowerExpression(expression.right, instructions, locals);
		instructions.push({ op: "BINARY", operator: expression.operator });
		return;
	}
	for (const arg of expression.args) lowerExpression(arg, instructions, locals);
	instructions.push({ op: "CALL", callee: expression.callee, argc: expression.args.length });
}

function nextLabel(ctx: FunctionLoweringContext, prefix: string): string {
	return `${prefix}_${ctx.labelCounter++}`;
}

function isTypeDeclaration(declaration: PointCoreDeclaration): declaration is PointCoreTypeDeclaration {
	return declaration.kind === "type";
}

function isValueDeclaration(declaration: PointCoreDeclaration): declaration is PointCoreValueDeclaration {
	return declaration.kind === "value";
}

function isFunctionDeclaration(declaration: PointCoreDeclaration): declaration is PointCoreFunctionDeclaration {
	return declaration.kind === "function";
}
