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
	| PointSemanticThemeDeclaration
	| PointSemanticRecordDeclaration
	| PointSemanticVariantDeclaration
	| PointSemanticCalculationDeclaration
	| PointSemanticRuleDeclaration
	| PointSemanticLabelDeclaration
	| PointSemanticExternalDeclaration
	| PointSemanticActionDeclaration
	| PointSemanticPolicyDeclaration
	| PointSemanticGuardDeclaration
	| PointSemanticViewDeclaration
	| PointSemanticLayoutDeclaration
	| PointSemanticNavigationDeclaration
	| PointSemanticPageDeclaration
	| PointSemanticMiddlewareDeclaration
	| PointSemanticRouteDeclaration
	| PointSemanticStreamRouteDeclaration
	| PointSemanticWorkflowDeclaration
	| PointSemanticPipelineDeclaration
	| PointSemanticSessionDeclaration
	| PointSemanticCommandDeclaration
	| PointSemanticScheduleDeclaration
	| PointSemanticPromptDeclaration;

export type PointSemanticScheduleIntervalUnit = "seconds" | "minutes" | "hours";

export interface PointSemanticScheduleInterval {
	amount: number;
	unit: PointSemanticScheduleIntervalUnit;
	span?: PointSourceSpan;
}

export interface PointSemanticScheduleDeclaration {
	kind: "schedule";
	name: string;
	interval: PointSemanticScheduleInterval;
	actionName: string;
	span?: PointSourceSpan;
}

export interface PointSemanticPromptDeclaration {
	kind: "prompt";
	name: string;
	version: string;
	recordName: string;
	template: string;
	span?: PointSourceSpan;
}

export interface PointSemanticThemeDeclaration {
	kind: "theme";
	name: string;
	accent?: string;
	density?: string;
	radius?: string;
	toggle?: boolean;
	span?: PointSourceSpan;
}

export interface PointSemanticRecordDeclaration {
	kind: "record";
	name: string;
	fields: PointSemanticField[];
	span?: PointSourceSpan;
}

export interface PointSemanticVariantDeclaration {
	kind: "variant";
	name: string;
	cases: PointSemanticVariantCase[];
	span?: PointSourceSpan;
}

