---
title: point run
description: Execute Point entrypoints and map runtime errors back to semantic source lines.
quadrant: Reference
---

## Summary

Discover commands with `point box`, then launch by name. `point run` checks a `.point` file and executes a zero-input entrypoint. **`point launch`** is the simple path — it requires a command name.

Runtime failures are reported against the original semantic source file.

`point dev` watches the entry module graph, incrementally rechecks and rebuilds JavaScript emit on save, and restarts the Bun dev server (routes, schedules) or re-runs the entry command. `.point` remains the source of truth — no hand-written dev bootstrap.

## Discover and launch

```bash
point box src/app.point
point commands src/app.point
point launch src/app.point admin demo
```

List commands first, copy the run line, launch. Logic-only files without a `command` block validate with `point check` only.

## Usage

```bash
point launch examples/command.point hello cli
point run examples/command.point hello cli    # same, command name optional when one default exists
point run --bundle examples/pure/math-only.point
point dev examples/api/middleware-demo.point
point dev examples/api/middleware-demo.point --port 4000
```

Pure logic modules can run in memory via an internal JavaScript bundle. Modules with imports, externals, views, routes, workflows, or commands use a short-lived temp `.js` file under the system temp directory unless `--bundle` or `--no-bundle` overrides the default.

## point dev

Development mode for Point projects:

1. **Check** — typecheck the entry file and every `use` dependency in module-graph order. Unchanged files are skipped when `.point-cache/manifest.json` has a matching source hash (same cache as `POINT_INCREMENTAL=1` for `check-all`).
2. **Build** — write JavaScript emit to `generated/<base>.js` (and TypeScript when the module has views/pages).
3. **Run** — start or restart a Bun subprocess:
   - **Routes / stream routes** — `startRoutesServer()` with `PORT` from `--port` (default `3456`).
   - **Schedules** — the zero-input `run …` command (setInterval dev scheduler).
   - **Otherwise** — re-run the preferred zero-input command/action on each successful rebuild.

On check failure after the initial build, dev keeps the previous server running and prints JSON diagnostics. The first build failure exits with code `1`.

Example:

```point
route health
  method GET
  path "/health"
  output response: Text
  return "ok"

command serve api
  output status: Text
  return "ready"
```

```bash
point dev api.point --port 3456
# edit route body in api.point → save → server restarts automatically
```

See `examples/api/middleware-demo.point` for a fuller HTTP demo.

## Runtime error mapping

When generated JavaScript throws, `point run` reads stack frames from the emitted module and maps them back to `.point` line numbers using inline `// @point <line>` tags in generated code.

Example:

```text
Runtime error in app.point:9: Failed
```

Here line `9` is the failing expression inside the action or calculation body, not only the declaration header.

### Current limits

- **Calculations, rules, labels, actions, routes, workflows, commands:** statement-level mapping for emitted executable lines inside block bodies.
- **Views and pages:** TypeScript emit tags `when … render` branches and load-data guard lines (`when loading render`, `when error render`, `when empty render`) with `// @point <line>`. JavaScript emit tags conditional `when … render` branches in view bodies. Full React/JSX view runtime stacks still depend on host tooling.
- **Externals and imports:** stack frames may include host module paths before the mapped Point frame is found.
- **In-memory bundle path:** mapping uses the bundled eval body; line offsets account for the `"use strict"` wrapper.
- **TypeScript and Python emit:** statement-level tags are JavaScript-only today. `point build-ts` and `point build-py` do not yet emit equivalent maps.

For broader runtime constraints (Bun/Node host, no owned VM), see `docs/native-target-research.md` in the repository.

## Periodic schedules (dev vs production)

Point `schedule` blocks declare periodic action runs. In development, emit uses `setInterval` via `startPointSchedules()` when a module includes schedules and a `run ...` command entrypoint.

```point
external point std time
  time now(): Text from "@hatchingpoint/point/std/time" as now

action health check
  output timestamp: Text
  touches time
  return time now()

schedule health check tick
  every 5 minutes
  call health check

command run schedules
  output status: Text
  return "schedules running"
```

Inline form is also supported:

```point
external point std time
  time now(): Text from "@hatchingpoint/point/std/time" as now

action health check
  output timestamp: Text
  touches time
  return time now()

schedule every 30 seconds call health check
```

**Production:** prefer external cron (system crontab, Kubernetes CronJob, hosted scheduler) invoking `point run` or a one-shot action wrapper. Long-lived `setInterval` inside app processes is fine for local dev but couples scheduling to process lifetime in deploys. Generated emit includes a comment pointing here; wire host cron to call the action on the desired cadence instead of keeping a dev scheduler process alive.

Example: `examples/tools/health-check-schedule.point`.

## See also

- [Run, test, REPL](/point/toolchain/run-test-repl)
- [CLI reference](/point/reference/cli)
