type PointStdError = { message: string };

export type ProcessResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

function parseEnvEntries(entries: string[]): Record<string, string> {
	const env = { ...process.env } as Record<string, string>;
	for (const entry of entries) {
		const separator = entry.indexOf("=");
		if (separator <= 0) continue;
		env[entry.slice(0, separator)] = entry.slice(separator + 1);
	}
	return env;
}

export async function processSpawn(
	command: string,
	args: string[],
	envEntries: string[],
): Promise<ProcessResult | PointStdError> {
	try {
		const proc = Bun.spawn([command, ...args], {
			env: parseEnvEntries(envEntries),
			stdout: "pipe",
			stderr: "pipe",
		});
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);
		return { stdout, stderr, exitCode };
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
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

export async function* processStreamLines(
	command: string,
	args: string[],
	envEntries: string[],
): AsyncGenerator<string, ProcessResult | PointStdError, unknown> {
	let proc: ReturnType<typeof Bun.spawn> | undefined;
	try {
		proc = Bun.spawn([command, ...args], {
			env: parseEnvEntries(envEntries),
			stdout: "pipe",
			stderr: "pipe",
		});
		const reader = proc.stdout.getReader();
		const decoder = new TextDecoder();
		let remainder = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const chunk = decoder.decode(value, { stream: true });
			const split = splitStdoutLines(chunk, remainder);
			remainder = split.remainder;
			for (const line of split.lines) {
				yield line;
			}
		}
		remainder += decoder.decode();
		if (remainder.length > 0) {
			yield remainder.replace(/\r$/, "");
		}
		const [stderr, exitCode] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);
		return { stdout: "", stderr, exitCode };
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	} finally {
		proc?.kill();
	}
}
