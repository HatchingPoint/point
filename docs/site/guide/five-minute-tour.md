---
title: Five-minute tour
description: See logic, app, and capabilities in one pass.
quadrant: Tutorial
---

## Summary

This tour shows Point's daily moves: **logic**, **capabilities**, **app**, and **agent repair** — in under five minutes.

Start with [Point in 60 seconds](/point/guide/point-in-60-seconds) if you want the shortest path.

## 1. Logic (30 seconds)

```point
module TourLogic

record Cart Item
  unit price: Int
  quantity: Int

calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity
```

```bash
point check tour.point
```

Logic-only modules validate with `point check`. No command block needed yet.

## 2. Capabilities (30 seconds)

Import batteries in one line:

```point
module Demo

capabilities http json time

calculation noop
  output value: Text
  return "ok"
```

```bash
point capabilities
point box src/app.point
```

Same as separate `use http` lines. The compiler merges **only symbols you reference**.

## 3. App surface (2 minutes)

Scaffold a full-stack admin app:

```bash
point create my-app
cd my-app
point dev src/app.point
```

Open **http://localhost:5173** (UI). API on **http://localhost:3456** — pages, routes, and API from one `src/app.point` file.

Full walkthrough: [Golden app demo](/point/guide/golden-app-demo).

Run a CLI command from the template:

```bash
point launch src/app.point admin demo
```

## 4. Domain outcomes (1 minute)

Model success and failure with variants — not generic `Result`:

```point
variant Payment Outcome
  Succeeded with charge id: Text
  Failed with message: Text

label outcome message
  input outcome: Payment Outcome
  output Text
  on Succeeded with charge id return "Paid " + charge id
  on Failed with message return message
```

See [Domain outcomes](/point/language/domain-outcomes).

## 5. Agent loop (1 minute)

The compiler is the agent's IDE:

```bash
point check-json src/app.point
point repair-plan src/app.point
point index src/app.point
```

Stable refs and repair hints — agents patch semantic source, not line numbers. See [AI overview](/point/ai/overview).

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Golden app demo](/point/guide/golden-app-demo)
- [Quick start](/point/guide/quick-start)
- [In the box](/point/language/in-the-box)
