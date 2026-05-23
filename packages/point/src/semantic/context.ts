import type { PointCoreProgram, PointSourceSpan } from "../core/ast.ts";
import type { PointCoreDiagnostic } from "../core/check.ts";
import { mapDiagnosticsToSemanticRefs } from "../core/context.ts";
import { extractPromptPlaceholders } from "./check-prompts.ts";
import type {
	PointSemanticBinding,
	PointSemanticDeclaration,
	PointSemanticExpression,
	PointSemanticOutputBinding,
	PointSemanticProgram,
	PointSemanticTypeExpression,
} from "./ast.ts";

function formatSemanticType(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(formatSemanticType).join(", ")}>`;
}

export type PointSemanticSymbolKind =
	| "module"
	| "use"
	| "record"
	| "field"
	| "calculation"
	| "rule"
	| "label"
	| "external"
	| "action"
	| "policy"
	| "guard"
	| "view"
	| "layout"
	| "slot"
	| "navigation"
	| "page"
	| "middleware"
	| "route"
	| "streamRoute"
	| "workflow"
	| "pipeline"
	| "session"
	| "command"
	| "schedule"
	| "prompt"

	| "param";

export interface PointSemanticSymbol {
	ref: string;
	path: string;
	kind: PointSemanticSymbolKind;
	name: string;
	module: string;
	type?: string;
	from?: string;
	effects?: string[];
	span: PointSourceSpan | null;
}

export interface PointSemanticIndex {
	schemaVersion: "point.semantic.index.v1";
	module: string;
	refs: PointSemanticSymbol[];
}

export interface PointSemanticExplanation {
	schemaVersion: "point.semantic.explain.v1";
	ref: string;
	found: boolean;
	symbol?: PointSemanticSymbol;
	relatedRefs: string[];
	summary: string;
}

export function createSemanticIndex(program: PointSemanticProgram): PointSemanticIndex {
	const moduleName = program.module ?? "anonymous";
	const refs: PointSemanticSymbol[] = [
		{
			ref: semanticRefFor(moduleName, "module"),
			path: "module",
			kind: "module",
			name: moduleName,
			module: moduleName,
			span: program.span ?? null,
		},
		...program.uses.map((use) => ({
			ref: semanticRefFor(moduleName, `use.${use.moduleName}`),
			path: `use.${use.moduleName}`,
			kind: "use" as const,
			name: use.moduleName,
			module: moduleName,
			from: use.from,
			span: use.span ?? null,
		})),
	];
	for (const declaration of program.declarations) {
		refs.push(...symbolsForDeclaration(moduleName, declaration));
	}
	return { schemaVersion: "point.semantic.index.v1", module: moduleName, refs };
}

export function explainSemanticRef(program: PointSemanticProgram, ref: string): PointSemanticExplanation {
	const index = createSemanticIndex(program);
	const symbol = index.refs.find((candidate) => candidate.ref === ref);
	if (!symbol) {
		return {
			schemaVersion: "point.semantic.explain.v1",
			ref,
			found: false,
			relatedRefs: [],
			summary: `No Point symbol found for ${ref}.`,
		};
	}
	const relatedRefs = relatedRefsFor(symbol, index);
	return {
		schemaVersion: "point.semantic.explain.v1",
		ref,
		found: true,
		symbol,
		relatedRefs,
		summary: summaryFor(symbol),
	};
}

export function mapPublicDiagnostics(program: PointCoreProgram, diagnostics: PointCoreDiagnostic[]): PointCoreDiagnostic[] {
	const mapped = mapDiagnosticsToSemanticRefs(program, diagnostics);
	if (!program.semanticSource) return mapped;
	return mapped.map((diagnostic) => ({
		...diagnostic,
		span: diagnostic.span ?? semanticSpanForDiagnosticPath(program.semanticSource!, program, diagnostic.path),
	}));
}

function symbolsForDeclaration(moduleName: string, declaration: PointSemanticDeclaration): PointSemanticSymbol[] {
	if (declaration.kind === "navigation") {
		const path = `navigation.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, path),
				path,
				kind: "navigation",
				name: declaration.name,
				module: moduleName,
				span: declaration.span ?? null,
			},
			...declaration.routes.map((route) => ({
				ref: semanticRefFor(moduleName, `${path}.route.${encodeURIComponent(route.path)}`),
				path: `${path}.route.${encodeURIComponent(route.path)}`,
				kind: "navigation" as const,
				name: route.path,
				module: moduleName,
				type: route.pageName,
				span: route.span ?? null,
			})),
		];
	}
	if (declaration.kind === "guard") {
		const path = `guard.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, path),
				path,
				kind: "guard",
				name: declaration.name,
				module: moduleName,
				type: `${declaration.patterns.length} path patterns`,
				span: declaration.span ?? null,
			},
			...declaration.patterns.map((pattern) => ({
				ref: semanticRefFor(moduleName, `${path}.pattern.${encodeURIComponent(pattern)}`),
				path: `${path}.pattern.${encodeURIComponent(pattern)}`,
				kind: "guard" as const,
				name: pattern,
				module: moduleName,
				type: "path",
				span: declaration.span ?? null,
			})),
		];
	}
	if (declaration.kind === "schedule") {
		const path = `schedule.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, path),
				path,
				kind: "schedule",
				name: declaration.name,
				module: moduleName,
				type: `every ${declaration.interval.amount} ${declaration.interval.unit}`,
				span: declaration.span ?? null,
			},
			{
				ref: semanticRefFor(moduleName, `${path}.call.${declaration.actionName}`),
				path: `${path}.call.${declaration.actionName}`,
				kind: "schedule" as const,
				name: declaration.actionName,
				module: moduleName,
				type: "action",
				span: declaration.span ?? null,
			},
		];
	}
	if (declaration.kind === "session") {
		const path = `session.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, path),
				path,
				kind: "session",
				name: declaration.name,
				module: moduleName,
				type: declaration.messageRecordName,
				span: declaration.span ?? null,
			},
			{
				ref: semanticRefFor(moduleName, `${path}.message.${declaration.messageRecordName}`),
				path: `${path}.message.${declaration.messageRecordName}`,
				kind: "session" as const,
				name: declaration.messageRecordName,
				module: moduleName,
				type: "record",
				span: declaration.span ?? null,
			},
			{
				ref: semanticRefFor(moduleName, `${path}.messages.${declaration.messagesField.label}`),
				path: `${path}.messages.${declaration.messagesField.label}`,
				kind: "session" as const,
				name: declaration.messagesField.label,
				module: moduleName,
				type: formatSemanticType(declaration.messagesField.type),
				span: declaration.messagesField.span ?? null,
			},
			{
				ref: semanticRefFor(moduleName, `${path}.stream.${declaration.streamActionName}`),
				path: `${path}.stream.${declaration.streamActionName}`,
				kind: "session" as const,
				name: declaration.streamActionName,
				module: moduleName,
				type: "stream action",
				span: declaration.span ?? null,
			},
		];
	}
	if (declaration.kind === "prompt") {
		const path = `prompt.${declaration.name}`;
		const placeholders = extractPromptPlaceholders(declaration.template);
		return [
			{
				ref: semanticRefFor(moduleName, path),
				path,
				kind: "prompt",
				name: declaration.name,
				module: moduleName,
				type: declaration.recordName,
				span: declaration.span ?? null,
			},
			{
				ref: semanticRefFor(moduleName, `${path}.version`),
				path: `${path}.version`,
				kind: "prompt" as const,
				name: declaration.version,
				module: moduleName,
				type: "version",
				span: declaration.span ?? null,
			},
			{
				ref: semanticRefFor(moduleName, `${path}.input.${declaration.recordName}`),
				path: `${path}.input.${declaration.recordName}`,
				kind: "prompt" as const,
				name: declaration.recordName,
				module: moduleName,
				type: "record",
				span: declaration.span ?? null,
			},
			...placeholders.map((placeholder) => ({
				ref: semanticRefFor(moduleName, `${path}.placeholder.${placeholder}`),
				path: `${path}.placeholder.${placeholder}`,
				kind: "prompt" as const,
				name: placeholder,
				module: moduleName,
				type: "placeholder",
				span: declaration.span ?? null,
			})),
			{
				ref: semanticRefFor(moduleName, `${path}.template`),
				path: `${path}.template`,
				kind: "prompt" as const,
				name: "template",
				module: moduleName,
				type: "Text",
				span: declaration.span ?? null,
			},
		];
	}
	if (declaration.kind === "record") {
		const recordPath = `record.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, recordPath),
				path: recordPath,
				kind: "record",
				name: declaration.name,
				module: moduleName,
				span: declaration.span ?? null,
			},
			...declaration.fields.map((field) => ({
				ref: semanticRefFor(moduleName, `${recordPath}.field.${field.label}`),
				path: `${recordPath}.field.${field.label}`,
				kind: "field" as const,
				name: field.label,
				module: moduleName,
				type: formatSemanticType(field.type),
				span: field.span ?? null,
			})),
		];
	}
	if (declaration.kind === "external") {
		return declaration.functions.flatMap((fn) => {
			const path = `external.${fn.label}`;
			return [
				{
					ref: semanticRefFor(moduleName, path),
					path,
					kind: "external" as const,
					name: fn.label,
					module: moduleName,
					type: formatSemanticType(fn.returnType),
					from: fn.from,
					span: fn.span ?? null,
				},
				...bindingSymbols(moduleName, path, fn.params),
			];
		});
	}
	if (declaration.kind === "layout") {
		const layoutPath = `layout.${declaration.name}`;
		return [
			{
				ref: semanticRefFor(moduleName, layoutPath),
				path: layoutPath,
				kind: "layout",
				name: declaration.name,
				module: moduleName,
				span: declaration.span ?? null,
			},
			...declaration.slots.map((slot) => ({
				ref: semanticRefFor(moduleName, `${layoutPath}.slot.${slot.name}`),
				path: `${layoutPath}.slot.${slot.name}`,
				kind: "slot" as const,
				name: slot.name,
				module: moduleName,
				span: slot.span ?? null,
			})),
		];
	}
	if (declaration.kind === "view") {
		const viewPath = `view.${declaration.name}`;
		const childSymbols = declaration.body.flatMap((statement) => {
			if (statement.kind === "bindField" || statement.kind === "bindCheckbox") {
				return [{
					ref: semanticRefFor(moduleName, `${viewPath}.bind.${statement.label}`),
					path: `${viewPath}.bind.${statement.label}`,
					kind: "view" as const,
					name: statement.label,
					module: moduleName,
					span: statement.span ?? null,
				}];
			}
			if (statement.kind === "form") {
				return statement.bindings.map((binding) => ({
					ref: semanticRefFor(moduleName, `${viewPath}.form.${binding.label}`),
					path: `${viewPath}.form.${binding.label}`,
					kind: "view" as const,
					name: binding.label,
					module: moduleName,
					span: binding.span ?? null,
				}));
			}
			if (statement.kind === "eachRender") {
				return [{
					ref: semanticRefFor(moduleName, `${viewPath}.each.${statement.item}`),
					path: `${viewPath}.each.${statement.item}`,
					kind: "view" as const,
					name: statement.item,
					module: moduleName,
					span: statement.span ?? null,
				}];
			}
			if (statement.kind === "modal") {
				return [{
					ref: semanticRefFor(moduleName, `${viewPath}.modal.${statement.title}`),
					path: `${viewPath}.modal.${statement.title}`,
					kind: "view" as const,
					name: statement.title,
					module: moduleName,
					span: statement.span ?? null,
				}];
			}
			if (statement.kind === "tabs") {
				return statement.tabs.map((tab) => ({
					ref: semanticRefFor(moduleName, `${viewPath}.tab.${tab.label}`),
					path: `${viewPath}.tab.${tab.label}`,
					kind: "view" as const,
					name: tab.label,
					module: moduleName,
					span: tab.span ?? null,
				}));
			}
			return [];
		});
		const loadStatement = declaration.body.find(
			(statement) => statement.kind === "loadData" || statement.kind === "onMountCall",
		);
		const subscribeStatement = declaration.body.find(
			(statement) => statement.kind === "streamSubscribePath" || statement.kind === "streamSubscribeRoute",
		);
		const base = [
			{
				ref: semanticRefFor(moduleName, viewPath),
				path: viewPath,
				kind: "view" as const,
				name: declaration.name,
				module: moduleName,
				type: formatSemanticType(declaration.output.type),
				span: declaration.span ?? null,
			},
			...bindingSymbols(moduleName, viewPath, declaration.inputs),
			{
				ref: semanticRefFor(moduleName, `${viewPath}.output.${declaration.output.name}`),
				path: `${viewPath}.output.${declaration.output.name}`,
				kind: "param" as const,
				name: declaration.output.name,
				module: moduleName,
				type: formatSemanticType(declaration.output.type),
				span: declaration.output.span ?? null,
			},
		];
		if (loadStatement && (loadStatement.kind === "loadData" || loadStatement.kind === "onMountCall")) {
			base.push({
				ref: semanticRefFor(moduleName, `${viewPath}.load.${loadStatement.action}`),
				path: `${viewPath}.load.${loadStatement.action}`,
				kind: "view" as const,
				name: loadStatement.action,
				module: moduleName,
				type: "data load",
				span: loadStatement.span ?? null,
			});
		}
		if (subscribeStatement && (subscribeStatement.kind === "streamSubscribePath" || subscribeStatement.kind === "streamSubscribeRoute")) {
			const subscribeLabel =
				subscribeStatement.kind === "streamSubscribePath"
					? subscribeStatement.path
					: `stream ${subscribeStatement.routeName}`;
			base.push({
				ref: semanticRefFor(moduleName, `${viewPath}.subscribe.${subscribeLabel}`),
				path: `${viewPath}.subscribe.${subscribeLabel}`,
				kind: "view" as const,
				name: subscribeLabel,
				module: moduleName,
				type: "stream subscribe",
				effects: ["network"],
				span: subscribeStatement.span ?? null,
			});
		}
		return [...base, ...childSymbols];
	}
	if (declaration.kind === "page") {
		const pagePath = `page.${declaration.name}`;
		const base = [
			{
				ref: semanticRefFor(moduleName, pagePath),
				path: pagePath,
				kind: "page" as const,
				name: declaration.name,
				module: moduleName,
				type: "Page",
				span: declaration.span ?? null,
			},
			...bindingSymbols(moduleName, pagePath, declaration.inputs),
		];
		if (declaration.loadData) {
			base.push({
				ref: semanticRefFor(moduleName, `${pagePath}.load.${declaration.loadData}`),
				path: `${pagePath}.load.${declaration.loadData}`,
				kind: "page" as const,
				name: declaration.loadData,
				module: moduleName,
				type: "data load",
				span: declaration.span ?? null,
			});
		}
		if (declaration.streamSubscribePath || declaration.streamSubscribeRoute) {
			const subscribeLabel = declaration.streamSubscribePath
				? declaration.streamSubscribePath
				: `stream ${declaration.streamSubscribeRoute}`;
			base.push({
				ref: semanticRefFor(moduleName, `${pagePath}.subscribe.${subscribeLabel}`),
				path: `${pagePath}.subscribe.${subscribeLabel}`,
				kind: "page" as const,
				name: subscribeLabel ?? "",
				module: moduleName,
				type: "stream subscribe",
				effects: ["network"],
				span: declaration.span ?? null,
			});
		}
		return base;
	}
	const callable = callableDeclaration(declaration);
	if (!callable) return [];
	const path = `${callable.kind}.${callable.name}`;
	const symbols: PointSemanticSymbol[] = [
		{
			ref: semanticRefFor(moduleName, path),
			path,
			kind: callable.kind,
			name: callable.name,
			module: moduleName,
			type: formatSemanticType(callable.output.type),
			effects: callable.effects,
			span: callable.declaration.span ?? null,
		},
		...bindingSymbols(moduleName, path, callable.inputs),
		{
			ref: semanticRefFor(moduleName, `${path}.output.${callable.output.name}`),
			path: `${path}.output.${callable.output.name}`,
			kind: "param",
			name: callable.output.name,
			module: moduleName,
			type: formatSemanticType(callable.output.type),
			span: callable.output.span ?? null,
		},
	];
	if (declaration.kind === "pipeline") {
		for (const statement of declaration.body) {
			if (statement.kind !== "step") continue;
			symbols.push({
				ref: semanticRefFor(moduleName, `${path}.step.${statement.name}`),
				path: `${path}.step.${statement.name}`,
				kind: "pipeline",
				name: statement.name,
				module: moduleName,
				type: "step",
				span: statement.span ?? null,
			});
		}
	}
	return symbols;
}

