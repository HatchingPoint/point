import { OpsDashboard } from "../../components/OpsDashboard";
import { OpsNav } from "../../components/OpsNav";

export default function DashboardPage() {
	return (
		<section>
			<aside>
				<OpsNav />
			</aside>
			<h1>Ops dashboard</h1>
			<p>Chart + datagrid overview</p>
			<OpsDashboard />
		</section>
	);
}
