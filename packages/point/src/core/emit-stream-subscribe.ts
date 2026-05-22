import type { PointCoreExpression, PointSemanticStreamSubscribe } from "./ast.ts";
import { emitViewRenderFragment } from "./emit-data-load.ts";
import { toPascalCase } from "../semantic/naming.ts";

function emitExpression(expression: PointCoreExpression): string {
	if (expression.kind === "literal") {
		if (typeof expression.value === "string") return JSON.stringify(expression.value);
		return String(expression.value);
	}
	if (expression.kind === "identifier") return expression.name;
	if (expression.kind === "binary") {
		const op = expression.operator === "and" ? "&&" : expression.operator === "or" ? "||" : expression.operator;
		return `(${emitExpression(expression.left)} ${op} ${emitExpression(expression.right)})`;
	}
	if (expression.kind === "property") return `${emitExpression(expression.target)}.${expression.name}`;
	if (expression.kind === "call") {
		return `${expression.callee}(${expression.args.map(emitExpression).join(", ")})`;
	}
	if (expression.kind === "list") return `[${expression.items.map(emitExpression).join(", ")}]`;
	if (expression.kind === "record") {
		return `{ ${expression.fields.map((field) => `${field.name}: ${emitExpression(field.value)}`).join(", ")} }`;
	}
	return "null";
}

function emitStateReturn(expression: PointCoreExpression | undefined, className?: string, style?: string[]): string[] | null {
	if (!expression) return null;
	return [`return ${emitViewRenderFragment(expression, className, style)};`];
}

export function emitStreamSubscribeHookLines(spec: PointSemanticStreamSubscribe, paramNames: string[]): string[] {
	const deps = [...paramNames];
	if (spec.messageCallback && !deps.includes(spec.messageCallback)) deps.push(spec.messageCallback);
	const depsArray = deps.length > 0 ? `[${deps.join(", ")}]` : "[]";
	const messageType = toPascalCase(spec.messageTypeName);
	const callbackLine = spec.messageCallback
		? `        ${spec.messageCallback}(parsed);`
		: "";
	return [
		`const [${spec.bindingName}, set${capitalize(spec.bindingName)}] = React.useState<${messageType}[]>([]);`,
		"const [connecting, setConnecting] = React.useState(true);",
		"const [connected, setConnected] = React.useState(false);",
		"const [error, setError] = React.useState<unknown>(null);",
		"React.useEffect(() => {",
		"  const protocol = window.location.protocol === \"https:\" ? \"wss:\" : \"ws:\";",
		`  const ws = new WebSocket(\`\${protocol}//\${window.location.host}${spec.path}\`);`,
		"  setConnecting(true);",
		"  setError(null);",
		"  ws.onopen = () => {",
		"    setConnecting(false);",
		"    setConnected(true);",
		"  };",
		"  ws.onmessage = (event) => {",
		"    try {",
		"      const parsed = JSON.parse(String(event.data)) as " + messageType + ";",
		`      set${capitalize(spec.bindingName)}((previous) => [...previous, parsed]);`,
		callbackLine,
		"    } catch {",
		"      /* ignore non-JSON frames */",
		"    }",
		"  };",
		"  ws.onerror = () => {",
		"    setError(new Error(\"WebSocket connection failed\"));",
		"    setConnecting(false);",
		"  };",
		"  ws.onclose = () => {",
		"    setConnected(false);",
		"  };",
		"  return () => { ws.close(); };",
		`}, ${depsArray});`,
	];
}

export function emitStreamSubscribeGuardLines(spec: PointSemanticStreamSubscribe): string[] {
	const lines: string[] = [];
	const connectingReturn = emitStateReturn(spec.connecting, spec.connectingClassName, spec.connectingStyle);
	if (connectingReturn) lines.push("if (connecting) {", ...indent(connectingReturn), "}");
	const errorReturn = emitStateReturn(spec.error, spec.errorClassName, spec.errorStyle);
	if (errorReturn) lines.push("if (error) {", ...indent(errorReturn), "}");
	const disconnectedReturn = emitStateReturn(spec.disconnected, spec.disconnectedClassName, spec.disconnectedStyle);
	if (disconnectedReturn) {
		lines.push("if (!connected && !connecting) {", ...indent(disconnectedReturn), "}");
	}
	return lines;
}

export function wrapBodyWithStreamSubscribe(bodyLines: string[], spec: PointSemanticStreamSubscribe, paramNames: string[]): string[] {
	return [...emitStreamSubscribeHookLines(spec, paramNames), ...emitStreamSubscribeGuardLines(spec), ...bodyLines];
}

function capitalize(label: string): string {
	return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
}

function indent(lines: string[]): string[] {
	return lines.map((line) => `  ${line}`);
}
