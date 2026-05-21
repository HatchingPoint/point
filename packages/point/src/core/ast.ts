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
	variantCases?: PointCoreVariantCase[];
	span?: PointSourceSpan;
	semantic?: PointSemanticDeclarationMetadata;
}

export interface PointCoreVariantCase {
	name: string;
	fields: PointCoreParameter[];
	span?: PointSourceSpan;
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

export interface PointSemanticLayoutSlotContent {
	name: string;
	content: PointCoreExpression;
}

export interface PointSemanticLayoutSpec {
	name: string;
	slots: PointSemanticLayoutSlotContent[];
}

export interface PointSemanticPageLayout {
	layoutName?: string;
	layoutFunction?: string;
	title: PointCoreExpression;
	description?: PointCoreExpression;
	main: PointCoreExpression;
	mainClassName?: string;
	dataLoad?: PointSemanticDataLoad;
	streamSubscribe?: PointSemanticStreamSubscribe;
}

export interface PointSemanticViewFieldBinding {
	label: string;
	target: PointCoreExpression;
	recordParam: string;
	fieldName: string;
	inputKind: "text" | "checkbox";
}

export interface PointSemanticViewControls {
	changeCallback: string;
	fields: PointSemanticViewFieldBinding[];
}

export interface PointSemanticViewEachSpec {
	itemName: string;
	itemIdentifier: string;
	iterable: PointCoreExpression;
	render: PointCoreExpression;
	className?: string;
	linkPath?: PointCoreExpression;
}

export interface PointSemanticViewModalSpec {
	title: string;
	when?: PointCoreExpression;
	content: PointCoreExpression;
	className?: string;
}

export interface PointSemanticViewTabSpec {
	label: string;
	content: PointCoreExpression;
}

export interface PointSemanticViewTabsSpec {
	tabs: PointSemanticViewTabSpec[];
}

export interface PointSemanticViewLink {
	label: string;
	path: string;
}

export interface PointSemanticViewNavigation {
	links: PointSemanticViewLink[];
}

export interface PointSemanticDataLoad {
	actionName: string;
	actionFunction: string;
	bindingName: string;
	loading?: PointCoreExpression;
	loadingClassName?: string;
	error?: PointCoreExpression;
	errorClassName?: string;
	empty?: PointCoreExpression;
	emptyClassName?: string;
}

export interface PointSemanticStreamSubscribe {
	routeName?: string;
	path: string;
	messageTypeName: string;
	bindingName: string;
	messageCallback?: string;
	connecting?: PointCoreExpression;
	connectingClassName?: string;
	disconnected?: PointCoreExpression;
	disconnectedClassName?: string;
	error?: PointCoreExpression;
	errorClassName?: string;
}

export interface PointSemanticDeclarationMetadata {
	kind: "record" | "variant" | "calculation" | "rule" | "label" | "external" | "action" | "policy" | "guard" | "view" | "layout" | "navigation" | "page" | "middleware" | "route" | "streamRoute" | "workflow" | "pipeline" | "session" | "command" | "prompt";
	name: string;
	outputName?: string;
	effects?: string[];
	layoutSpec?: PointSemanticLayoutSpec;
	pageLayout?: PointSemanticPageLayout;
	viewControls?: PointSemanticViewControls;
	viewNavigation?: PointSemanticViewNavigation;
	viewEach?: PointSemanticViewEachSpec[];
	viewModal?: PointSemanticViewModalSpec;
	viewTabs?: PointSemanticViewTabsSpec;
	viewDataLoad?: PointSemanticDataLoad;
	pageDataLoad?: PointSemanticDataLoad;
	viewStreamSubscribe?: PointSemanticStreamSubscribe;
	pageStreamSubscribe?: PointSemanticStreamSubscribe;
	isStreamAction?: boolean;
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
	| { kind: "return"; value?: PointCoreExpression; className?: string; span?: PointSourceSpan }
	| { kind: "yield"; value?: PointCoreExpression; span?: PointSourceSpan }
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
