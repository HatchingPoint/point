import { EnqueueJobForm } from "../../components/EnqueueJobForm";
import { OpsNav } from "../../components/OpsNav";

export default function EnqueuePage() {
	return (
		<section>
			<aside>
				<OpsNav />
			</aside>
			<h1>Enqueue</h1>
			<p>Add a job to the queue</p>
			<EnqueueJobForm />
		</section>
	);
}
