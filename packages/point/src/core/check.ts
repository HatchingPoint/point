import type {
	PointCoreDeclaration,
	PointCoreExpression,
	PointCoreExternalDeclaration,
	PointCoreFunctionDeclaration,
	PointCoreProgram,
	PointCoreStatement,
	PointCoreTypeDeclaration,
	PointCoreTypeExpression,
	PointCoreValueDeclaration,
	PointSourceSpan,
} from "./ast.ts";

export interface PointCoreDiagnostic {
	code: string;
	message: string;
	path: string;
	ref: string;
	severity: "error";
	span: PointSourceSpan | null;
	expected?: string | string[];
	actual?: string;
	repair?: string;
	relatedRefs?: string[];
}

type DiagnosticMetadata = Partial<Pick<PointCoreDiagnostic, "expected" | "actual" | "repair" | "relatedRefs">>;
type ScopeEntry = { type: PointCoreTypeExpression; mutable: boolean };
type Scope = Map<string, ScopeEntry>;

const PRIMITIVE_TYPES = new Set(["Text", "Int", "Float", "Bool", "Void", "List", "Maybe", "Error", "Or", "Page", "Handler"]);

export function checkPointCore(program: PointCoreProgram): PointCoreDiagnostic[] {
	const checker = new CoreChecker(program);
	return checker.check();
}

class CoreChecker {
	private readonly diagnostics: PointCoreDiagnostic[] = [];
	private readonly types = new Set(PRIMITIVE_TYPES);
	private readonly typeDeclarations = new Map<string, PointCoreTypeDeclaration>();
	private readonly globals: Scope = new Map();
	private readonly functions = new Map<string, PointCoreFunctionDeclaration | PointCoreExternalDeclaration>();

	constructor(private readonly program: PointCoreProgram) {}

	check(): PointCoreDiagnostic[] {
		this.collectDeclarations();
		for (const declaration of this.program.declarations) this.checkDeclaration(declaration);
		return this.diagnostics;
	}

	private collectDeclarations() {
		for (const declaration of this.program.declarations) {
			if (declaration.kind === "type") {
				if (this.types.has(declaration.name)) {
					this.push("duplicate-type", `Duplicate type ${declaration.name}`, `type.${declaration.name}`, declaration.span);
				}
				this.types.add(declaration.name);
				this.typeDeclarations.set(declaration.name, declaration);
			}
			if (declaration.kind === "value") this.addGlobal(declaration);
			if (declaration.kind === "function") {
				if (this.functions.has(declaration.name)) {
					this.push("duplicate-function", `Duplicate function ${declaration.name}`, `fn.${declaration.name}`, declaration.span);
				}
				this.functions.set(declaration.name, declaration);
			}
			if (declaration.kind === "external") {
				if (this.functions.has(declaration.name)) {
					this.push("duplicate-function", `Duplicate function ${declaration.name}`, `external.${declaration.name}`, declaration.span);
				}
				this.functions.set(declaration.name, declaration);
			}
		}
	}

	private addGlobal(declaration: PointCoreValueDeclaration) {
		if (this.globals.has(declaration.name)) {
			this.push("duplicate-value", `Duplicate value ${declaration.name}`, `value.${declaration.name}`, declaration.span);
		}
		this.globals.set(declaration.name, { type: declaration.type, mutable: declaration.mutable });
	}

	private checkDeclaration(declaration: PointCoreDeclaration) {
		if (declaration.kind === "import") return;
		if (declaration.kind === "external") {
			for (const param of declaration.params) this.checkType(param.type, `external.${declaration.name}.${param.name}.type`);
			this.checkType(declaration.returnType, `external.${declaration.name}.return`);
			return;
		}
		if (declaration.kind === "type") {
			for (const field of declaration.fields) this.checkType(field.type, `type.${declaration.name}.${field.name}`);
			return;
		}
		if (declaration.kind === "value") {
			this.checkType(declaration.type, `value.${declaration.name}.type`);
			this.checkExpressionAssignable(declaration.value, declaration.type, `value.${declaration.name}.value`, this.globals);
			return;
		}
		this.checkFunction(declaration);
	}

