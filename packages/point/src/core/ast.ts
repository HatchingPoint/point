import type { PointSemanticProgram } from "../semantic/ast.ts";

export type PointCorePrimitiveType = "Text" | "Int" | "Float" | "Bool" | "Void";

export interface PointSourcePosition {
	line: number;
	column: number;
	offset: number;
}

export interface PointSourceSpan {
	start: PointSourcePosition;
	end: PointSourcePosition;
}

export interface PointCoreProgram {
	kind: "coreProgram";
	module?: string;
	declarations: PointCoreDeclaration[];
	span?: PointSourceSpan;
	semantic?: PointSemanticProgramMetadata;
	semanticSource?: PointSemanticProgram;
}

export type PointCoreDeclaration =
	| PointCoreImportDeclaration
	| PointCoreExternalDeclaration
	| PointCoreValueDeclaration
	| PointCoreFunctionDeclaration
	| PointCoreTypeDeclaration;

export interface PointCoreImportDeclaration {
	kind: "import";
	names: string[];
	from: string;
	span?: PointSourceSpan;
}

export interface PointCoreValueDeclaration {
	kind: "value";
	name: string;
	type: PointCoreTypeExpression;
	value: PointCoreExpression;
	mutable: boolean;
	span?: PointSourceSpan;
}

export interface PointCoreFunctionDeclaration {
	kind: "function";
	name: string;
	params: PointCoreParameter[];
	returnType: PointCoreTypeExpression;
	body: PointCoreStatement[];
	span?: PointSourceSpan;
	semantic?: PointSemanticDeclarationMetadata;
}

export interface PointCoreExternalDeclaration {
	kind: "external";
	name: string;
	params: PointCoreParameter[];
	returnType: PointCoreTypeExpression;
	from: string;
	importName?: string;
	span?: PointSourceSpan;
	semantic?: PointSemanticDeclarationMetadata;
}

export interface PointCoreTypeDeclaration {
	kind: "type";
	name: string;
	fields: PointCoreParameter[];
	span?: PointSourceSpan;
	semantic?: PointSemanticDeclarationMetadata;
}

export interface PointCoreParameter {
	name: string;
	type: PointCoreTypeExpression;
	span?: PointSourceSpan;
	semanticName?: string;
}

export interface PointSemanticProgramMetadata {
	source: "semantic";
}

export interface PointSemanticPageLayout {
	title: PointCoreExpression;
	description?: PointCoreExpression;
	main: PointCoreExpression;
}

export interface PointSemanticViewCheckboxBinding {
	label: string;
	target: PointCoreExpression;
	recordParam: string;
	fieldName: string;
}

export interface PointSemanticViewControls {
	changeCallback: string;
	checkboxes: PointSemanticViewCheckboxBinding[];
}

export interface PointSemanticDeclarationMetadata {
	kind: "record" | "calculation" | "rule" | "label" | "external" | "action" | "policy" | "view" | "page" | "route" | "workflow" | "command";
	name: string;
	outputName?: string;
	effects?: string[];
	pageLayout?: PointSemanticPageLayout;
	viewControls?: PointSemanticViewControls;
}

export interface PointCoreTypeExpression {
	kind: "typeRef";
	name: PointCorePrimitiveType | string;
	args: PointCoreTypeExpression[];
	span?: PointSourceSpan;
}

export interface PointCoreRecordField {
	name: string;
	value: PointCoreExpression;
	span?: PointSourceSpan;
}

export type PointCoreStatement =
	| { kind: "return"; value?: PointCoreExpression; span?: PointSourceSpan }
	| PointCoreValueDeclaration
	| {
			kind: "assignment";
			name: string;
			operator: "=" | "+=" | "-=";
			value: PointCoreExpression;
			span?: PointSourceSpan;
	  }
	| {
			kind: "if";
			condition: PointCoreExpression;
			thenBody: PointCoreStatement[];
			elseBody: PointCoreStatement[];
			span?: PointSourceSpan;
	  }
	| {
			kind: "for";
			itemName: string;
			iterable: PointCoreExpression;
			body: PointCoreStatement[];
			span?: PointSourceSpan;
	  }
	| { kind: "expression"; value: PointCoreExpression; span?: PointSourceSpan };

export type PointCoreExpression =
	| { kind: "literal"; value: string | number | boolean | null; span?: PointSourceSpan }
	| { kind: "identifier"; name: string; span?: PointSourceSpan }
	| { kind: "list"; items: PointCoreExpression[]; span?: PointSourceSpan }
	| { kind: "record"; fields: PointCoreRecordField[]; span?: PointSourceSpan }
	| { kind: "property"; target: PointCoreExpression; name: string; span?: PointSourceSpan }
	| { kind: "await"; value: PointCoreExpression; span?: PointSourceSpan }
	| {
			kind: "binary";
			operator: PointCoreBinaryOperator;
			left: PointCoreExpression;
			right: PointCoreExpression;
			span?: PointSourceSpan;
	  }
	| { kind: "call"; callee: string; args: PointCoreExpression[]; span?: PointSourceSpan };

export type PointCoreBinaryOperator =
	| "+"
	| "-"
	| "*"
	| "/"
	| "=="
	| "!="
	| "<"
	| "<="
	| ">"
	| ">="
	| "and"
	| "or";