function callableDeclaration(declaration: PointSemanticDeclaration):
	| {
			kind: Exclude<PointSemanticSymbolKind, "module" | "use" | "record" | "field" | "external" | "param">;
			name: string;
			inputs: PointSemanticBinding[];
			output: PointSemanticOutputBinding;
			effects?: string[];
			declaration: PointSemanticDeclaration;
	  }
	| null {
	if (declaration.kind === "calculation" || declaration.kind === "rule" || declaration.kind === "label") {
		return { kind: declaration.kind, name: declaration.name, inputs: declaration.inputs, output: declaration.output, declaration };
	}
	if (declaration.kind === "action") {
		return {
			kind: "action",
			name: declaration.name,
			inputs: declaration.inputs,
			output: declaration.output,
			effects: declaration.touches,
			declaration,
		};
	}
	if (declaration.kind === "policy") {
		return { kind: "policy", name: declaration.name, inputs: declaration.inputs, output: { name: "allowed", type: boolType() }, declaration };
	}
	if (
		declaration.kind === "route" ||
		declaration.kind === "streamRoute" ||
		declaration.kind === "middleware" ||
		declaration.kind === "workflow" ||
		declaration.kind === "pipeline" ||
		declaration.kind === "command"
	) {
		return {
			kind: declaration.kind,
			name: declaration.name,
			inputs: declaration.kind === "streamRoute" ? [] : declaration.inputs,
			output:
				declaration.kind === "streamRoute"
					? { name: "stream", type: { kind: "typeRef", name: "Void", args: [] } }
					: declaration.output,
			effects: declaration.kind === "streamRoute" ? ["network"] : undefined,
			declaration,
		};
	}
	return null;
}

