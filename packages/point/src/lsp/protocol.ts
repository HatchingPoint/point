import { stdin, stdout } from "node:process";

export interface JsonRpcMessage {
	jsonrpc: "2.0";
	id?: number | string | null;
	method?: string;
	params?: unknown;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
}

export class LspReader {
	private buffer = Buffer.alloc(0);

	async *messages(): AsyncGenerator<JsonRpcMessage> {
		for (;;) {
			const message = this.tryReadMessage();
			if (message) {
				yield message;
				continue;
			}
			const chunk = await readStdinChunk();
			if (chunk.length === 0) return;
			this.buffer = Buffer.concat([this.buffer, chunk]);
		}
	}

	private tryReadMessage(): JsonRpcMessage | null {
		const headerEnd = this.buffer.indexOf("\r\n\r\n");
		if (headerEnd === -1) return null;
		const header = this.buffer.subarray(0, headerEnd).toString("utf8");
		const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
		if (!lengthMatch) {
			this.buffer = this.buffer.subarray(headerEnd + 4);
			return null;
		}
		const contentLength = Number(lengthMatch[1]);
		const bodyStart = headerEnd + 4;
		if (this.buffer.length < bodyStart + contentLength) return null;
		const body = this.buffer.subarray(bodyStart, bodyStart + contentLength).toString("utf8");
		this.buffer = this.buffer.subarray(bodyStart + contentLength);
		return JSON.parse(body) as JsonRpcMessage;
	}
}

export function writeMessage(message: JsonRpcMessage): void {
	const body = JSON.stringify(message);
	const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
	stdout.write(header + body);
}

function readStdinChunk(): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const onReadable = () => {
			const chunk = stdin.read() as Buffer | null;
			if (chunk) {
				cleanup();
				resolve(chunk);
			}
		};
		const onEnd = () => {
			cleanup();
			resolve(Buffer.alloc(0));
		};
		const onError = (error: Error) => {
			cleanup();
			reject(error);
		};
		const cleanup = () => {
			stdin.off("readable", onReadable);
			stdin.off("end", onEnd);
			stdin.off("error", onError);
		};
		stdin.on("readable", onReadable);
		stdin.on("end", onEnd);
		stdin.on("error", onError);
		if (stdin.isPaused()) stdin.resume();
	});
}
