import { JobsList } from "../../components/JobsList";
import { OpsNav } from "../../components/OpsNav";
import { listJobs } from "../../lib/listJobs";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div>
			<aside>
				<OpsNav />
			</aside>
			<main>{children}</main>
		</div>
	);
}

export async function DashboardPage() {
	const jobs = await listJobs();
	return (
		<section>
			<h1>Ops dashboard</h1>
			<p>Job status overview</p>
			<JobsList jobs={jobs} />
		</section>
	);
}
