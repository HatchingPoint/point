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
	/** Spaced semantic callable names from the module and merged std dependencies (for agent repair hints). */
	semanticCallables?: string[];
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
	style?: string[];
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
	mainStyle?: string[];
	dataLoad?: PointSemanticDataLoad;
	streamSubscribe?: PointSemanticStreamSubscribe;
}

export interface PointSemanticViewFieldBinding {
	label: string;
	target: PointCoreExpression;
	recordParam: string;
	fieldName: string;
	inputKind: "text" | "checkbox" | "select" | "textarea";
	options?: PointCoreExpression;
}

export interface PointSemanticFormSubmitSpec {
	label: string;
	method: "POST";
	url: string;
	body: PointCoreExpression;
	bodyParam: string;
	saveTokenField?: string;
	withAuth?: boolean;
	navigateTo?: string;
}

export interface PointSemanticViewControls {
	changeCallback: string;
	fields: PointSemanticViewFieldBinding[];
	style?: string[];
	submit?: PointSemanticFormSubmitSpec;
	successToast?: string;
	errorToast?: string;
}

export interface PointSemanticViewEachSpec {
	itemName: string;
	itemIdentifier: string;
	iterable: PointCoreExpression;
	render: PointCoreExpression;
	className?: string;
	style?: string[];
	linkPath?: PointCoreExpression;
}

export interface PointSemanticViewModalSpec {
	title: string;
	when?: PointCoreExpression;
	content: PointCoreExpression;
	className?: string;
	style?: string[];
}

export interface PointSemanticViewTabSpec {
	label: string;
	content: PointCoreExpression;
	className?: string;
	style?: string[];
}

export interface PointSemanticViewTabsSpec {
	tabs: PointSemanticViewTabSpec[];
}

export interface PointSemanticViewToggleTheme {
	style?: string[];
}

export interface PointSemanticViewButtonSpec {
	label: string;
	clearAuth?: boolean;
	navigateTo?: string;
	style?: string[];
}

export interface PointSemanticViewTableSpec {
	itemName: string;
	itemIdentifier: string;
	iterable: PointCoreExpression;
	columns: string[];
	linkColumn?: string;
	linkPath?: PointCoreExpression;
	sortBy?: string;
	filterBy?: string;
	filterContains?: PointCoreExpression;
	filterLocal?: boolean;
	className?: string;
	style?: string[];
}

export interface PointSemanticViewChartSpec {
	variant: "bar";
	iterable: PointCoreExpression;
	labelField: string;
	valueField: string;
	className?: string;
	style?: string[];
}

export interface PointSemanticViewLink {
	label: string;
	path: string;
}

export interface PointSemanticViewNavigation {
	links: PointSemanticViewLink[];
}

export interface PointSemanticDataLoad {
	source: "action" | "fetch";
	actionName?: string;
	actionFunction?: string;
	fetchMethod?: "GET";
	fetchUrl?: string;
	fetchJsonField?: string;
	fetchTsType?: string;
	bindingName: string;
	loading?: PointCoreExpression;
	loadingClassName?: string;
	loadingStyle?: string[];
	error?: PointCoreExpression;
	errorClassName?: string;
	errorStyle?: string[];
	empty?: PointCoreExpression;
	emptyClassName?: string;
	emptyStyle?: string[];
	loadingSpan?: PointSourceSpan;
	errorSpan?: PointSourceSpan;
	emptySpan?: PointSourceSpan;
	/** When set, refetch on an interval (ms) after initial load; cleared on unmount. */
	refreshIntervalMs?: number;
}

export interface PointSemanticStreamSubscribe {
	routeName?: string;
	path: string;
	messageTypeName: string;
	bindingName: string;
	/** When true, emit a terminal-style WebSocket log surface (`.point-terminal`). */
	terminal?: boolean;
	messageCallback?: string;
	connecting?: PointCoreExpression;
	connectingClassName?: string;
	connectingStyle?: string[];
	disconnected?: PointCoreExpression;
	disconnectedClassName?: string;
	disconnectedStyle?: string[];
	error?: PointCoreExpression;
	errorClassName?: string;
	errorStyle?: string[];
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
	viewButtons?: PointSemanticViewButtonSpec[];
	viewTable?: PointSemanticViewTableSpec;
	viewChart?: PointSemanticViewChartSpec;
	viewModal?: PointSemanticViewModalSpec;
	viewTabs?: PointSemanticViewTabsSpec;
	viewToggleTheme?: PointSemanticViewToggleTheme;
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
	| { kind: "return"; value?: PointCoreExpression; className?: string; style?: string[]; span?: PointSourceSpan }
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
