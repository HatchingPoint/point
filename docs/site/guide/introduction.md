---
title: Introduction
description: Understand what Point is, who it is for, and the first commands to run.
quadrant: Tutorial
---

## Summary

Point is a general-purpose language for product logic — expressed as semantic blocks that humans and coding agents can read, check, and repair.

Start with [Quick start](/point/guide/quick-start), [Language overview](/point/language/overview), or [Proof of concept](/point/concepts/proof-of-concept) for worked examples.

## What Point is

Point programs are built from named blocks:

`record`, `calculation`, `rule`, `label`, `action`, `policy`, `workflow`, `view`, `page`, `layout`, `navigation`, `route`, `stream route`, `pipeline`, `session`, `prompt`, `guard`, `schedule`, and `command`.

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

Run `point check` on any `.point` file to validate types and effects before you integrate with a host app.

## Who Point is for

Point fits teams that want:

- **Explicit product logic** — scoring, eligibility, workflows, and UI rules in one checked source
- **Agent-friendly repair** — `check-json`, stable refs, and repair hints instead of line-number guesses
- **A full application surface** — routes, pages, pipelines, and commands in the same language (v0.1.0)

You do not need to migrate an entire monorepo on day one. Start with one module, check it, and grow from there.

## How it fits

Install the CLI, write `.point`, and use the toolchain:

```bash
bun install -g @hatchingpoint/point
point check examples/math.point
point run examples/hello.point
```

When a surrounding app needs compiled modules, run `point build`. Optional build targets are covered in [Build and emit](/point/toolchain/build-emit). See [How Point runs](/point/concepts/how-point-runs) for the full picture.

## See also

- [Quick start](/point/guide/quick-start)
- [How Point runs](/point/concepts/how-point-runs)
- [Language overview](/point/language/overview)
- [Proof of concept](/point/concepts/proof-of-concept)
- [Platform vision](/point/concepts/platform-vision)
- [AI overview](/point/ai/overview)
