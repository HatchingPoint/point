/** Format integer cents as USD with two decimal places (e.g. 1005 → "$10.05"). */
export function formatCentsUsd(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	const abs = Math.abs(Math.trunc(cents));
	const dollars = Math.floor(abs / 100);
	const remainder = abs % 100;
	return `${sign}$${dollars}.${String(remainder).padStart(2, "0")}`;
}
