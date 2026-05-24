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
import { checkSemanticRoutes } from "../semantic/check-routes.ts";
import { checkSemanticLayouts } from "../semantic/check-layouts.ts";
import { checkSemanticNavigation } from "../semantic/check-navigation.ts";
import { checkSemanticViews } from "../semantic/check-views.ts";
import { checkSemanticDataLoad } from "../semantic/check-data-load.ts";
import { checkSemanticStreamSubscribe } from "../semantic/check-stream-subscribe.ts";
import { checkSemanticSchedules } from "../semantic/check-schedules.ts";
import { checkSemanticPrompts } from "../semantic/check-prompts.ts";
import { checkSemanticWorkflows } from "../semantic/check-workflows.ts";
import { checkSemanticPipelines } from "../semantic/check-pipelines.ts";
import { checkSemanticMoneyLint } from "../semantic/check-money-lint.ts";
import { checkSemanticSessions } from "../semantic/check-sessions.ts";
import { checkSemanticGuards } from "../semantic/check-guards.ts";
import { checkSemanticThemes } from "../semantic/check-themes.ts";
import { resolveFieldAlias, suggestFieldLabel } from "../semantic/field-alias.ts";
import { checkSemanticVariants } from "../semantic/check-variants.ts";
import {
	desugarContextForCalculation,
	desugarSemanticExpressionForCheck,
	loweringMapsFor,
} from "../semantic/desugar.ts";
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
type ScopeEntry = { type: PointCoreTypeExpression; mutable: boolean; variantCase?: string };
type Scope = Map<string, ScopeEntry>;
const scopeMaybeNarrowings = new WeakMap<Scope, Set<string>>();

