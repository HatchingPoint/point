---
title: Quick start
description: Install Point, write a first .point file, check it, format it, and emit JavaScript.
quadrant: Tutorial
---

## Summary

In this guide you will install Point, write a small `.point` file, check it, format it, and emit JavaScript.

## Install the compiler

Install the CLI from npm:

```bash
npm install -g @hatchingpoint/point
```

Point currently runs on Bun, so install Bun first if `point` cannot start on your machine.

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

## Check, format, and emit

Run the CLI against the file:

```bash
point check readiness.point
point fmt readiness.point
point build readiness.point generated/readiness.js
```

The emitted JavaScript is ordinary target code. Keep editing the `.point` source and regenerate the target file as part of your build or CI workflow. Use `point build-ts` when you need TypeScript for typed imports in React, Vue, or `tsc` pipelines.

## Use agent-facing commands

Point exposes structure that coding agents can use directly:

```bash
point index examples/math.point
point explain examples/math.point point://semantic/Math/label.score status
point check-json examples/math.point
point repair-plan examples/math.point
```

The important habit is to use semantic refs such as `point://semantic/Math/label.score status`, not generated target names or line-number guesses.

## Scaffold a full-stack app (v0.1.0)

```bash
point app new my-app
cd my-app
point check src/app.point
point build-ts src/app.point generated/app.ts
point dev src/app.point --port 3456
```

## See also

- [Installation](/point/guide/installation)
- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
