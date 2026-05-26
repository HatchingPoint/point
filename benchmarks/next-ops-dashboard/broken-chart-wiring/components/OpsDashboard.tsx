"use client";

import { useEffect, useState } from "react";
import { fetchOpsDashboard } from "../lib/fetchOpsDashboard";
import type { Column, JobMetric, PositiveInteger } from "../lib/types";

export function OpsDashboard() {
	const [metrics, setMetrics] = useState<JobMetric[]>([]);
	const [jobs, setJobs] = useState<{ name: string; status: string; score: number }[]>([]);
	const refetch = () =>
		fetchOpsDashboard().then((data) => {
			setMetrics(data.metrics);
			setJobs(data.jobs);
		});

	useEffect(() => {
		refetch();
		const timer = setInterval(refetch, 15000);
		return () => clearInterval(timer);
	}, []);

	const sortBy: Column = "score";
	const filterColumn: Column = "name";
	const pageSize: PositiveInteger = 6;

	return (
		<section>
			<MetricsChart metrics={metrics} dataKey="title" />
			<JobsGrid jobs={jobs} sortBy={sortBy} filterColumn={filterColumn} pageSize={pageSize} />
		</section>
	);
}

function MetricsChart({ metrics, dataKey }: { metrics: JobMetric[]; dataKey: "label" | "title" }) {
	return (
		<ul>
			{metrics.map((metric) => (
				<li key={metric.label}>{metric[dataKey as "label"]}</li>
			))}
		</ul>
	);
}

function JobsGrid({
	jobs,
	sortBy,
	filterColumn,
	pageSize,
}: {
	jobs: { name: string; status: string; score: number }[];
	sortBy: Column;
	filterColumn: Column;
	pageSize: PositiveInteger;
}) {
	return (
		<table>
			<tbody>
				{jobs.map((job) => (
					<tr key={job.name}>
						<td>{job.name}</td>
						<td>{job.status}</td>
						<td>{job.score}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