	private checkFunction(declaration: PointCoreFunctionDeclaration) {
		this.checkType(declaration.returnType, `fn.${declaration.name}.return`);
		const locals = new Map(this.globals);
		for (const param of declaration.params) {
			this.checkType(param.type, `fn.${declaration.name}.${param.name}.type`);
			locals.set(param.name, { type: param.type, mutable: false });
		}
		for (const statement of declaration.body) {
			this.checkStatement(statement, declaration, locals);
		}
	}

	private checkStatement(
		statement: PointCoreStatement,
		fn: PointCoreFunctionDeclaration,
		locals: Scope,
	) {
		if (statement.kind === "return") {
			if (!statement.value) {
				if (fn.returnType.name !== "Void") {
					this.push("return-type-mismatch", `Function ${fn.name} must return ${fn.returnType.name}`, `fn.${fn.name}.return`, statement.span);
				}
				return;
			}
			if (fn.semantic?.kind === "page" || fn.semantic?.kind === "view") return;
			this.checkExpressionAssignable(statement.value, fn.returnType, `fn.${fn.name}.return`, locals);
			return;
		}
		if (statement.kind === "value") {
			this.checkType(statement.type, `fn.${fn.name}.${statement.name}.type`);
			this.checkExpressionAssignable(statement.value, statement.type, `fn.${fn.name}.${statement.name}.value`, locals);
			locals.set(statement.name, { type: statement.type, mutable: statement.mutable });
			return;
		}
		if (statement.kind === "assignment") {
			this.checkAssignment(statement, fn, locals);
			return;
		}
		if (statement.kind === "if") {
			this.checkExpressionAssignable(statement.condition, typeRef("Bool"), `fn.${fn.name}.if.condition`, locals);
			const thenLocals = new Map(locals);
			for (const child of statement.thenBody) this.checkStatement(child, fn, thenLocals);
			const elseLocals = new Map(locals);
			for (const child of statement.elseBody) this.checkStatement(child, fn, elseLocals);
			return;
		}
		if (statement.kind === "for") {
			this.checkForStatement(statement, fn, locals);
			return;
		}
		this.typeOfExpression(statement.value, locals, `fn.${fn.name}.expression`);
	}

	private checkForStatement(
		statement: Extract<PointCoreStatement, { kind: "for" }>,
		fn: PointCoreFunctionDeclaration,
		locals: Scope,
	) {
		const path = `fn.${fn.name}.for.${statement.itemName}`;
		const iterableType = this.typeOfExpression(statement.iterable, locals, `${path}.iterable`);
		if (!iterableType) return;
		if (iterableType.name !== "List" || iterableType.args.length !== 1) {
			this.push("iteration-type-mismatch", "for requires a List<T> iterable", path, statement.span, {
				expected: "List<T>",
				actual: formatType(iterableType),
				repair: "Iterate over a List<T> value or change this expression to a list.",
			});
			return;
		}
		const loopLocals = new Map(locals);
		loopLocals.set(statement.itemName, { type: iterableType.args[0]!, mutable: false });
		for (const child of statement.body) this.checkStatement(child, fn, loopLocals);
	}

	private checkAssignment(
		statement: Extract<PointCoreStatement, { kind: "assignment" }>,
		fn: PointCoreFunctionDeclaration,
		locals: Scope,
	) {
		const target = locals.get(statement.name);
		const path = `fn.${fn.name}.${statement.name}.assignment`;
		if (!target) {
			this.push("unknown-identifier", `Unknown identifier ${statement.name}`, path, statement.span, {
				actual: statement.name,
				repair: `Declare var ${statement.name}: <Type> before assigning to it.`,
			});
			this.typeOfExpression(statement.value, locals, `${path}.value`);
			return;
		}
		if (!target.mutable) {
			this.push("immutable-assignment", `Cannot assign to immutable value ${statement.name}`, path, statement.span, {
				actual: statement.name,
				repair: `Declare ${statement.name} with var if it needs to change.`,
			});
		}
		if ((statement.operator === "+=" || statement.operator === "-=") && !isNumeric(String(target.type.name))) {
			this.push("operator-type-mismatch", `${statement.operator} requires a numeric target`, path, statement.span, {
				expected: "Int or Float target",
				actual: formatType(target.type),
				repair: `Use ${statement.operator} only with Int or Float values.`,
			});
		}
		this.checkExpressionAssignable(statement.value, target.type, `${path}.value`, locals);
	}

