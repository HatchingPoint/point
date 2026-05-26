import Link from "next/link";

export function OpsNav() {
	return (
		<nav>
			<Link href="/">Dashboard</Link>
			<Link href="/enqueue">Enqueue</Link>
		</nav>
	);
}
