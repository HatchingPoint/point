import type { OpsDashboardData } from "./types";

export async function fetchOpsDashboard(): Promise<OpsDashboardData> {
	return {
		jobs: [
			{ name: "sync", status: "ok", score: 95 },
			{ name: "import", status: "warn", score: 72 },
		],
		metrics: [
			{ label: "Jobs", value: 12 },
			{ label: "Errors", value: 3 },
		],
	};
}
