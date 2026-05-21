import type { PointSourceSpan } from "../core/ast.ts";

export interface PointSemanticProgram {
	kind: "semanticProgram";
	module?: string;
	uses: PointSemanticUseDeclaration[];
	declarations: PointSemanticDeclaration[];
	span?: PointSourceSpan;
}

export interface PointSemanticUseDeclaration {
	kind: "use";
	moduleName: string;
	from?: string;
	span?: PointSourceSpan;
}

export type PointSemanticDeclaration =
	| PointSemanticRecordDeclaration
	| PointSemanticCalculationDeclaration
	| PointSemanticRuleDeclaration
	| PointSemanticLabelDeclaration
	| PointSemanticExternalDeclaration
	| PointSemanticActionDeclaration
	| PointSemanticPolicyDeclaration
	| PointSemanticViewDeclaration
	| PointSemanticPageDeclaration
	| PointSemanticRouteDeclaration
	| PointSemanticWorkflowDeclaration
	| PointSemanticCommandDeclaration;

export interface PointSemanticRecordDeclaration {
	kind: "record";
	name: string;
	fields: PointSemanticField[];
	span?: PointSourceSpan;
}

export interface PointSemanticField {
	label: string;
	type: PointSemanticTypeExpression;
	span?: PointSourceSpan;
}

export interface PointSemanticBinding {
	label: string;
	type: PointSemanticTypeExpression;
	span?: PointSourceSpan;
}

export interface PointSemanticOutputBinding {
	name: string;
	type: PointSemanticTypeExpression;
	span?: PointSourceSpan;
}

export interface PointSemanticCalculationDeclaration {
	kind: "calculation";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticCalculationStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticRuleDeclaration {
	kind: "rule";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticRuleStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticLabelDeclaration {
	kind: "label";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticLabelStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticExternalDeclaration {
	kind: "external";
	name: string;
	functions: PointSemanticExternalFunction[];
	span?: PointSourceSpan;
}

export interface PointSemanticExternalFunction {
	label: string;
	params: PointSemanticBinding[];
	returnType: PointSemanticTypeExpression;
	from: string;
	importAs?: string;
	span?: PointSourceSpan;
}

export interface PointSemanticActionDeclaration {
	kind: "action";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	touches: string[];
	body: PointSemanticActionStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticPolicyDeclaration {
	kind: "policy";
	name: string;
	inputs: PointSemanticBinding[];
	body: PointSemanticPolicyStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticViewDeclaration {
	kind: "view";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticViewStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticPageDeclaration {
	kind: "page";
	name: string;
	inputs: PointSemanticBinding[];
	title: PointSemanticExpression;
	description?: PointSemanticExpression;
	main: PointSemanticExpression;
	span?: PointSourceSpan;
}

export interface PointSemanticRouteDeclaration {
	kind: "route";
	name: string;
	method: string;
	path: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticRouteStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticWorkflowDeclaration {
	kind: "workflow";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticWorkflowStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticCommandDeclaration {
	kind: "command";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticCommandStatement[];
	span?: PointSourceSpan;
}

export type PointSemanticCalculationStatement =
	| { kind: "assignIs"; name: string; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "startsAt"; name: string; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "startsAs"; name: string; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "forEach"; item: string; iterable: PointSemanticExpression; body: PointSemanticMutationStatement[]; span?: PointSourceSpan }
	| PointSemanticMutationStatement
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticRuleStatement =
	| { kind: "startsAt"; name: string; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "addWhen"; amount: PointSemanticExpression; condition: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "forEach"; item: string; iterable: PointSemanticExpression; body: PointSemanticMutationStatement[]; span?: PointSourceSpan }
	| PointSemanticMutationStatement
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticLabelStatement =
	| { kind: "whenReturn"; condition: PointSemanticExpression; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "otherwiseReturn"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticActionStatement =
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "expression"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticPolicyStatement =
	| { kind: "allow"; condition: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "deny"; condition: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "require"; condition: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticViewStatement =
	| { kind: "render"; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "whenRender"; condition: PointSemanticExpression; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticRouteStatement = { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticWorkflowStatement =
	| { kind: "step"; name: string; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticCommandStatement = { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticMutationStatement =
	| { kind: "addTo"; amount: PointSemanticExpression; target: string; span?: PointSourceSpan }
	| { kind: "subtractFrom"; amount: PointSemanticExpression; target: string; span?: PointSourceSpan }
	| { kind: "setTo"; target: string; value: PointSemanticExpression; span?: PointSourceSpan };

export interface PointSemanticTypeExpression {
	kind: "typeRef";
	name: string;
	args: PointSemanticTypeExpression[];
	span?: PointSourceSpan;
}

export type PointSemanticExpression =
	| { kind: "literal"; value: string | number | boolean | null; span?: PointSourceSpan }
	| { kind: "name"; label: string; span?: PointSourceSpan }
	| { kind: "property"; target: PointSemanticExpression; label: string; span?: PointSourceSpan }
	| { kind: "list"; items: PointSemanticExpression[]; span?: PointSourceSpan }
	| { kind: "record"; fields: PointSemanticRecordLiteralField[]; span?: PointSourceSpan }
	| { kind: "call"; callee: string; args: PointSemanticExpression[]; span?: PointSourceSpan }
	| { kind: "await"; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "error"; message: string; span?: PointSourceSpan }
	| {
			kind: "binary";
			operator: PointSemanticBinaryOperator;
			left: PointSemanticExpression;
			right: PointSemanticExpression;
			span?: PointSourceSpan;
	  };

export interface PointSemanticRecordLiteralField {
	label: string;
	value: PointSemanticExpression;
	span?: PointSourceSpan;
}

export type PointSemanticBinaryOperator = "+" | "-" | "*" | "/" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "and" | "or";
