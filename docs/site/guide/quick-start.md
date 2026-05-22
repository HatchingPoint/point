---
title: Quick start
description: Install Point, write a first .point file, check it, and run it.
quadrant: Tutorial
---

## Summary

Install the CLI, write a small `.point` file, check it, format it, and run it.

## Install the compiler

```bash
bun install -g @hatchingpoint/point
```

Also works: `npm install -g @hatchingpoint/point` (same registry).

Point runs on Bun — install Bun if `point` cannot start.

## Create a file

Create `readiness.point`:

```point
module Readiness

record Deploy Signals
  has bundle id: Bool
  submitted for review: Bool

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 50 when signals.has bundle id
  add 50 when signals.submitted for review
  return score

label deploy status
  input score: Int
  output Text
  when score >= 90 return "Ready"
  otherwise return "Not ready"
```

## Check and run

```bash
point check readiness.point
point fmt readiness.point
point run readiness.point
```

For modules with a command entrypoint, `point run` checks source and executes without you managing build output manually.

When a host project imports compiled files, add a build step:

```bash
point build readiness.point generated/readiness.js
```

See [Build and emit](/point/toolchain/build-emit) for typed or alternate build targets.

## Agent commands

```bash
point index examples/math.point
point explain examples/math.point point://semantic/Math/label.score status
point check-json examples/math.point
point repair-plan examples/math.point
```

Prefer semantic refs such as `point://semantic/Math/label.score status` over line numbers or generated names.

## Scaffold an app

Create a full-stack admin app (layout, navigation, pages, actions) — like `create-next-app` for Point:

```bash
bun install -g @hatchingpoint/point
point create my-app
cd my-app
point check src/app.point
point run src/app.point
bun run build
```

Templates ship inside `@hatchingpoint/point` — no monorepo checkout required. List options with `point create --list-templates`.

Legacy alias: `point app new my-app`.

## See also

- [Installation](/point/guide/installation)
- [How Point runs](/point/concepts/how-point-runs)
- [Language overview](/point/language/overview)
- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
