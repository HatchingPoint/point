import type {
	PointSemanticBinding,
	PointSemanticNavigationDeclaration,
	PointSemanticNavigationRoute,
	PointSemanticPageDeclaration,
	PointSemanticTypeExpression,
} from "../semantic/ast.ts";
import { pathSegmentNames, toPathSegment } from "./emit-routes.ts";
import { semanticFunctionName, toIdentifier, toPascalCase } from "../semantic/naming.ts";

export interface ClientRouteSpec {
	path: string;
	wrapperName: string;
	pageFunctionName: string;
	pathParams: PointSemanticBinding[];
	pageInputs: PointSemanticBinding[];
}

export function navigationPathParamInputs(path: string, page: PointSemanticPageDeclaration): PointSemanticBinding[] {
	const segments = pathSegmentNames(path);
	return page.inputs.filter((input) => segments.includes(toPathSegment(input.label)));
}

export function clientRouteSpec(route: PointSemanticNavigationRoute, page: PointSemanticPageDeclaration): ClientRouteSpec {
	const pageFunctionName = semanticFunctionName(page.name, "page", "page");
	const wrapperName = `${toPascalCase(toIdentifier(route.pageName))}Route`;
	return {
		path: route.path,
		wrapperName,
		pageFunctionName,
		pathParams: navigationPathParamInputs(route.path, page),
		pageInputs: page.inputs,
	};
}

function emitPathParamExpression(param: PointSemanticBinding, paramName: string): string {
	if (param.type.name === "Int") {
		return `Number.parseInt(${paramName} ?? "", 10)`;
	}
	return `${paramName} ?? ""`;
}

function emitDefaultExpression(type: PointSemanticTypeExpression, records: Map<string, Map<string, string>>): string {
	if (type.name === "Text") return '""';
	if (type.name === "Bool") return "false";
	if (type.name === "Int" || type.name === "Float") return "0";
	if (type.name === "List") return "[]";
	const recordFields = records.get(type.name);
	if (recordFields) {
		const fields = [...recordFields.values()]
			.map((fieldName) => {
				const lower = fieldName.toLowerCase();
				const isBool = lower.includes("enabled") || lower.startsWith("has") || lower.startsWith("is");
				return `${fieldName}: ${isBool ? "false" : '""'}`;
			})
			.join(", ");
		return `{ ${fields} }`;
	}
	return "{}";
}

function emitRouteWrapper(spec: ClientRouteSpec, records: Map<string, Map<string, string>>): string[] {
	const pathParamLabels = new Set(spec.pathParams.map((input) => input.label));
	const localInputs = spec.pageInputs.filter((input) => !pathParamLabels.has(input.label));
	const handlerInputs = localInputs.filter((input) => input.type.name === "Handler" && input.type.args.length === 1);
	const handledLabels = new Set<string>();

	const lines = [`function ${spec.wrapperName}() {`];
	if (spec.pathParams.length > 0) {
		lines.push("  const params = useParams();");
		for (const param of spec.pathParams) {
			const paramName = toPathSegment(param.label);
			lines.push(`  const ${toIdentifier(param.label)} = ${emitPathParamExpression(param, `params.${paramName}`)};`);
		}
	}

	for (const handler of handlerInputs) {
		const recordType = handler.type.args[0]!;
		const recordInput = localInputs.find(
			(input) => input.type.name === recordType.name && input.type.args.length === 0 && !handledLabels.has(input.label),
		);
		if (!recordInput) continue;
		const stateName = toIdentifier(recordInput.label);
		const setterName = toIdentifier(handler.label);
		lines.push(
			`  const [${stateName}, ${setterName}] = React.useState<${recordType.name}>(${emitDefaultExpression(recordType, records)});`,
		);
		handledLabels.add(recordInput.label);
		handledLabels.add(handler.label);
	}

	for (const input of localInputs) {
		if (handledLabels.has(input.label)) continue;
		if (input.type.name === "Handler") continue;
		const stateName = toIdentifier(input.label);
		lines.push(`  const [${stateName}] = React.useState(${emitDefaultExpression(input.type, records)});`);
		handledLabels.add(input.label);
	}

	const args = spec.pageInputs.map((input) => toIdentifier(input.label)).join(", ");
	lines.push(`  return ${spec.pageFunctionName}(${args});`, "}");
	return lines;
}

export function emitClientNavigationRuntime(
	navigation: PointSemanticNavigationDeclaration,
	pages: Map<string, PointSemanticPageDeclaration>,
	records: Map<string, Map<string, string>>,
): string[] {
	const specs = navigation.routes.map((route) => {
		const page = pages.get(route.pageName);
		if (!page) throw new Error(`Unknown page ${route.pageName} in navigation ${navigation.name}`);
		return clientRouteSpec(route, page);
	});
	const routerName = `${toPascalCase(navigation.name)}Router`;
	const mountName = `mount${toPascalCase(navigation.name)}`;
	const lines: string[] = [];
	for (const spec of specs) {
		lines.push(...emitRouteWrapper(spec, records), "");
	}
	const routeEntries = specs.map((spec) => `{ path: ${JSON.stringify(spec.path)}, element: <${spec.wrapperName} /> }`).join(",\n  ");
	lines.push(`export const ${routerName} = createBrowserRouter([`, `  ${routeEntries}`, "]);", "");
	if (navigation.bootstrapRouter) {
		lines.push(`export function ${mountName}(): JSX.Element {`, `  return <RouterProvider router={${routerName}} />;`, "}");
	}
	return lines;
}