	private checkExpressionAssignable(
		expression: PointCoreExpression,
		expected: PointCoreTypeExpression,
		path: string,
		scope: Scope,
	) {
		if (expected.name === "Maybe" && expected.args.length === 1) {
			if (expression.kind === "literal" && expression.value === null) return;
			if (expression.kind !== "record" && expression.kind !== "list") {
				const actual = this.typeOfExpression(expression, scope, path);
				if (actual && sameType(actual, expected)) return;
			}
			this.checkExpressionAssignable(expression, expected.args[0]!, path, scope);
			return;
		}
		if (expected.name === "Or" && expected.args.length > 0) {
			const diagnosticsBefore = this.diagnostics.length;
			const actual = this.typeOfExpression(expression, scope, path);
			if (!actual) return;
			if (sameType(actual, expected)) return;
			if (expected.args.some((candidate) => sameType(candidate, actual))) return;
			this.push("type-mismatch", `Expected ${formatType(expected)}, got ${formatType(actual)}`, path, expression.span, {
				expected: formatType(expected),
				actual: formatType(actual),
				repair: `Return or assign one of: ${expected.args.map(formatType).join(", ")}.`,
			});
			if (this.diagnostics.length > diagnosticsBefore + 1) return;
			return;
		}
		if (expression.kind === "list") {
			this.checkListAssignable(expression, expected, path, scope);
			return;
		}
		if (expression.kind === "record") {
			this.checkRecordAssignable(expression, expected, path, scope);
			return;
		}
		const actual = this.typeOfExpression(expression, scope, path);
		if (actual && !sameType(actual, expected)) {
			this.push("type-mismatch", `Expected ${formatType(expected)}, got ${formatType(actual)}`, path, expression.span, {
				expected: formatType(expected),
				actual: formatType(actual),
				repair: `Return or assign a ${formatType(expected)} value here.`,
			});
		}
	}

	private checkListAssignable(
		expression: Extract<PointCoreExpression, { kind: "list" }>,
		expected: PointCoreTypeExpression,
		path: string,
		scope: Scope,
	) {
		if (expected.name !== "List" || expected.args.length !== 1) {
			this.push("type-mismatch", `Expected ${formatType(expected)}, got List`, path, expression.span, {
				expected: formatType(expected),
				actual: "List",
				repair: `Annotate this value as List<T> or replace the list with a ${formatType(expected)} value.`,
			});
			return;
		}
		for (const [index, item] of expression.items.entries()) {
			this.checkExpressionAssignable(item, expected.args[0]!, `${path}.${index}`, scope);
		}
	}

	private checkRecordAssignable(
		expression: Extract<PointCoreExpression, { kind: "record" }>,
		expected: PointCoreTypeExpression,
		path: string,
		scope: Scope,
	) {
		const declaration = this.typeDeclarations.get(String(expected.name));
		if (!declaration) {
			this.push("type-mismatch", `Expected ${formatType(expected)}, got record`, path, expression.span, {
				expected: formatType(expected),
				actual: "record",
				repair: "Assign record literals to a named type with declared fields.",
			});
			return;
		}
		const provided = new Map(expression.fields.map((field) => [field.name, field]));
		for (const field of declaration.fields) {
			const value = provided.get(field.name);
			if (!value) {
				this.push("missing-field", `Missing field ${field.name}`, `${path}.${field.name}`, expression.span, {
					expected: declaration.fields.map((candidate) => candidate.name),
					actual: [...provided.keys()].join(", "),
					repair: `Add field ${field.name}: ${formatType(field.type)} to this record literal.`,
					relatedRefs: this.fieldRefsFor(declaration),
				});
				continue;
			}
			this.checkExpressionAssignable(value.value, field.type, `${path}.${field.name}`, scope);
			provided.delete(field.name);
		}
		for (const extra of provided.values()) {
			this.push("unknown-field", `Unknown field ${extra.name}`, `${path}.${extra.name}`, extra.span, {
				expected: declaration.fields.map((field) => field.name),
				actual: extra.name,
				repair: `Use one of: ${declaration.fields.map((field) => field.name).join(", ")}.`,
				relatedRefs: this.fieldRefsFor(declaration),
			});
		}
	}

