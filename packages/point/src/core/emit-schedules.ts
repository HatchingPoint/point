import type { PointCoreFunctionDeclaration, PointCoreParameter } from "./ast.ts";
import type { PointSemanticScheduleDeclaration, PointSemanticScheduleIntervalUnit } from "../semantic/ast.ts";

export function scheduleIntervalMs(amount: number, unit: PointSemanticScheduleIntervalUnit): number {
	switch (unit) {
		case "seconds":
			return amount * 1000;
		case "minutes":
			return amount * 60 * 1000;
		case "hours":
			return amount * 60 * 60 * 1000;
	}
}

export function isScheduleRunCommand(declaration: PointCoreFunctionDeclaration): boolean {
	const name = declaration.semantic?.name ?? "";
	return name.toLowerCase().startsWith("run ");
}

export function emitScheduleRuntime(
	schedules: PointSemanticScheduleDeclaration[],
	actionFnByName: Map<string, string>,
): string[] {
	if (schedules.length === 0) return [];

	const timerLines = schedules.flatMap((schedule) => {
		const fnName = actionFnByName.get(schedule.actionName);
		if (!fnName) return [];
		const ms = scheduleIntervalMs(schedule.interval.amount, schedule.interval.unit);
		const logLabel = schedule.name;
		return [
			`  // schedule ${logLabel}: every ${schedule.interval.amount} ${schedule.interval.unit}`,
			`  void ${fnName}().then((result) => console.log(\`[schedule ${logLabel}]\`, result));`,
			`  timers.push(setInterval(() => { void ${fnName}().then((result) => console.log(\`[schedule ${logLabel}]\`, result)); }, ${ms}));`,
		];
	});

	return [
		"/** Dev periodic scheduler (setInterval). Prefer external cron in production — see docs/site/toolchain/run.md */",
		"export function startPointSchedules() {",
		"  const timers = [];",
		...timerLines,
		"  return () => { for (const timer of timers) clearInterval(timer); };",
		"}",
		"",
		"export function startSchedulesServer() {",
		"  const stop = startPointSchedules();",
		'  console.log("Point schedules started (dev setInterval). Use host cron in production.");',
		"  return { stop };",
		"}",
	];
}

export function emitScheduleRunCommand(declaration: PointCoreFunctionDeclaration): string[] {
	return [
		`export async function ${declaration.name}(${declaration.params.map(emitParam).join(", ")}) {`,
		"  startPointSchedules();",
		'  console.log("Point schedules running. Press Ctrl+C to stop.");',
		"  await new Promise(() => {});",
		"}",
	];
}

function emitParam(param: PointCoreParameter): string {
	return param.name;
}
