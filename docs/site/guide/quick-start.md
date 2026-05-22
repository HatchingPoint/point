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

## Check and run

```bash
point check checkout.point
point fmt checkout.point
point run examples/hello.point
```

`point run` needs a zero-argument `command` — use `examples/hello.point` for your first run. Logic-only files like `checkout.point` are validated with `point check` and built when a host app imports them.

When a host project imports compiled files:

```bash
point build checkout.point generated/checkout.js
```

See [Build and emit](/point/toolchain/build-emit) for typed or alternate build targets.

## Agent commands

```bash
point index examples/cart-total.point
point explain examples/cart-total.point point://semantic/Checkout/rule.cart total
point check-json examples/cart-total.point
point repair-plan examples/cart-total.point
```

Prefer semantic refs such as `point://semantic/Checkout/rule.cart total` over line numbers or generated names.

## Scaffold an app

Create a Point-native full-stack admin app (UI + API in `.point`, Vite host included):

```bash
bun install -g @hatchingpoint/point
point create my-app
cd my-app
bun install
point check src/app.point
bun run dev
```

Open **http://localhost:5173** for the UI. The Bun API runs on **http://localhost:3456** (`/api/health`, `/api/members`).

Production: `bun run build` then `bun run serve`. See [Deploy](/point/toolchain/deploy).

Templates ship inside `@hatchingpoint/point` — no monorepo checkout required. List options with `point create --list-templates`.

Legacy alias: `point app new my-app`.

## See also

- [Installation](/point/guide/installation)
- [How Point runs](/point/concepts/how-point-runs)
- [Language overview](/point/language/overview)
- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
