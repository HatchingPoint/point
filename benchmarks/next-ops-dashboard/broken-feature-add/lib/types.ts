export type JobRow = {
	name: string;
	status: string;
	score: number;
};

export type JobMetric = {
	label: string;
	value: number;
};

export type OpsDashboardData = {
	jobs: JobRow[];
	metrics: JobMetric[];
};

export type EnqueueBody = {
	name: string;
};

export type Column = "name" | "status" | "score";

export type PositiveInteger = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 15 | 20 | 25 | 50;
