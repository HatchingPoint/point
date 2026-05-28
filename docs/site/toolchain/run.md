---
title: point run
description: Execute Point entrypoints through the owned runtime and map failures back to semantic source.
quadrant: Reference
---

## Summary

Discover commands with `point box`, then launch by name. `point run` checks a `.point` file and executes a zero-input entrypoint through **`packages/point/runtime/`** (bytecode interpreter). **`point launch`** is the simple path — it requires a command name.

`point test` and `point test-all` also execute through the runtime interpreter — no JavaScript emit eval path.

Runtime failures are reported against the original semantic `.point` file when the runtime attaches source location metadata.

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
point run experiments/point-only/src/app.point smoke
point dev src/app.point
point serve src/app.point --port 8080
```

Pure logic modules and full apps both run through the owned runtime interpreter. App workflows with routes, pages, navigation, streams, or SSE use `point dev` / `point serve` (runtime HTTP + SSR). Legacy Vite/React host workflows were removed in P10.

## point dev and point serve

Development and production app hosting for runtime-owned projects:

```bash
point dev src/app.point --port 3456
point serve src/app.point --port 8080
```

Runtime-owned apps (`point.json` with `"runtime": "owned"`) and modules with app surface (routes, pages, navigation, stream routes) start the owned runtime server. There is no `--legacy` opt-in and no Vite co-process.

See [Dev and serve](/point/toolchain/dev) and [Deploy runtime-owned apps](/point/ecosystem/runtime-deploy).

## Runtime error mapping

`point run` executes through the runtime interpreter. When execution fails, the CLI prints:

```text
Runtime error in app.point: <message>
```

For advanced emit workflows (`point build`, `point build-js`), generated JavaScript still carries inline `// @point <line>` tags. Stack-based mapping helpers in `source-map.ts` resolve emitted JavaScript lines back to `.point` sources for tests and legacy emit tooling.

Example emit tag:

```text
Runtime error in app.point:9: Failed
```

Here line `9` is the failing expression inside the action or calculation body, not only the declaration header.

### Current limits

- **Runtime interpreter:** errors include the entry `.point` path; expression-level line numbers depend on runtime metadata for the failing opcode.
- **Calculations, rules, labels, actions, routes, workflows, commands (emit):** statement-level mapping for emitted executable lines inside block bodies via `// @point` tags.
- **Views and pages:** TypeScript emit tags `when … render` branches and load-data guard lines. Owned SSR stacks do not depend on React/Vite host tooling.
- **Externals and imports:** stack frames may include host module paths before a mapped Point frame is found.
- **TypeScript and Python emit:** statement-level tags are JavaScript-only today. `point build-ts` and `point build-py` do not yet emit equivalent maps.

For broader runtime constraints, see `docs/native-target-research.md` in the repository.

## Periodic schedules

Point `schedule` blocks declare periodic action runs. Prefer external cron (system crontab, Kubernetes CronJob, hosted scheduler) invoking `point run` or a one-shot action wrapper in production.

Example: `examples/tools/health-check-schedule.point`.

## See also

- [Run, test, REPL](/point/toolchain/run-test-repl)
- [CLI reference](/point/reference/cli)
- [Dev and serve](/point/toolchain/dev)