function bindingSymbols(moduleName: string, ownerPath: string, bindings: PointSemanticBinding[]): PointSemanticSymbol[] {
	return bindings.map((binding) => ({
		ref: semanticRefFor(moduleName, `${ownerPath}.input.${binding.label}`),
		path: `${ownerPath}.input.${binding.label}`,
		kind: "param" as const,
		name: binding.label,
		module: moduleName,
		type: formatSemanticType(binding.type),
		span: binding.span ?? null,
	}));
}

function semanticSpanForDiagnosticPath(
	semantic: PointSemanticProgram,
	program: PointCoreProgram,
	path: string,
): PointSourceSpan | null {
	const fnMatch = path.match(/^fn\.([^.]+)(?:\.(.+))?$/);
	if (fnMatch) {
		const fnName = fnMatch[1] ?? "";
		const suffix = fnMatch[2] ?? "";
		const coreFn = program.declarations.find((declaration) => declaration.kind === "function" && declaration.name === fnName);
		if (!coreFn || coreFn.kind !== "function" || !coreFn.semantic) return coreFn?.span ?? null;
		const semanticDecl = semantic.declarations.find(
			(declaration) => declaration.kind === coreFn.semantic!.kind && "name" in declaration && declaration.name === coreFn.semantic!.name,
		);
		if (!semanticDecl) return coreFn.span ?? null;
		if (suffix.startsWith("if.condition") || suffix.endsWith(".condition")) {
			return findConditionSpan(semanticDecl) ?? coreFn.span ?? null;
		}
		if (suffix === "return" || suffix.endsWith(".return")) {
			return findReturnSpan(semanticDecl) ?? coreFn.span ?? null;
		}
		return ("span" in semanticDecl ? semanticDecl.span : null) ?? coreFn.span ?? null;
	}
	const typeMatch = path.match(/^type\.([^.]+)(?:\.(.+))?$/);
	if (typeMatch) {
		const typeName = typeMatch[1] ?? "";
		const fieldName = typeMatch[2];
		const coreType = program.declarations.find((declaration) => declaration.kind === "type" && declaration.name === typeName);
		if (fieldName && coreType?.kind === "type") {
			const field = coreType.fields.find((candidate) => candidate.name === fieldName);
			return field?.span ?? coreType.span ?? null;
		}
		return coreType?.kind === "type" ? coreType.span ?? null : null;
	}
	return null;
}

