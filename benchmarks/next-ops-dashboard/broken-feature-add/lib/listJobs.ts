import type { JobRow } from "./types";

export async function listJobs(): Promise<JobRow[]> {
	return [
		{ name: "sync", status: "ok", score: 95 },
		{ name: "import", status: "warn", score: 72 },
	];
}