const PRIMITIVE_TYPES = new Set(["Text", "Int", "Float", "Bool", "Void", "List", "Map", "Maybe", "Instant", "Duration", "Error", "Or", "Page", "Handler"]);

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
	private readonly semanticCallables: string[];

	constructor(private readonly program: PointCoreProgram) {
		this.semanticCallables = program.semanticCallables ?? [];
	}

	check(): PointCoreDiagnostic[] {
		this.collectDeclarations();
		for (const declaration of this.program.declarations) this.checkDeclaration(declaration);
		if (this.program.semanticSource) {
			this.diagnostics.push(...checkSemanticRoutes(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticLayouts(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticNavigation(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticViews(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticDataLoad(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticSchedules(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticPrompts(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticWorkflows(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticPipelines(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticMoneyLint(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticSessions(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticGuards(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticThemes(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticStreamSubscribe(this.program.semanticSource));
			this.diagnostics.push(...checkSemanticVariants(this.program.semanticSource));
			this.checkCalculationOnFailureSemantics();
		}
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
			if (declaration.variantCases) {
				for (const variantCase of declaration.variantCases) {
					for (const field of variantCase.fields) {
						this.checkType(field.type, `type.${declaration.name}.${variantCase.name}.${field.name}`);
					}
				}
				return;
			}
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
		const locals = cloneScope(this.globals);
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
			if (fn.semantic?.kind === "page" || fn.semantic?.kind === "view" || fn.semantic?.kind === "layout" || fn.semantic?.kind === "route") return;
			if (fn.semantic?.kind === "calculation" && this.program.semanticSource) {
				const calculationName = fn.semantic.name;
				const calcDecl = this.program.semanticSource.declarations.find(
					(d) => d.kind === "calculation" && d.name === calculationName,
				);
				if (calcDecl?.kind === "calculation" && calcDecl.onFailure !== undefined) {
					const lastStmt = fn.body.at(-1);
					if (lastStmt?.kind === "return" && lastStmt === statement) return;
				}
			}
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
			const thenLocals = narrowScopeForCondition(statement.condition, locals, "then");
			for (const child of statement.thenBody) this.checkStatement(child, fn, thenLocals);
			const elseLocals = narrowScopeForCondition(statement.condition, locals, "else");
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
		const loopLocals = cloneScope(locals);
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
		if (
			expression.kind === "call" &&
			(expression.callee === "pointJsonResponse" ||
				expression.callee === "pointWorkflowTimedStep" ||
				expression.callee === "pointPipelineNow" ||
				expression.callee === "pointPipelineShouldLog" ||
				expression.callee === "pointPipelineEmitLog")
		) {
			return;
		}
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
		if (expression.kind === "call" && expression.callee === "pointMapLiteral") {
			this.checkMapLiteralAssignable(expression, expected, path, scope);
			return;
		}
		if (expression.kind === "record") {
			this.checkRecordAssignable(expression, expected, path, scope);
			return;
		}
		if (expression.kind === "variant") {
			this.checkVariantAssignable(expression, expected, path, scope);
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

	private checkMapLiteralAssignable(
		expression: Extract<PointCoreExpression, { kind: "call" }>,
		expected: PointCoreTypeExpression,
		path: string,
		scope: Scope,
	) {
		if (expected.name !== "Map" || expected.args.length !== 2) {
			this.push("type-mismatch", `Expected ${formatType(expected)}, got map literal`, path, expression.span, {
				expected: formatType(expected),
				actual: "map",
				repair: `Annotate output as Map<Text, T> or assign to a Map<Text, T> binding.`,
			});
			return;
		}
		if (expected.args[0]?.name !== "Text") {
			this.push("invalid-map-key-type", "Map keys must be Text", path, expression.span, {
				expected: "Map<Text, T>",
				actual: formatType(expected),
				repair: "Use Map<Text, T> for string-keyed maps.",
			});
		}
		const valueType = expected.args[1];
		if (!valueType) return;
		for (let index = 0; index < expression.args.length; index += 2) {
			const keyArg = expression.args[index]!;
			const valueArg = expression.args[index + 1]!;
			if (keyArg.kind !== "literal" || typeof keyArg.value !== "string") {
				this.push("invalid-map-literal", "map keys must be string literals", path, keyArg.span ?? expression.span, {
					repair: 'Quote map keys: map { "sku-a": 100 }.',
				});
			}
			if (valueArg) this.checkExpressionAssignable(valueArg, valueType, `${path}.value${index / 2}`, scope);
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

	private checkVariantAssignable(
		expression: Extract<PointCoreExpression, { kind: "variant" }>,
		expected: PointCoreTypeExpression,
		path: string,
		scope: Scope,
	) {
		const declaration = this.typeDeclarations.get(String(expected.name));
		if (!declaration?.variantCases) {
			this.push("type-mismatch", `Expected ${formatType(expected)}, got variant`, path, expression.span, {
				expected: formatType(expected),
				actual: expression.caseName,
				repair: "Construct a variant literal for a declared variant type.",
			});
			return;
		}
		const variantCase = declaration.variantCases.find((candidate) => candidate.name === expression.caseName);
		if (!variantCase) {
			this.push("unknown-variant-case", `Unknown case ${expression.caseName} on ${expected.name}`, path, expression.span, {
				expected: declaration.variantCases.map((candidate) => candidate.name),
				actual: expression.caseName,
				repair: `Use one of: ${declaration.variantCases.map((candidate) => candidate.name).join(", ")}.`,
			});
			return;
		}
		const provided = new Map(expression.fields.map((field) => [field.name, field]));
		for (const field of variantCase.fields) {
			const value = provided.get(field.name);
			if (!value) {
				this.push("missing-field", `Missing field ${field.name}`, `${path}.${field.name}`, expression.span, {
					expected: variantCase.fields.map((candidate) => candidate.name),
					actual: [...provided.keys()].join(", "),
					repair: `Add ${field.name}: ${formatType(field.type)} to this variant literal.`,
				});
				continue;
			}
			this.checkExpressionAssignable(value.value, field.type, `${path}.${field.name}`, scope);
			provided.delete(field.name);
		}
		for (const extra of provided.values()) {
			this.push("unknown-field", `Unknown field ${extra.name}`, `${path}.${extra.name}`, extra.span, {
				expected: this.fieldLabels(variantCase.fields),
				actual: extra.name,
				repair: `Use one of: ${this.fieldLabels(variantCase.fields).join(", ")}.`,
			});
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
				expected: this.fieldLabels(declaration.fields),
				actual: extra.name,
				repair: `Use one of: ${this.fieldLabels(declaration.fields).join(", ")}.`,
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
			if (entry.type.name === "Maybe" && entry.type.args.length === 1 && isMaybePathNarrowed(expression, scope)) {
				return entry.type.args[0]!;
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
		if (expression.callee === "pointJsonResponse") {
			return typeRef("Text", [], expression.span);
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
		if (expression.callee === "pointJsonResponse") {
			if (expression.args[0]) this.typeOfExpression(expression.args[0], scope, `${path}.body`);
			if (expression.args[1]) this.checkExpressionAssignable(expression.args[1], typeRef("Int"), `${path}.status`, scope);
			if (expression.args[2]) this.typeOfExpression(expression.args[2], scope, `${path}.headers`);
			return typeRef("Response", [], expression.span);
		}
		if (expression.callee === "pointIsError") {
			if (expression.args[0]) this.typeOfExpression(expression.args[0], scope, `${path}.value`);
			return typeRef("Bool", [], expression.span);
		}
		if (expression.callee === "pointGuardPathAllowed") {
			if (expression.args[0]) this.typeOfExpression(expression.args[0], scope, `${path}.path`);
			return typeRef("Bool", [], expression.span);
		}
		if (expression.callee === "pointWorkflowTimedStep") {
			const run = expression.args[0];
			if (expression.args[1]) this.checkExpressionAssignable(expression.args[1], typeRef("Int"), `${path}.timeout`, scope);
			return run ? this.typeOfExpression(run, scope, `${path}.run`, true) : typeRef("Void", [], expression.span);
		}
		if (expression.callee === "pointPipelineNow") return typeRef("Int", [], expression.span);
		if (expression.callee === "pointPipelineShouldLog") return typeRef("Bool", [], expression.span);
		if (expression.callee === "pointPipelineEmitLog") return typeRef("Void", [], expression.span);
		if (expression.callee === "pointMapLookup") {
			if (expression.args.length !== 2) {
				this.push("arity-mismatch", "lookup expects map and key arguments", path, expression.span, {
					expected: "2 args",
					actual: `${expression.args.length} args`,
					repair: "Use lookup catalog sku where catalog is Map<Text, T> and sku is Text.",
				});
				return null;
			}
			const mapType = this.typeOfExpression(expression.args[0]!, scope, `${path}.map`);
			const keyType = this.typeOfExpression(expression.args[1]!, scope, `${path}.key`);
			if (keyType && keyType.name !== "Text") {
				this.push("type-mismatch", "lookup key must be Text", path, expression.span, {
					expected: "Text",
					actual: formatType(keyType),
					repair: "Pass a Text key to lookup.",
				});
			}
			if (!mapType || mapType.name !== "Map" || mapType.args.length !== 2) {
				this.push("type-mismatch", "lookup requires Map<Text, T>", path, expression.span, {
					expected: "Map<Text, T>",
					actual: mapType ? formatType(mapType) : "unknown",
					repair: "Use a Map<Text, T> value as the first argument to lookup.",
				});
				return null;
			}
			if (mapType.args[0]?.name !== "Text") {
				this.push("invalid-map-key-type", "Map keys must be Text in Phase 23", path, expression.span, {
					expected: "Map<Text, T>",
					actual: formatType(mapType),
					repair: "Use Map<Text, T> — non-Text keys are not supported yet.",
				});
			}
			return mapType.args[1] ?? null;
		}
		if (expression.callee === "pointMapLiteral") {
			if (expression.args.length === 0 || expression.args.length % 2 !== 0) {
				this.push("invalid-map-literal", "map literals require key/value pairs", path, expression.span, {
					repair: 'Use map { "key": value, "other": value } syntax.',
				});
				return null;
			}
			let valueType: PointCoreTypeExpression | null = null;
			for (let index = 0; index < expression.args.length; index += 2) {
				const keyArg = expression.args[index]!;
				const valueArg = expression.args[index + 1]!;
				if (keyArg.kind !== "literal" || typeof keyArg.value !== "string") {
					this.push("invalid-map-literal", "map keys must be string literals", path, keyArg.span ?? expression.span, {
						repair: 'Quote map keys: map { "sku-a": 100 }.',
					});
				}
				const entryType = this.typeOfExpression(valueArg, scope, `${path}.value${index / 2}`);
				if (!entryType) continue;
				if (!valueType) valueType = entryType;
				else if (!sameType(valueType, entryType)) {
					this.push("type-mismatch", "map values must share the same type", path, valueArg.span ?? expression.span, {
						expected: formatType(valueType),
						actual: formatType(entryType),
						repair: "Use the same value type for every map entry.",
					});
				}
			}
			return valueType ? typeRef("Map", [typeRef("Text"), valueType], expression.span) : null;
		}
		const handler = scope.get(expression.callee);
		if (handler?.type.name === "Handler") {
			if (expression.args[0]) this.typeOfExpression(expression.args[0], scope, `${path}.arg0`);
			return typeRef("Void", [], expression.span);
		}
		if (handler?.type.name === "Maybe" && handler.type.args[0]?.name === "Handler") {
			if (expression.args[0]) this.typeOfExpression(expression.args[0], scope, `${path}.arg0`);
			return typeRef("Void", [], expression.span);
		}
		const target = this.functions.get(expression.callee);
		if (!target) {
			const expected =
				this.semanticCallables.length > 0 ? this.semanticCallables : [...this.functions.keys()].sort();
			this.push("unknown-function", `Unknown function ${expression.callee}`, path, expression.span, {
				actual: expression.callee,
				expected,
				repair: `Define fn ${expression.callee}(...) or call an existing function.`,
			});
			return null;
		}
		if ((target.semantic?.kind === "action" || target.semantic?.kind === "workflow" || target.semantic?.kind === "pipeline") && !awaitedCall) {
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
		let targetType = this.typeOfExpression(expression.target, scope, `${path}.target`);
		if (!targetType) return null;
		if (targetType.name === "Maybe" && targetType.args.length === 1) {
			if (isMaybePathNarrowed(expression.target, scope)) {
				targetType = targetType.args[0]!;
			} else {
				this.push("nullable-field-access", `Cannot access field ${expression.name} on nullable ${formatType(targetType)}`, path, expression.span, {
					expected: formatType(targetType.args[0]!),
					actual: formatType(targetType),
					repair: "Check that this Maybe value is present before accessing its fields.",
				});
				return null;
			}
		}
		const declaration = this.typeDeclarations.get(String(targetType.name));
		if (!declaration) {
			this.push("not-a-record", `${formatType(targetType)} has no fields`, path, expression.span, {
				actual: formatType(targetType),
				repair: "Only access fields on named record types.",
			});
			return null;
		}
		if (declaration.variantCases) {
			const scopeEntry = this.findScopeEntry(expression.target, scope);
			if (expression.name === "kind") {
				return { kind: "typeRef", name: "Text", args: [], span: expression.span };
			}
			if (!scopeEntry?.variantCase) {
				this.push("variant-field-access", `Cannot access field ${expression.name} on ${formatType(targetType)} without narrowing`, path, expression.span, {
					expected: `${targetType.name}.kind === "<Case>"`,
					actual: formatType(targetType),
					repair: "Dispatch on the variant with on Case return ... or compare .kind before reading payload fields.",
				});
				return null;
			}
			const variantCase = declaration.variantCases.find((candidate) => candidate.name === scopeEntry.variantCase);
			const field = variantCase?.fields.find((candidate) => candidate.name === expression.name);
			const aliasResolution = resolveFieldAlias(variantCase?.fields ?? [], expression.name);
			if (!field && aliasResolution.kind === "unique") {
				return variantCase?.fields.find((candidate) => candidate.name === aliasResolution.fieldName)?.type ?? null;
			}
			if (!field) {
				if (aliasResolution.kind === "ambiguous") {
					this.push(
						"unknown-field",
						`Unknown field ${expression.name} on ${targetType.name}.${scopeEntry.variantCase}`,
						path,
						expression.span,
						{
							expected: aliasResolution.labels,
							actual: expression.name,
							repair: `Field alias ${expression.name} is ambiguous. Choose one of: ${aliasResolution.labels.join(", ")}.`,
						},
					);
					return null;
				}
				this.push("unknown-field", `Unknown field ${expression.name} on ${targetType.name}.${scopeEntry.variantCase}`, path, expression.span, {
					expected: this.fieldLabels(variantCase?.fields ?? []),
					actual: expression.name,
					repair: this.unknownFieldRepair(variantCase?.fields ?? [], expression.name),
				});
				return null;
			}
			return field.type;
		}
		const field = declaration.fields.find((candidate) => candidate.name === expression.name);
		const aliasResolution = resolveFieldAlias(declaration.fields, expression.name);
		if (!field && aliasResolution.kind === "unique") {
			return declaration.fields.find((candidate) => candidate.name === aliasResolution.fieldName)?.type ?? null;
		}
		if (!field) {
			if (aliasResolution.kind === "ambiguous") {
				this.push("unknown-field", `Unknown field ${expression.name} on ${targetType.name}`, path, expression.span, {
					expected: aliasResolution.labels,
					actual: expression.name,
					repair: `Field alias ${expression.name} is ambiguous. Choose one of: ${aliasResolution.labels.join(", ")}.`,
					relatedRefs: this.fieldRefsFor(declaration),
				});
				return null;
			}
			this.push("unknown-field", `Unknown field ${expression.name} on ${targetType.name}`, path, expression.span, {
				expected: this.fieldLabels(declaration.fields),
				actual: expression.name,
				repair: this.unknownFieldRepair(declaration.fields, expression.name),
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
			const comparesMaybeAndNone =
				(left.name === "Maybe" && right.name === "Void") || (left.name === "Void" && right.name === "Maybe");
			if (comparesMaybeAndNone) {
				return { kind: "typeRef", name: "Bool", args: [], span: expression.span };
			}
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
		if (type.name === "Map" && type.args.length !== 2) {
			this.push("invalid-type-arity", "Map requires two type arguments", path, type.span, {
				expected: "Map<Text, T>",
				actual: formatType(type),
				repair: "Use Map<Text, Int> or another Map<Text, T> type.",
			});
		}
		if (type.name === "Map" && type.args[0]?.name !== "Text") {
			this.push("invalid-map-key-type", "Map keys must be Text", path, type.span, {
				expected: "Map<Text, T>",
				actual: formatType(type),
				repair: "Phase 23 supports Map<Text, T> only.",
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
		if (type.name === "Instant" && type.args.length !== 0) {
			this.push("invalid-type-arity", "Instant is opaque and takes no type arguments", path, type.span, {
				expected: "Instant",
				actual: formatType(type),
				repair: "Use Instant — not Instant<T>.",
			});
		}
		if (type.name === "Duration" && type.args.length !== 0) {
			this.push("invalid-type-arity", "Duration is opaque and takes no type arguments", path, type.span, {
				expected: "Duration",
				actual: formatType(type),
				repair: "Use Duration — not Duration<T>.",
			});
		}
		if (type.name !== "List" && type.name !== "Maybe" && type.name !== "Or" && type.name !== "Handler" && type.name !== "Map" && type.args.length > 0 && !this.typeDeclarations.has(String(type.name))) {
			this.push("invalid-type-arity", `${type.name} does not accept type arguments`, path, type.span, {
				expected: String(type.name),
				actual: formatType(type),
				repair: `Remove type arguments from ${type.name}.`,
			});
		}
		for (const arg of type.args) this.checkType(arg, `${path}.arg`);
	}

	private checkCalculationOnFailureSemantics(): void {
		const sem = this.program.semanticSource;
		if (!sem) return;
		const { records, callables } = loweringMapsFor(sem);
		const moduleNameForRef = sem.module ?? "anonymous";
		for (const decl of sem.declarations) {
			if (decl.kind !== "calculation" || decl.onFailure === undefined) continue;
			const coreFn = this.program.declarations.find(
				(d): d is PointCoreFunctionDeclaration =>
					d.kind === "function" && d.semantic?.kind === "calculation" && d.semantic.name === decl.name,
			);
			if (!coreFn) continue;
			const ctx = desugarContextForCalculation(decl, records, callables);
			const coreExpr = desugarSemanticExpressionForCheck(decl.onFailure, ctx);
			const locals = cloneScope(this.globals);
			for (const param of coreFn.params) {
				locals.set(param.name, { type: param.type, mutable: false });
			}
			const probePath = `_calculation_on_failure_probe_.${decl.name}`;
			const diagStart = this.diagnostics.length;
			this.checkExpressionAssignable(coreExpr, coreFn.returnType, probePath, locals);
			const probeBatch = this.diagnostics.splice(diagStart);
			const semanticPath = `calculation.${decl.name}.onFailure`;
			const semanticOwnerRef = `point://semantic/${moduleNameForRef}/calculation.${decl.name}`;
			for (const d of probeBatch) {
				if (d.code === "type-mismatch" && d.path === probePath) {
					this.diagnostics.push({
						code: "calculation-on-failure-type-mismatch",
						message: `on failure return is not assignable to calculation output (${formatType(coreFn.returnType)})`,
						path: semanticPath,
						ref: semanticOwnerRef,
						severity: "error",
						span: decl.onFailure.span ?? decl.span ?? null,
						expected: d.expected,
						actual: d.actual,
						repair: `Provide a value assignable to ${formatType(coreFn.returnType)} for on failure return.`,
					});
					continue;
				}
				this.diagnostics.push(d);
			}
		}
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

	private fieldLabel(field: { name: string; semanticName?: string }): string {
		return field.semanticName ?? field.name;
	}

	private fieldLabels(fields: Array<{ name: string; semanticName?: string }>): string[] {
		return fields.map((field) => this.fieldLabel(field));
	}

	private unknownFieldRepair(fields: Array<{ name: string; semanticName?: string }>, accessName: string): string {
		const labels = this.fieldLabels(fields);
		const baseRepair = `Use one of: ${labels.join(", ")}.`;
		const suggestion = suggestFieldLabel(fields, accessName);
		if (!suggestion) return baseRepair;
		return `${baseRepair} Did you mean "${suggestion}"?`;
	}

	private refFor(path: string): string {
		return `point://core/${this.program.module ?? "anonymous"}/${path}`;
	}

	private fieldRefsFor(declaration: PointCoreTypeDeclaration): string[] {
		return declaration.fields.map((field) => this.refFor(`type.${declaration.name}.${field.name}`));
	}

	private findScopeEntry(expression: PointCoreExpression, scope: Scope): ScopeEntry | undefined {
		if (expression.kind === "identifier") return scope.get(expression.name);
		if (expression.kind === "property") return this.findScopeEntry(expression.target, scope);
		return undefined;
	}
}

function narrowScopeForCondition(condition: PointCoreExpression, locals: Scope, branch: "then" | "else"): Scope {
	const narrowed = cloneScope(locals);
	const match = extractVariantNarrowing(condition);
	if (branch === "then" && match) applyVariantNarrowing(narrowed, match);
	const maybe = extractMaybePresenceNarrowing(condition);
	if (maybe) {
		const appliesToBranch = (maybe.kind === "present" && branch === "then") || (maybe.kind === "none" && branch === "else");
		if (appliesToBranch) addMaybeNarrowing(narrowed, maybe.key);
	}
	return narrowed;
}

function extractVariantNarrowing(condition: PointCoreExpression): { identifier: string; caseName: string } | null {
	if (condition.kind !== "binary" || condition.operator !== "==") return null;
	const left = condition.left;
	const right = condition.right;
	if (left.kind !== "property" || left.name !== "kind" || left.target.kind !== "identifier") return null;
	if (right.kind !== "literal" || typeof right.value !== "string") return null;
	return { identifier: left.target.name, caseName: right.value };
}

function applyVariantNarrowing(locals: Scope, match: { identifier: string; caseName: string }): void {
	const entry = locals.get(match.identifier);
	if (!entry) return;
	locals.set(match.identifier, { ...entry, variantCase: match.caseName });
}

function cloneScope(locals: Scope): Scope {
	const cloned = new Map(locals);
	scopeMaybeNarrowings.set(cloned, new Set(getMaybeNarrowings(locals)));
	return cloned;
}

function getMaybeNarrowings(scope: Scope): Set<string> {
	const existing = scopeMaybeNarrowings.get(scope);
	if (existing) return existing;
	const created = new Set<string>();
	scopeMaybeNarrowings.set(scope, created);
	return created;
}

function addMaybeNarrowing(scope: Scope, key: string): void {
	getMaybeNarrowings(scope).add(key);
}

function isMaybePathNarrowed(expression: PointCoreExpression, scope: Scope): boolean {
	const key = maybeExpressionKey(expression);
	if (!key) return false;
	return getMaybeNarrowings(scope).has(key);
}

function maybeExpressionKey(expression: PointCoreExpression): string | null {
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind !== "property") return null;
	const target = maybeExpressionKey(expression.target);
	if (!target) return null;
	return `${target}.${expression.name}`;
}

function extractMaybePresenceNarrowing(condition: PointCoreExpression): { key: string; kind: "present" | "none" } | null {
	if (condition.kind !== "binary") return null;
	const leftNull = isNullLiteral(condition.left);
	const rightNull = isNullLiteral(condition.right);
	if (!leftNull && !rightNull) return null;
	const candidate = leftNull ? condition.right : condition.left;
	const key = maybeExpressionKey(candidate);
	if (!key) return null;
	if (condition.operator === "!=") return { key, kind: "present" };
	if (condition.operator === "==") return { key, kind: "none" };
	return null;
}

function isNullLiteral(expression: PointCoreExpression): boolean {
	return expression.kind === "literal" && expression.value === null;
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
