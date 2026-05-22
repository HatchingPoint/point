---
title: Workflows
description: workflow, schedule, and command blocks for orchestration and CLI entrypoints.
quadrant: Reference
---

## Summary

Workflow blocks orchestrate async steps; schedules run actions on an interval; commands define CLI entrypoints for `point run`.

## workflow

Multi-step async orchestration. See `examples/workflow.point` and `examples/workflow-retry.point` for retry, timeout, and `on failure` policies.

## schedule

Periodic jobs that call actions on an interval:

```point
module Jobs

action health check
  output status: Text
  touches none
  return "ok"

schedule health check tick
  every 5 minutes
  call health check
```

See `examples/tools/health-check-schedule.point`.

For production cron, prefer the host scheduler and call a `command` or HTTP route — schedules emit `setInterval` for development and demos.

## command

CLI entrypoints for `point run`:

`point run` prefers zero-argument `command` blocks, then `main`, then other zero-arg entrypoints. See `examples/command.point` and `examples/app/todo.point`.

```point
command greet
  output message: Text
  return "Hello from Point"
```

## Common mistakes

- Defining a run entrypoint with required inputs (run needs zero-arg command/action/calculation)
- Forgetting `await` between workflow steps that call actions

## See also

- [Effects](/point/language/effects)
- [Agents](/point/language/agents)
- [Run, test, REPL](/point/toolchain/run-test-repl)