	private typeOfExpression(
		expression: PointCoreExpression,
		scope: Scope,
		path: string,
		awaitedCall = false,
	): PointCoreTypeExpression | null {
		if (expression.kind === "literal") {
			if (expression.value === null) return { kind: "typeRef", name: "Void", args: [], span: expression.span };
			const valueType =
				typeof expression.value === "string"
					? "Text"
					: typeof expression.value === "boolean"
						? "Bool"
						: Number.isInteger(expression.value)
							? "Int"
							: "Float";
			return { kind: "typeRef", name: valueType, args: [], span: expression.span };
		}
		if (expression.kind === "list") return this.typeOfListExpression(expression, scope, path);
		if (expression.kind === "record") {
			this.push("record-type-required", "Record literals require an expected named type", path, expression.span);
			return null;
		}
		if (expression.kind === "identifier") {
			const entry = scope.get(expression.name);
			if (!entry) {
				this.push("unknown-identifier", `Unknown identifier ${expression.name}`, path, expression.span, {
					actual: expression.name,
					repair: `Declare ${expression.name}, pass it as a parameter, or replace it with an in-scope symbol.`,
				});
				return null;
			}
			return entry.type;
		}
		if (expression.kind === "binary") {
			return this.typeOfBinaryExpression(expression, scope, path);
		}
		if (expression.kind === "property") {
			return this.typeOfPropertyExpression(expression, scope, path);
		}
		if (expression.kind === "await") {
			return this.typeOfExpression(expression.value, scope, path, true);
		}
		if (expression.callee === "Error") {
			if (expression.args.length !== 1) {
				this.push("arity-mismatch", "Error expects 1 message argument", path, expression.span, {
					expected: "1 arg",
					actual: `${expression.args.length} args`,
					repair: "Construct errors as Error(\"message\").",
				});
			}
			const message = expression.args[0];
			if (message) this.checkExpressionAssignable(message, typeRef("Text"), `${path}.message`, scope);
			return typeRef("Error", [], expression.span);
		}
		if (expression.callee === "Ok") {
			return expression.args[0] ? this.typeOfExpression(expression.args[0], scope, `${path}.value`) : typeRef("Void", [], expression.span);
		}
		const target = this.functions.get(expression.callee);
		if (!target) {
			this.push("unknown-function", `Unknown function ${expression.callee}`, path, expression.span, {
				actual: expression.callee,
				expected: [...this.functions.keys()],
				repair: `Define fn ${expression.callee}(...) or call an existing function.`,
			});
			return null;
		}
		if ((target.semantic?.kind === "action" || target.semantic?.kind === "workflow") && !awaitedCall) {
			this.push("missing-await", `Action ${expression.callee} must be awaited`, path, expression.span, {
				expected: `await ${expression.callee}(...)`,
				actual: `${expression.callee}(...)`,
				repair: "Prefix this action call with await.",
				relatedRefs: [this.refFor(`fn.${target.name}`)],
			});
		}
		if (target.params.length !== expression.args.length) {
			this.push("arity-mismatch", `Function ${expression.callee} expects ${target.params.length} args`, path, expression.span, {
				expected: `${target.params.length} args`,
				actual: `${expression.args.length} args`,
				repair: `Call ${expression.callee} with ${target.params.length} argument(s).`,
				relatedRefs: [this.refFor(`fn.${target.name}`)],
			});
		}
		for (const [index, arg] of expression.args.entries()) {
			const param = target.params[index];
			if (param) this.checkExpressionAssignable(arg, param.type, `${path}.arg${index}`, scope);
		}
		return target.returnType;
	}

