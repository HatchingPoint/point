import type { JobRow } from "../lib/types";

export function JobsList({ jobs }: { jobs: JobRow[] }) {
	if (jobs.length === 0) return <p>No jobs yet</p>;
	return (
		<ul>
			{jobs.map((job) => (
				<li key={job.name}>
					{job.name} — {job.status}
				</li>
			))}
		</ul>
	);
}