export interface PointSemanticVariantCase {
	label: string;
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

export interface PointSemanticGuardDeclaration {
	kind: "guard";
	name: string;
	patterns: string[];
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

export interface PointSemanticLayoutSlot {
	name: string;
	content: PointSemanticExpression;
	style?: string[];
	span?: PointSourceSpan;
}

export interface PointSemanticLayoutDeclaration {
	kind: "layout";
	name: string;
	slots: PointSemanticLayoutSlot[];
	span?: PointSourceSpan;
}

export interface PointSemanticPageDeclaration {
	kind: "page";
	name: string;
	layout?: string;
	inputs: PointSemanticBinding[];
	loadData?: string;
	title: PointSemanticExpression;
	description?: PointSemanticExpression;
	main: PointSemanticExpression;
	mainClassName?: string;
	mainStyle?: string[];
	whenLoadingRender?: PointSemanticExpression;
	whenLoadingClassName?: string;
	whenLoadingStyle?: string[];
	whenErrorRender?: PointSemanticExpression;
	whenErrorClassName?: string;
	whenErrorStyle?: string[];
	whenEmptyRender?: PointSemanticExpression;
	whenEmptyClassName?: string;
	whenEmptyStyle?: string[];
	streamSubscribePath?: string;
	streamSubscribeRoute?: string;
	onMessageCall?: string;
	whenConnectingRender?: PointSemanticExpression;
	whenConnectingClassName?: string;
	whenConnectingStyle?: string[];
	whenDisconnectedRender?: PointSemanticExpression;
	whenDisconnectedClassName?: string;
	whenDisconnectedStyle?: string[];
	span?: PointSourceSpan;
}

export interface PointSemanticNavigationRoute {
	path: string;
	pageName: string;
	span?: PointSourceSpan;
}

export interface PointSemanticNavigationDeclaration {
	kind: "navigation";
	name: string;
	routes: PointSemanticNavigationRoute[];
	bootstrapRouter: boolean;
	span?: PointSourceSpan;
}

export interface PointSemanticMiddlewareDeclaration {
	kind: "middleware";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticMiddlewareStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticRouteDeclaration {
	kind: "route";
	name: string;
	method: string;
	path: string;
	before: string[];
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticRouteStatement[];
	span?: PointSourceSpan;
}

export type PointSemanticStreamRouteEvent = "connect" | "message" | "disconnect";

export interface PointSemanticStreamRouteHandler {
	event: PointSemanticStreamRouteEvent;
	inputLabel?: string;
	mode: "return" | "streamFromAction";
	value?: PointSemanticExpression;
	actionName?: string;
	span?: PointSourceSpan;
}

export interface PointSemanticStreamRouteDeclaration {
	kind: "streamRoute";
	name: string;
	path: string;
	messageType: PointSemanticTypeExpression;
	handlers: PointSemanticStreamRouteHandler[];
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

export interface PointSemanticPipelineDeclaration {
	kind: "pipeline";
	name: string;
	inputs: PointSemanticBinding[];
	output: PointSemanticOutputBinding;
	body: PointSemanticPipelineStatement[];
	span?: PointSourceSpan;
}

export interface PointSemanticSessionDeclaration {
	kind: "session";
	name: string;
	messageRecordName: string;
	messagesField: PointSemanticBinding;
	streamActionName: string;
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
	| { kind: "whenReturn"; condition: PointSemanticExpression; value: PointSemanticExpression; span?: PointSourceSpan }
	| PointSemanticMutationStatement
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticRuleStatement =
	| { kind: "startsAt"; name: string; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "addWhen"; amount: PointSemanticExpression; condition: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "forEach"; item: string; iterable: PointSemanticExpression; body: PointSemanticMutationStatement[]; span?: PointSourceSpan }
	| { kind: "whenReturn"; condition: PointSemanticExpression; value: PointSemanticExpression; span?: PointSourceSpan }
	| PointSemanticMutationStatement
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticLabelStatement =
	| { kind: "whenReturn"; condition: PointSemanticExpression; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "onVariantReturn"; caseLabel: string; bindings: string[]; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "otherwiseReturn"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticActionStatement =
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "yield"; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "expression"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticPolicyStatement =
	| { kind: "allow"; condition: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "deny"; condition: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "require"; condition: PointSemanticExpression; span?: PointSourceSpan };

export interface PointSemanticViewTab {
	label: string;
	value: PointSemanticExpression;
	className?: string;
	style?: string[];
	span?: PointSourceSpan;
}

export type PointSemanticViewBindStatement =
	| { kind: "bindCheckbox"; label: string; target: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "bindField"; label: string; target: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticViewStatement =
	| { kind: "render"; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "whenRender"; condition: PointSemanticExpression; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "loadData"; action: string; span?: PointSourceSpan }
	| { kind: "loadFetch"; method: "GET"; url: string; field: string; itemType: string; span?: PointSourceSpan }
	| { kind: "onMountCall"; action: string; span?: PointSourceSpan }
	| { kind: "streamSubscribePath"; path: string; span?: PointSourceSpan }
	| { kind: "streamSubscribeRoute"; routeName: string; span?: PointSourceSpan }
	| { kind: "onMessageCall"; callback: string; span?: PointSourceSpan }
	| { kind: "whenConnectingRender"; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "whenDisconnectedRender"; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "whenLoadingRender"; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "whenErrorRender"; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "whenEmptyRender"; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "link"; label: string; path: string; span?: PointSourceSpan }
	| { kind: "navigate"; path: string; span?: PointSourceSpan }
	| PointSemanticViewBindStatement
	| { kind: "form"; bindings: PointSemanticViewBindStatement[]; style?: string[]; span?: PointSourceSpan }
	| { kind: "eachRender"; item: string; iterable: PointSemanticExpression; value: PointSemanticExpression; className?: string; style?: string[]; linkPath?: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "modal"; title: string; when?: PointSemanticExpression; value: PointSemanticExpression; className?: string; style?: string[]; span?: PointSourceSpan }
	| { kind: "tabs"; tabs: PointSemanticViewTab[]; span?: PointSourceSpan }
	| { kind: "toggleTheme"; style?: string[]; span?: PointSourceSpan }
	| { kind: "onChangeCall"; callback: string; span?: PointSourceSpan };

export type PointSemanticMiddlewareStatement = PointSemanticLabelStatement;

export type PointSemanticRouteStatement =
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan }
	| {
			kind: "returnJson";
			value: PointSemanticExpression;
			status?: PointSemanticExpression;
			headers?: PointSemanticExpression;
			span?: PointSourceSpan;
	  };

export interface PointSemanticWorkflowStepOptions {
	retryCount?: number;
	timeoutSeconds?: number;
	requiredPolicy?: string;
	requiredPolicySpan?: PointSourceSpan;
	fileScopeGuard?: string;
	onFailure?: PointSemanticExpression;
}

export type PointSemanticPipelineStepOptions = PointSemanticWorkflowStepOptions;

export type PointSemanticWorkflowStatement =
	| {
			kind: "step";
			name: string;
			value: PointSemanticExpression;
			options?: PointSemanticWorkflowStepOptions;
			span?: PointSourceSpan;
	  }
	| { kind: "return"; value: PointSemanticExpression; span?: PointSourceSpan };

export type PointSemanticPipelineStatement =
	| {
			kind: "step";
			name: string;
			value: PointSemanticExpression;
			options?: PointSemanticPipelineStepOptions;
			span?: PointSourceSpan;
	  }
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
	| { kind: "map"; entries: PointSemanticRecordLiteralField[]; span?: PointSourceSpan }
	| { kind: "lookup"; map: PointSemanticExpression; key: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "call"; callee: string; args: PointSemanticExpression[]; span?: PointSourceSpan }
	| { kind: "await"; value: PointSemanticExpression; span?: PointSourceSpan }
	| { kind: "error"; message: string; span?: PointSourceSpan }
	| { kind: "variant"; caseLabel: string; fields: PointSemanticRecordLiteralField[]; span?: PointSourceSpan }
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
