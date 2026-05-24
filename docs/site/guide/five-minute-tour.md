---
title: Five-minute tour
description: See logic, app, and capabilities in one pass.
quadrant: Tutorial
---

## Summary

This tour shows Point's three daily moves: **logic blocks**, **app blocks**, and **built-in capabilities** — in under five minutes.

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
point run tour.point
```

## 2. Capabilities (30 seconds)

Import batteries with one word:

```text
use http
use json
use time
```

```bash
point capabilities
```

Same as `use std.http`. The compiler merges **only symbols you reference**.

## 3. App surface (2 minutes)

Scaffold a full-stack admin app:

```bash
point create my-app
cd my-app
point dev src/app.point
```

Open **http://localhost:5173** — pages, routes, and API from one `src/app.point` file.

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

```bash
point check-json src/app.point
point repair-plan src/app.point
point index src/app.point
```

Stable refs and repair hints — agents patch semantic source, not line numbers.

## See also

- [Quick start](/point/guide/quick-start)
- [Introduction](/point/guide/introduction)
- [Capabilities](/point/language/capabilities)
- [Product map](https://github.com/HatchingPoint/point/blob/main/docs/product-map.md)
