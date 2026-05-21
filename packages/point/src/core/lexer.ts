import type { PointSourceSpan } from "./ast.ts";

export type PointCoreTokenType =
	| "identifier"
	| "number"
	| "string"
	| "leftBrace"
	| "rightBrace"
	| "leftBracket"
	| "rightBracket"
	| "leftParen"
	| "rightParen"
	| "comma"
	| "colon"
	| "dot"
	| "equals"
	| "plusEquals"
	| "minusEquals"
	| "equalsEquals"
	| "bangEquals"
	| "less"
	| "lessEquals"
	| "greater"
	| "greaterEquals"
	| "plus"
	| "minus"
	| "star"
	| "slash"
	| "eof";

export interface PointCoreToken {
	type: PointCoreTokenType;
	value: string;
	span: PointSourceSpan;
}

export class PointCoreLexerError extends Error {
	constructor(message: string, public readonly span: PointSourceSpan) {
		super(`${message} at ${span.start.line}:${span.start.column}`);
		this.name = "PointCoreLexerError";
	}
}

export function lexPointCore(source: string): PointCoreToken[] {
	const lexer = new CoreLexer(source);
	return lexer.lex();
}

class CoreLexer {
	private index = 0;
	private line = 1;
	private column = 1;
	private readonly tokens: PointCoreToken[] = [];

	constructor(private readonly source: string) {}

	lex(): PointCoreToken[] {
		while (!this.done()) {
			const char = this.peek();
			if (/\s/.test(char)) {
				this.advance();
				continue;
			}
			if (char === "/" && this.peek(1) === "/") {
				while (!this.done() && this.peek() !== "\n") this.advance();
				continue;
			}
			if (char === "{") {
				this.push("leftBrace", this.advance());
				continue;
			}
			if (char === "}") {
				this.push("rightBrace", this.advance());
				continue;
			}
			if (char === "(") {
				this.push("leftParen", this.advance());
				continue;
			}
			if (char === "[") {
				this.push("leftBracket", this.advance());
				continue;
			}
			if (char === "]") {
				this.push("rightBracket", this.advance());
				continue;
			}
			if (char === ")") {
				this.push("rightParen", this.advance());
				continue;
			}
			if (char === ",") {
				this.push("comma", this.advance());
				continue;
			}
			if (char === ":") {
				this.push("colon", this.advance());
				continue;
			}
			if (char === ".") {
				this.push("dot", this.advance());
				continue;
			}
			if (char === "=") {
				if (this.peek(1) === "=") {
					this.push("equalsEquals", `${this.advance()}${this.advance()}`);
					continue;
				}
				this.push("equals", this.advance());
				continue;
			}
			if (char === "!" && this.peek(1) === "=") {
				this.push("bangEquals", `${this.advance()}${this.advance()}`);
				continue;
			}
			if (char === "<") {
				if (this.peek(1) === "=") {
					this.push("lessEquals", `${this.advance()}${this.advance()}`);
					continue;
				}
				this.push("less", this.advance());
				continue;
			}
			if (char === ">") {
				if (this.peek(1) === "=") {
					this.push("greaterEquals", `${this.advance()}${this.advance()}`);
					continue;
				}
				this.push("greater", this.advance());
				continue;
			}
			if (char === "+") {
				if (this.peek(1) === "=") {
					this.push("plusEquals", `${this.advance()}${this.advance()}`);
					continue;
				}
				this.push("plus", this.advance());
				continue;
			}
			if (char === "-") {
				if (this.peek(1) === "=") {
					this.push("minusEquals", `${this.advance()}${this.advance()}`);
					continue;
				}
				this.push("minus", this.advance());
				continue;
			}
			if (char === "*") {
				this.push("star", this.advance());
				continue;
			}
			if (char === "/") {
				this.push("slash", this.advance());
				continue;
			}
			if (char === "\"") {
				this.readString();
				continue;
			}
			if (/[0-9]/.test(char)) {
				this.readNumber();
				continue;
			}
			if (/[A-Za-z_]/.test(char)) {
				this.readIdentifier();
				continue;
			}
			throw new PointCoreLexerError(`Unexpected character ${JSON.stringify(char)}`, this.spanAt());
		}
		this.tokens.push({ type: "eof", value: "", span: this.spanAt() });
		return this.tokens;
	}

	private readString() {
		const start = this.position();
		this.advance();
		let value = "";
		while (!this.done() && this.peek() !== "\"") {
			const next = this.advance();
			if (next === "\\") {
				const escaped = this.advance();
				value += escaped === "n" ? "\n" : escaped;
			} else {
				value += next;
			}
		}
		if (this.peek() !== "\"") throw new PointCoreLexerError("Unterminated string", { start, end: this.position() });
		this.advance();
		this.tokens.push({ type: "string", value, span: { start, end: this.position() } });
	}

	private readNumber() {
		const start = this.position();
		let value = "";
		while (/[0-9.]/.test(this.peek())) value += this.advance();
		this.tokens.push({ type: "number", value, span: { start, end: this.position() } });
	}

	private readIdentifier() {
		const start = this.position();
		let value = "";
		while (/[A-Za-z0-9_]/.test(this.peek())) value += this.advance();
		this.tokens.push({ type: "identifier", value, span: { start, end: this.position() } });
	}

	private push(type: PointCoreTokenType, value: string) {
		const end = this.position();
		this.tokens.push({
			type,
			value,
			span: {
				start: { line: end.line, column: end.column - value.length, offset: end.offset - value.length },
				end,
			},
		});
	}

	private advance() {
		const char = this.source[this.index++] ?? "";
		if (char === "\n") {
			this.line += 1;
			this.column = 1;
		} else {
			this.column += 1;
		}
		return char;
	}

	private peek(offset = 0) {
		return this.source[this.index + offset] ?? "";
	}

	private done() {
		return this.index >= this.source.length;
	}

	private position() {
		return { line: this.line, column: this.column, offset: this.index };
	}

	private spanAt(): PointSourceSpan {
		const position = this.position();
		return { start: position, end: position };
	}
}
