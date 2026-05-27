---
title: Introduction
description: Understand what Point is, who it is for, and the first commands to run.
quadrant: Tutorial
---

## Summary

Point is a general-purpose language for application logic — semantic blocks that humans and agents read, check, and repair.

**New here?** Start with [Point in 60 seconds](/point/guide/point-in-60-seconds) — three moves, no block laundry list.

## What Point is

Each block states intent directly — a rule accumulates score from conditions; a label classifies a value — instead of hiding that meaning inside generic functions.

```point
module Readiness

record Launch Signals
  has bundle id: Bool
  submitted for review: Bool
  has passing tests: Bool

rule launch readiness
  input signals: Launch Signals
  output score: Int
  score starts at 0
  add 30 when signals.has bundle id
  add 40 when signals.submitted for review
  add 30 when signals.has passing tests
  return score
```

```bash
point check readiness.point
```

Import built-in std modules in one line: `capabilities http json time` (see [Capabilities](/point/language/capabilities)). Model success and failure with [domain outcomes](/point/language/domain-outcomes) — variants, not generic `Result`.

## Five block families

Point grows with you — start with Logic, add families when you need them:

| Family | Blocks | Start with |
|--------|--------|------------|
| **Logic** | `record`, `calculation`, `rule`, `label`, `variant` | ✅ Day one |
| **Effects** | `action`, `external`, `policy` | Host boundaries |
| **App** | `route`, `page`, `view`, `layout`, `navigation`, `middleware` | Full-stack apps — UI is native blocks, not `capabilities` |
| **Agent** | `command`, `workflow`, `pipeline`, `prompt`, `schedule` | CLI + automation |
| **Data** | records + `use sql` + `point build-schema` | Schema + queries |

Full block map: [Language overview](/point/language/overview).

## Who Point is for

Point fits teams that want:

- **Explicit application logic** — scoring, eligibility, workflows, UI, and API rules in one checked source
- **Agent-native repair** — the compiler is the agent's IDE (`check-json`, stable refs, repair-plan)
- **A full application surface** — routes, pages, pipelines, and commands in the same language

You do not need to migrate an entire monorepo on day one. Start with one module, `point check` it, and grow from there.

## First commands

```bash
bun install -g @hatchingpoint/point
point check examples/math.point          # logic
point box examples/command.point         # discover
point launch examples/command.point hello cli   # run
```

Logic-only files use `point check`. Runnable tools need a `command` block — list them with `point commands`, then `point launch`.

When a host app imports compiled output: `point build`. See [Build and emit](/point/toolchain/build-emit) for the decision tree.

## What you write vs what runs

You author **`.point`**. Runtime-owned apps are the default: `point create` scaffolds `runtime-app`, and `point dev` runs the interpreter, HTTP server, and SSR from `packages/point/runtime/`. Legacy Vite/React hosts remain opt-in templates. Python emit covers supported logic, routes, workflows, and pipelines.

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Quick start](/point/guide/quick-start)
- [Five-minute tour](/point/guide/five-minute-tour)
- [How Point runs](/point/concepts/how-point-runs)
- [AI overview](/point/ai/overview)