function findConditionSpan(declaration: PointSemanticDeclaration): PointSourceSpan | null {
	if (declaration.kind === "label") {
		for (const statement of declaration.body) {
			if (statement.kind === "whenReturn") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "view") {
		for (const statement of declaration.body) {
			if (statement.kind === "whenRender") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "rule") {
		for (const statement of declaration.body) {
			if (statement.kind === "whenReturn") return expressionSpan(statement.condition) ?? statement.span ?? null;
			if (statement.kind === "addWhen") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "calculation") {
		for (const statement of declaration.body) {
			if (statement.kind === "whenReturn") return expressionSpan(statement.condition) ?? statement.span ?? null;
		}
	}
	if (declaration.kind === "policy") {
		for (const statement of declaration.body) {
			if (statement.kind === "allow" || statement.kind === "deny" || statement.kind === "require") {
				return expressionSpan(statement.condition) ?? statement.span ?? null;
			}
		}
	}
	return null;
}

function findReturnSpan(declaration: PointSemanticDeclaration): PointSourceSpan | null {
	if ("body" in declaration && Array.isArray(declaration.body)) {
		for (const statement of declaration.body) {
			if (statement.kind === "return") return expressionSpan(statement.value) ?? statement.span ?? null;
			if (statement.kind === "otherwiseReturn") return expressionSpan(statement.value) ?? statement.span ?? null;
			if (statement.kind === "render") return expressionSpan(statement.value) ?? statement.span ?? null;
		}
	}
	return null;
}

function expressionSpan(expression: PointSemanticExpression): PointSourceSpan | null {
	return expression.span ?? null;
}

function relatedRefsFor(symbol: PointSemanticSymbol, index: PointSemanticIndex): string[] {
	if (symbol.kind === "field") {
		const ownerPath = symbol.path.split(".").slice(0, 2).join(".");
		return index.refs.filter((candidate) => candidate.path.startsWith(`${ownerPath}.`) && candidate.ref !== symbol.ref).map((candidate) => candidate.ref);
	}
	if (symbol.kind === "record" || symbol.kind === "calculation" || symbol.kind === "rule" || symbol.kind === "label" || symbol.kind === "action" || symbol.kind === "policy" || symbol.kind === "guard" || symbol.kind === "view" || symbol.kind === "layout" || symbol.kind === "navigation" || symbol.kind === "page" || symbol.kind === "middleware" || symbol.kind === "route" || symbol.kind === "streamRoute" || symbol.kind === "workflow" || symbol.kind === "pipeline" || symbol.kind === "session" || symbol.kind === "command" || symbol.kind === "schedule" || symbol.kind === "prompt" || symbol.kind === "external") {
		return index.refs.filter((candidate) => candidate.path.startsWith(`${symbol.path}.`)).map((candidate) => candidate.ref);
	}
	return [];
}

function summaryFor(symbol: PointSemanticSymbol): string {
	if (symbol.kind === "module") return `Module ${symbol.name}.`;
	if (symbol.kind === "use") return `Use ${symbol.name}${symbol.from ? ` from ${symbol.from}` : ""}.`;
	if (symbol.kind === "record") return `Semantic record ${symbol.name}.`;
	if (symbol.kind === "field") return `Field ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "param") return `Parameter ${symbol.name}: ${symbol.type}.`;
	if (symbol.kind === "external") return `External function ${symbol.name} from ${symbol.from} returns ${symbol.type}.`;
	if (symbol.kind === "calculation") return `Semantic calculation ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "rule") return `Semantic rule ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "label") return `Semantic label ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "action") return `Semantic action ${symbol.name} returns ${symbol.type}; effects: ${(symbol.effects ?? []).join(", ") || "none"}.`;
	if (symbol.kind === "policy") return `Semantic policy ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "guard") return `Semantic guard ${symbol.name} protects ${symbol.type}.`;
	if (symbol.kind === "view") {
		if (symbol.type === "data load") return `View ${symbol.name} loads data from action ${symbol.name} on mount.`;
		if (symbol.type === "stream subscribe") return `View subscribes to stream channel ${symbol.name} with network effects.`;
		return `Semantic view ${symbol.name} returns ${symbol.type}.`;
	}
	if (symbol.kind === "layout") return `Semantic layout ${symbol.name} defines reusable page slots.`;
	if (symbol.kind === "slot") return `Layout slot ${symbol.name}.`;
	if (symbol.kind === "navigation") return `Semantic navigation ${symbol.name} registers client routes to pages.`;
	if (symbol.kind === "page") {
		if (symbol.type === "data load") return `Page loads data from action ${symbol.name} on mount.`;
		if (symbol.type === "stream subscribe") return `Page subscribes to stream channel ${symbol.name} with network effects.`;
		return `Semantic page ${symbol.name} returns a Next.js page shell (${symbol.type}).`;
	}
	if (symbol.kind === "middleware") return `Semantic middleware ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "route") return `Semantic route ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "streamRoute") return `Semantic stream route ${symbol.name} handles WebSocket events with network effects.`;
	if (symbol.kind === "workflow") return `Semantic workflow ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "pipeline") return `Semantic pipeline ${symbol.name} returns ${symbol.type} with typed step events.`;
	if (symbol.kind === "session") {
		if (symbol.type === "stream action") return `Session ${symbol.name} streams responses from action ${symbol.name}.`;
		if (symbol.type === "record") return `Session message record ${symbol.name}.`;
		return `Semantic session ${symbol.name} with message type ${symbol.type}.`;
	}
	if (symbol.kind === "command") return `Semantic command ${symbol.name} returns ${symbol.type}.`;
	if (symbol.kind === "schedule") {
		if (symbol.type === "action") return `Schedule calls action ${symbol.name}.`;
		return `Semantic schedule ${symbol.name} runs every ${symbol.type}.`;
	}
	if (symbol.kind === "prompt") {
		if (symbol.type === "version") return `Prompt version ${symbol.name}.`;
		if (symbol.type === "record") return `Prompt input record ${symbol.name}.`;
		if (symbol.type === "placeholder") return `Prompt placeholder {${symbol.name}}.`;
		if (symbol.name === "template") return `Prompt template text.`;
		return `Semantic prompt ${symbol.name} for record ${symbol.type}.`;
	}
	return `Point symbol ${symbol.name}.`;
}

function semanticRefFor(moduleName: string, path: string): string {
	return `point://semantic/${moduleName}/${path}`;
}

function boolType(): PointSemanticTypeExpression {
	return { kind: "typeRef", name: "Bool", args: [] };
}