	private typeOfListExpression(
		expression: Extract<PointCoreExpression, { kind: "list" }>,
		scope: Scope,
		path: string,
	): PointCoreTypeExpression | null {
		if (expression.items.length === 0) {
			this.push("list-type-required", "Empty lists require an expected List type", path, expression.span);
			return null;
		}
		const first = this.typeOfExpression(expression.items[0]!, scope, `${path}.0`);
		if (!first) return null;
		for (const [index, item] of expression.items.slice(1).entries()) {
			const actual = this.typeOfExpression(item, scope, `${path}.${index + 1}`);
			if (actual && !sameType(actual, first)) {
				this.push("type-mismatch", `Expected ${formatType(first)}, got ${formatType(actual)}`, `${path}.${index + 1}`, item.span);
			}
		}
		return { kind: "typeRef", name: "List", args: [first], span: expression.span };
	}

	private typeOfPropertyExpression(
		expression: Extract<PointCoreExpression, { kind: "property" }>,
		scope: Scope,
		path: string,
	): PointCoreTypeExpression | null {
		const targetType = this.typeOfExpression(expression.target, scope, `${path}.target`);
		if (!targetType) return null;
		if (targetType.name === "Maybe" && targetType.args.length === 1) {
			this.push("nullable-field-access", `Cannot access field ${expression.name} on nullable ${formatType(targetType)}`, path, expression.span, {
				expected: formatType(targetType.args[0]!),
				actual: formatType(targetType),
				repair: "Check that this Maybe value is present before accessing its fields.",
			});
			return null;
		}
		const declaration = this.typeDeclarations.get(String(targetType.name));
		if (!declaration) {
			this.push("not-a-record", `${formatType(targetType)} has no fields`, path, expression.span, {
				actual: formatType(targetType),
				repair: "Only access fields on named record types.",
			});
			return null;
		}
		const field = declaration.fields.find((candidate) => candidate.name === expression.name);
		if (!field) {
			this.push("unknown-field", `Unknown field ${expression.name} on ${targetType.name}`, path, expression.span, {
				expected: declaration.fields.map((candidate) => candidate.name),
				actual: expression.name,
				repair: `Use one of: ${declaration.fields.map((candidate) => candidate.name).join(", ")}.`,
				relatedRefs: this.fieldRefsFor(declaration),
			});
			return null;
		}
		return field.type;
	}

	private typeOfBinaryExpression(
		expression: Extract<PointCoreExpression, { kind: "binary" }>,
		scope: Scope,
		path: string,
	): PointCoreTypeExpression | null {
		const left = this.typeOfExpression(expression.left, scope, `${path}.left`);
		const right = this.typeOfExpression(expression.right, scope, `${path}.right`);
		if (!left || !right) return null;
		if (expression.operator === "and" || expression.operator === "or") {
			if (left.name !== "Bool" || right.name !== "Bool") {
				this.push("operator-type-mismatch", `${expression.operator} requires Bool operands`, path, expression.span, {
					expected: "Bool operands",
					actual: `${formatType(left)} and ${formatType(right)}`,
					repair: `Use Bool expressions on both sides of ${expression.operator}.`,
				});
			}
			return { kind: "typeRef", name: "Bool", args: [], span: expression.span };
		}
		if (expression.operator === "==" || expression.operator === "!=") {
			if (left.name !== right.name) {
				this.push("operator-type-mismatch", `${expression.operator} requires matching operand types`, path, expression.span, {
					expected: formatType(left),
					actual: formatType(right),
					repair: "Compare values with the same Point type.",
				});
			}
			return { kind: "typeRef", name: "Bool", args: [], span: expression.span };
		}
		if (expression.operator === "+" && left.name === "Text" && right.name === "Text") {
			return { kind: "typeRef", name: "Text", args: [], span: expression.span };
		}
		if (!isNumeric(left.name) || !isNumeric(right.name)) {
			this.push("operator-type-mismatch", `${expression.operator} requires numeric operands`, path, expression.span, {
				expected: "Int or Float operands",
				actual: `${formatType(left)} and ${formatType(right)}`,
				repair: `Use numeric expressions on both sides of ${expression.operator}.`,
			});
			return null;
		}
		if (["<", "<=", ">", ">="].includes(expression.operator)) {
			return { kind: "typeRef", name: "Bool", args: [], span: expression.span };
		}
		return { kind: "typeRef", name: left.name === "Float" || right.name === "Float" ? "Float" : "Int", args: [], span: expression.span };
	}

