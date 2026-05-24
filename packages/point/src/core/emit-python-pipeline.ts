const PIPELINE_EVENT_SCHEMA = "point.pipeline.event.v1";

export function emitPythonPipelineHelpers(): string[] {
	return [
		"import time as _point_time",
		"",
		"def point_pipeline_now() -> float:",
		"    return _point_time.time() * 1000",
		"",
		"def point_pipeline_should_log(log) -> bool:",
		"    return log is not None",
		"",
		"def point_pipeline_emit_log(log, pipeline: str, step: str, phase: str, ok=None, error=None) -> None:",
		"    if not point_pipeline_should_log(log):",
		"        return",
		"    event: dict[str, object] = {",
		`        "schemaVersion": "${PIPELINE_EVENT_SCHEMA}",`,
		'        "pipeline": pipeline,',
		'        "step": step,',
		'        "phase": phase,',
		'        "at": point_pipeline_now(),',
		"    }",
		"    if ok is True:",
		'        event["ok"] = True',
		"    if ok is False:",
		'        event["ok"] = False',
		'        event["error"] = error if error is not None else {"message": ""}',
		"    log(event)",
		"",
	];
}
