import type { PointSemanticStreamSubscribe } from "./ast.ts";
import { emitStreamSubscribeGuardLines, emitStreamSubscribeHookLines } from "./emit-stream-subscribe.ts";
import { toPascalCase } from "../semantic/naming.ts";

/** WebSocket hooks + guarded terminal `<pre>` for stream-backed operator views (Phase 54). */
export function wrapBodyWithTerminalStreamSubscribe(
	spec: PointSemanticStreamSubscribe,
	paramNames: string[],
): string[] {
	const messageType = toPascalCase(spec.messageTypeName);
	const lines = [
		...emitStreamSubscribeHookLines(spec, paramNames),
		...emitStreamSubscribeGuardLines(spec),
		"  return (",
		`    <pre className="point-terminal" role="log" aria-live="polite">`,
		`      {messages.map((message: ${messageType}, index: number) => {`,
		`        const chunk = message as ${messageType} & {`,
		`          stream?: string;`,
		`          channel?: string;`,
		`          line?: string;`,
		`          text?: string;`,
		`        };`,
		`        const text =`,
		`          typeof chunk.line === "string"`,
		`            ? chunk.line`,
		`            : typeof chunk.text === "string"`,
		`              ? chunk.text`,
		`              : JSON.stringify(message);`,
		`        const stream =`,
		`          typeof chunk.stream === "string"`,
		`            ? chunk.stream`,
		`            : typeof chunk.channel === "string"`,
		`              ? chunk.channel`,
		`              : "stdout";`,
		`        const stderrish =`,
		`          stream === "stderr" || stream === "err" ? " point-terminal-stderr" : "";`,
		`        const exitish = stream === "exit" ? " point-terminal-exit" : "";`,
		`        const lineClass = stderrish || exitish || "";`,
		`        return (`,
		`          <div key={index} className={"point-terminal-line" + lineClass}>{text}</div>`,
		`        );`,
		`      })}`,
		`    </pre>`,
		"  );",
	];
	return lines;
}
