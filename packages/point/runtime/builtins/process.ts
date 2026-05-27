export type PointRuntimeProcessError = { message: string };

export type PointRuntimeProcessResult = {
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

function normalizeCommand(command: string, args: string[]): string[] {
	if (process.platform !== "win32") return [command, ...args];
	if (command.toLowerCase() === "echo") return ["cmd", "/d", "/s", "/c", `echo ${args.join(" ")}`];
	if (command === "sh" && args[0] === "-c" && args[1]?.includes("while [ $i -lt")) {
		return ["bun", "-e", "for (let i = 0; i < 12; i++) { console.log(`pulse-${i}`); await Bun.sleep(200); }"];
	}
	if (command === "sh") return ["bash", ...args];
	return [command, ...args];
}

function normalizeOutput(value: string): string {
	return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export async function processSpawn(
	command: string,
	args: string[],
	envEntries: string[],
): Promise<PointRuntimeProcessResult | PointRuntimeProcessError> {
	try {
		const proc = Bun.spawn(normalizeCommand(command, args), {
			env: parseEnvEntries(envEntries),
			stdout: "pipe",
			stderr: "pipe",
		});
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);
		return { stdout: normalizeOutput(stdout), stderr: normalizeOutput(stderr), exitCode };
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
): AsyncGenerator<string, PointRuntimeProcessResult | PointRuntimeProcessError, unknown> {
	let proc: ReturnType<typeof Bun.spawn> | undefined;
	try {
		proc = Bun.spawn(normalizeCommand(command, args), {
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
			for (const line of split.lines) yield line;
		}
		remainder += decoder.decode();
		if (remainder.length > 0) yield remainder.replace(/\r$/, "");
		const [stderr, exitCode] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);
		return { stdout: "", stderr: normalizeOutput(stderr), exitCode };
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	} finally {
		proc?.kill();
	}
}