	private checkType(type: PointCoreTypeExpression, path: string) {
		if (!this.types.has(type.name)) {
			this.push("unknown-type", `Unknown type ${type.name}`, path, type.span, {
				expected: [...this.types].sort(),
				actual: String(type.name),
				repair: `Declare type ${type.name} or use an existing type.`,
			});
		}
		if (type.name === "List" && type.args.length !== 1) {
			this.push("invalid-type-arity", "List requires one type argument", path, type.span, {
				expected: "List<T>",
				actual: formatType(type),
				repair: "Use List<Text>, List<Int>, or another concrete item type.",
			});
		}
		if (type.name === "Maybe" && type.args.length !== 1) {
			this.push("invalid-type-arity", "Maybe requires one type argument", path, type.span, {
				expected: "Maybe<T>",
				actual: formatType(type),
				repair: "Use Maybe<Text>, Maybe<User>, or another concrete optional type.",
			});
		}
		if (type.name === "Or" && type.args.length < 2) {
			this.push("invalid-type-arity", "Or requires at least two type arguments", path, type.span, {
				expected: "A or B",
				actual: formatType(type),
				repair: "Use syntax such as User or Error.",
			});
		}
		if (type.name === "Handler" && type.args.length !== 1) {
			this.push("invalid-type-arity", "Handler requires one type argument", path, type.span, {
				expected: "Handler T",
				actual: formatType(type),
				repair: "Use Handler Listing Signals or another record type.",
			});
		}
		if (type.name !== "List" && type.name !== "Maybe" && type.name !== "Or" && type.name !== "Handler" && type.args.length > 0 && !this.typeDeclarations.has(String(type.name))) {
			this.push("invalid-type-arity", `${type.name} does not accept type arguments`, path, type.span, {
				expected: String(type.name),
				actual: formatType(type),
				repair: `Remove type arguments from ${type.name}.`,
			});
		}
		for (const arg of type.args) this.checkType(arg, `${path}.arg`);
	}

	private push(
		code: string,
		message: string,
		path: string,
		span: PointSourceSpan | undefined,
		metadata: DiagnosticMetadata = {},
	) {
		this.diagnostics.push({
			code,
			message,
			path,
			ref: this.refFor(path),
			severity: "error",
			span: span ?? null,
			...metadata,
		});
	}

	private refFor(path: string): string {
		return `point://core/${this.program.module ?? "anonymous"}/${path}`;
	}

	private fieldRefsFor(declaration: PointCoreTypeDeclaration): string[] {
		return declaration.fields.map((field) => this.refFor(`type.${declaration.name}.${field.name}`));
	}
}

function isNumeric(type: string): boolean {
	return type === "Int" || type === "Float";
}

function sameType(left: PointCoreTypeExpression, right: PointCoreTypeExpression): boolean {
	const leftArgs = left.args ?? [];
	const rightArgs = right.args ?? [];
	return left.name === right.name && leftArgs.length === rightArgs.length && leftArgs.every((arg, index) => sameType(arg, rightArgs[index]!));
}

function formatType(type: PointCoreTypeExpression): string {
	const args = type.args ?? [];
	if (args.length === 0) return String(type.name);
	if (type.name === "Or") return args.map(formatType).join(" or ");
	return `${type.name}<${args.map(formatType).join(", ")}>`;
}

function typeRef(name: string, args: PointCoreTypeExpression[] = [], span?: PointSourceSpan): PointCoreTypeExpression {
	return { kind: "typeRef", name, args, span };
}
