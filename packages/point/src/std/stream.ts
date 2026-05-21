export type PointStdError = { message: string };

type StreamSource = ReadableStream<Uint8Array> | string;
type StreamSink = WritableStream<Uint8Array> | string;

async function readSourceText(source: StreamSource): Promise<string | PointStdError> {
	if (typeof source === "string") {
		return source;
	}
	const reader = source.getReader();
	const decoder = new TextDecoder();
	let text = "";
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			text += decoder.decode(value, { stream: true });
		}
		text += decoder.decode();
		return text;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	} finally {
		reader.releaseLock();
	}
}

function splitLines(text: string): string[] {
	const normalized = text.replace(/\r\n/g, "\n");
	if (normalized.length === 0) {
		return [];
	}
	const lines = normalized.split("\n");
	if (lines.at(-1) === "") {
		lines.pop();
	}
	return lines;
}

export function streamJoinLines(lines: string[]): string {
	if (lines.length === 0) {
		return "";
	}
	return `${lines.join("\n")}\n`;
}

export async function streamReadText(source: StreamSource): Promise<string | PointStdError> {
	return readSourceText(source);
}

export async function streamWriteText(
	sink: StreamSink,
	contents: string,
): Promise<void | PointStdError> {
	if (typeof sink === "string") {
		return undefined;
	}
	const writer = sink.getWriter();
	const encoder = new TextEncoder();
	try {
		await writer.write(encoder.encode(contents));
		await writer.close();
		return undefined;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	} finally {
		writer.releaseLock();
	}
}

export async function streamReadLines(
	source: StreamSource,
): Promise<string[] | PointStdError> {
	const text = await readSourceText(source);
	if (typeof text !== "string") {
		return text;
	}
	return splitLines(text);
}

export async function streamWriteLines(
	sink: StreamSink,
	lines: string[],
): Promise<void | PointStdError> {
	return streamWriteText(sink, streamJoinLines(lines));
}
