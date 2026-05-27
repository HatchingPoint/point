---
title: Quick start
description: Install Point, write a first .point file, check it, and run it.
quadrant: Tutorial
---

## Summary

Install the CLI, write a small `.point` file, check it, format it, and launch a command.

**Fastest path:** [Point in 60 seconds](/point/guide/point-in-60-seconds). **Full app eval:** [Golden app demo](/point/guide/golden-app-demo).

## Install the compiler

```bash
bun install -g @hatchingpoint/point
```

Also works: `npm install -g @hatchingpoint/point` (same registry).

Point runs on Bun — install Bun if `point` cannot start.

## Create a file

Create `checkout.point`:

```point
module Checkout

record Cart Item
  name: Text
  unit price: Int
  quantity: Int

calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total

label order size
  input total: Int
  output Text
  when total >= 10000 return "Large order"
  otherwise return "Standard"
```

## Check and launch

```bash
point check checkout.point
point fmt checkout.point
```

Logic-only files validate with `point check`. To execute something, use a file with a `command` block:

```bash
point box examples/command.point
point launch examples/command.point hello cli
```

When a host project imports compiled files:

```bash
point build checkout.point generated/checkout.js
```

See [Build and emit](/point/toolchain/build-emit) for the decision tree.

## Agent commands

The compiler is the agent's IDE:

```bash
point check-json examples/cart-total.point
point repair-plan examples/cart-total.point
point index examples/cart-total.point
point explain examples/cart-total.point point://semantic/Checkout/rule.cart total
```

Prefer semantic refs over line numbers or generated names.

## Scaffold an app

Create a **runtime-native** Point app (`.point` only — owned interpreter, HTTP, and SSR; no Vite or React):

```bash
point create my-app
cd my-app
bun install
point check src/app.point
point dev src/app.point
```

Open the URL printed by `point dev` — SSR readiness UI, JSON at `/readiness`, navigation at `/readiness-ui`.

Legacy hosts are opt-in:

```bash
point create my-app --template full-stack-app
point create my-saas --template saas-app
```

Those React + Vite templates print their own UI/API URLs when `point dev` starts.

Walkthrough: [Golden app demo](/point/guide/golden-app-demo).

Production (runtime app): `bun run serve`. Legacy template: `bun run build` then `bun run serve`. See [Deploy](/point/toolchain/deploy).

Templates ship inside `@hatchingpoint/point` — no monorepo checkout required. List options with `point create --list-templates`.

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Golden app demo](/point/guide/golden-app-demo)
- [Installation](/point/guide/installation)
- [How Point runs](/point/concepts/how-point-runs)
- [Stable refs](/point/ai/stable-refs)
