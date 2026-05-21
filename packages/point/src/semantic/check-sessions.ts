import type { PointCoreDiagnostic } from "../core/check.ts";
import type { PointSourceSpan } from "../core/ast.ts";
import type {
	PointSemanticActionDeclaration,
	PointSemanticProgram,
	PointSemanticRecordDeclaration,
	PointSemanticSessionDeclaration,
	PointSemanticTypeExpression,
} from "./ast.ts";

export function checkSemanticSessions(program: PointSemanticProgram): PointCoreDiagnostic[] {
	const diagnostics: PointCoreDiagnostic[] = [];
	const moduleName = program.module ?? "anonymous";
	const records = new Map(
		program.declarations
			.filter((declaration): declaration is PointSemanticRecordDeclaration => declaration.kind === "record")
			.map((declaration) => [declaration.name, declaration]),
	);
	const actions = new Map(
		program.declarations
			.filter((declaration): declaration is PointSemanticActionDeclaration => declaration.kind === "action")
			.map((declaration) => [declaration.name, declaration]),
	);

	for (const declaration of program.declarations) {
		if (declaration.kind !== "session") continue;
		const record = records.get(declaration.messageRecordName);
		if (!record) {
			diagnostics.push(
				sessionDiagnostic(
					"unknown-session-message-record",
					`Unknown message record ${declaration.messageRecordName} for session ${declaration.name}`,
					moduleName,
					declaration,
					`Declare record ${declaration.messageRecordName} before session ${declaration.name}.`,
				),
			);
			continue;
		}
		const roleField = record.fields.find((field) => field.label === "role");
		const contentField = record.fields.find((field) => field.label === "content");
		if (!roleField || !contentField) {
			diagnostics.push(
				sessionDiagnostic(
					"invalid-session-message-record",
					`Session message record ${declaration.messageRecordName} requires role and content fields`,
					moduleName,
					declaration,
					`Add role and content fields to record ${declaration.messageRecordName}.`,
				),
			);
		}
		if (!isListOfRecord(declaration.messagesField.type, declaration.messageRecordName)) {
			diagnostics.push(
				sessionDiagnostic(
					"invalid-session-messages-type",
					`Session ${declaration.name} messages field must be List<${declaration.messageRecordName}>`,
					moduleName,
					declaration,
					`Use "messages <label>: List<${declaration.messageRecordName}>".`,
				),
			);
		}
		const streamAction = actions.get(declaration.streamActionName);
		if (!streamAction) {
			diagnostics.push(
				sessionDiagnostic(
					"unknown-session-stream-action",
					`Unknown stream action ${declaration.streamActionName} for session ${declaration.name}`,
					moduleName,
					declaration,
					`Declare action ${declaration.streamActionName} before binding stream response from action.`,
				),
			);
			continue;
		}
		const outputType = typeLabel(streamAction.output.type);
		if (!outputType.includes("Text")) {
			diagnostics.push(
				sessionDiagnostic(
					"invalid-session-stream-output",
					`Session stream action ${declaration.streamActionName} must return Text or Error`,
					moduleName,
					declaration,
					`Set output text: Text or Error on action ${declaration.streamActionName}.`,
				),
			);
		}
	}

	return diagnostics;
}

function isListOfRecord(type: PointSemanticTypeExpression, recordName: string): boolean {
	return type.name === "List" && type.args.length === 1 && type.args[0]?.name === recordName;
}

function typeLabel(type: PointSemanticTypeExpression): string {
	if (type.args.length === 0) return type.name;
	return `${type.name}<${type.args.map(typeLabel).join(", ")}>`;
}

function sessionDiagnostic(
	code: string,
	message: string,
	moduleName: string,
	session: PointSemanticSessionDeclaration,
	repair: string,
	span?: PointSourceSpan,
): PointCoreDiagnostic {
	return {
		code,
		message,
		path: `session.${session.name}`,
		ref: `point://semantic/${moduleName}/session.${session.name}`,
		severity: "error",
		span: span ?? session.span ?? null,
		repair,
	};
}
