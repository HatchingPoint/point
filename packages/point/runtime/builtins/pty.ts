export type PointRuntimePtyError = { message: string };

export type PointRuntimePtyHandle = { id: string };

export type PointRuntimePtyOutput = {
	stderr: string;
	exitCode: number;
};

type PtyEvent = { kind: "bytes"; bytes: Uint8Array } | { kind: "close" };

interface PtyDriver {
	readonly id: string;
	write(text: string): void | Promise<void>;
	waitBytes(): Promise<Uint8Array | null>;
	stderrPromise: Promise<string>;
	exitPromise: Promise<number>;
	finalizeWriter(): void;
	dispose(): void;
}

const sessions = new Map<string, PtyDriver>();

function parseEnvEntries(entries: string[]): Record<string, string> {
	const env = { ...process.env } as Record<string, string>;
	for (const entry of entries) {
		const separator = entry.indexOf("=");
		if (separator <= 0) continue;
		env[entry.slice(0, separator)] = entry.slice(separator + 1);
	}
	return env;
}

function normalizeCommand(command: string, args: string[]): string[] {
	if (process.platform !== "win32") return [command, ...args];
	if (command.toLowerCase() === "echo") return ["cmd", "/d", "/s", "/c", `echo ${args.join(" ")}`];
	if (command === "sh") return ["bash", ...args];
	return [command, ...args];
}

function normalizeOutput(value: string): string {
	return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function splitStdoutLines(text: string, carry: string): { lines: string[]; remainder: string } {
	const combined = `${carry}${text.replace(/\r\n/g, "\n")}`;
	const parts = combined.split("\n");
	const remainder = parts.pop() ?? "";
	return {
		lines: parts.map((line) => line.replace(/\r$/, "")),
		remainder,
	};
}

function createByteQueue(onFirstWait?: () => void): {
	push(ev: PtyEvent): void;
	waitBytes(): Promise<Uint8Array | null>;
} {
	const events: PtyEvent[] = [];
	const waiters: Array<() => void> = [];
	const notify = (): void => {
		const waiter = waiters.shift();
		if (waiter) waiter();
	};
	let firstWaitDone = false;
	const push = (ev: PtyEvent): void => {
		events.push(ev);
		notify();
	};
	const waitBytes = (): Promise<Uint8Array | null> =>
		new Promise((resolve) => {
			if (!firstWaitDone) {
				firstWaitDone = true;
				onFirstWait?.();
			}
			const drain = (): void => {
				const next = events.shift();
				if (!next) {
					waiters.push(drain);
					return;
				}
				resolve(next.kind === "close" ? null : next.bytes);
			};
			drain();
		});
	return { push, waitBytes };
}

function trySpawnPtyDriver(id: string, command: string, args: string[], env: Record<string, string>): PtyDriver | null {
	const { push, waitBytes } = createByteQueue();
	let proc: ReturnType<typeof Bun.spawn> | null = null;
	try {
		proc = Bun.spawn(normalizeCommand(command, args), {
			env,
			terminal: {
				cols: 120,
				rows: 40,
				data: (_term, data): void => {
					const bytes =
						data instanceof Uint8Array
							? data
							: data instanceof ArrayBuffer
								? new Uint8Array(data)
								: new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
					if (bytes.byteLength > 0) push({ kind: "bytes", bytes });
				},
			},
		});
	} catch {
		return null;
	}
	const term = proc?.terminal;
	if (proc === null || term === undefined) return null;
	proc.exited.then(
		() => push({ kind: "close" }),
		() => push({ kind: "close" }),
	);
	let writerClosed = false;
	const finalizeWriter = (): void => {
		if (writerClosed || !proc) return;
		writerClosed = true;
		try {
			proc.terminal?.close?.();
		} catch {
			/* ignore */
		}
	};
	let disposed = false;
	const dispose = (): void => {
		if (disposed || !proc) return;
		disposed = true;
		try {
			proc.kill();
		} catch {
			/* ignore */
		}
		push({ kind: "close" });
	};
	return {
		id,
		write(text: string): void {
			term.write(text);
		},
		waitBytes,
		stderrPromise: Promise.resolve(""),
		exitPromise: proc.exited,
		finalizeWriter,
		dispose,
	};
}

function spawnPipeDriver(id: string, command: string, args: string[], env: Record<string, string>): PtyDriver | PointRuntimePtyError {
	let proc: ReturnType<typeof Bun.spawn>;
	try {
		proc = Bun.spawn(normalizeCommand(command, args), {
			env,
			stdin: "pipe",
			stdout: "pipe",
			stderr: "pipe",
		});
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
	const { push, waitBytes } = createByteQueue(() => {
		try {
			proc.stdin.flush?.();
		} catch {
			/* ignore */
		}
	});
	const stderrPromise = new Response(proc.stderr).text();
	void (async () => {
		const reader = proc.stdout.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value && value.byteLength > 0) push({ kind: "bytes", bytes: value });
			}
		} finally {
			push({ kind: "close" });
		}
	})().catch(() => push({ kind: "close" }));
	proc.exited.catch(() => push({ kind: "close" }));
	let writerClosed = false;
	const finalizeWriter = (): void => {
		if (writerClosed) return;
		writerClosed = true;
		try {
			proc.stdin.end();
		} catch {
			/* ignore */
		}
	};
	let disposed = false;
	const dispose = (): void => {
		if (disposed) return;
		disposed = true;
		proc.kill();
		push({ kind: "close" });
	};
	return {
		id,
		write(text: string): void {
			proc.stdin.write(text);
		},
		waitBytes,
		stderrPromise,
		exitPromise: proc.exited,
		finalizeWriter,
		dispose,
	};
}

export async function ptySpawn(command: string, args: string[], envEntries: string[]): Promise<PointRuntimePtyHandle | PointRuntimePtyError> {
	const id = crypto.randomUUID();
	const env = parseEnvEntries(envEntries);
	let driver: PtyDriver | null = null;
	if (process.platform !== "win32") driver = trySpawnPtyDriver(id, command, args, env);
	if (driver === null) {
		const piped = spawnPipeDriver(id, command, args, env);
		if ("message" in piped) return piped;
		driver = piped;
	}
	sessions.set(driver.id, driver);
	return { id };
}

export async function ptyWrite(handle: PointRuntimePtyHandle, input: string): Promise<void | PointRuntimePtyError> {
	try {
		const driver = sessions.get(handle.id);
		if (!driver) return { message: "Unknown or closed pty handle" };
		await driver.write(input);
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export async function* ptyStreamLines(handle: PointRuntimePtyHandle): AsyncGenerator<string, PointRuntimePtyOutput | PointRuntimePtyError, unknown> {
	const driver = sessions.get(handle.id);
	if (!driver) return { message: "Unknown or closed pty handle" };
	const decoder = new TextDecoder();
	let remainder = "";
	try {
		while (true) {
			const chunk = await driver.waitBytes();
			if (chunk === null) break;
			const text = decoder.decode(chunk, { stream: true });
			const split = splitStdoutLines(text, remainder);
			remainder = split.remainder;
			for (const line of split.lines) yield line;
		}
		remainder += decoder.decode();
		if (remainder.length > 0) yield remainder.replace(/\r$/, "");
		const [stderr, exitCode] = await Promise.all([driver.stderrPromise, driver.exitPromise]);
		driver.finalizeWriter();
		sessions.delete(handle.id);
		return { stderr: normalizeOutput(stderr), exitCode };
	} catch (error) {
		driver.dispose();
		sessions.delete(handle.id);
		return { message: error instanceof Error ? error.message : String(error) };
	}
}
