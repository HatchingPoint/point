---
title: Language tour
description: A guided tour of Point from records and calculations through routes, UI, workflows, agents, and tests.
quadrant: Tutorial
---

## Summary

This tour walks through the current Point language surface in the order most people should learn it: data, pure logic, effects, app surfaces, orchestration, agents, and tests.

Run examples with the CLI as you go:

```bash
point check examples/cart-total.point
point check examples/route.point
point check examples/workflow.point
```

## 1. Start with a module

A Point file can declare a module name. The module becomes part of stable semantic refs:

```point
module Checkout
```

Refs use this name:

```text
point://semantic/Checkout/rule.cart total
```

## 2. Model data with records

Records define named product data:

```point
record Cart Item
  name: Text
  unit price: Int
  quantity: Int
```

Field labels can contain spaces. The compiler lowers them for host runtimes, but diagnostics and docs keep the source spelling.

## 3. Derive values with calculations

Calculations are pure:

```point
calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity
```

Use calculations for deterministic values that do not touch IO.

## 4. Accumulate with rules

Rules express totals, scores, eligibility points, and other accumulations:

```point
rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total
```

Rules make the accumulator explicit, which gives the checker and agents a better target than a generic loop hidden inside a function.

## 5. Classify with labels

Labels turn values into classifications:

```point
label order size
  input total: Int
  output Text
  when total >= 10000 return "Large order"
  otherwise return "Standard"
```

Use labels for statuses, display names, tiers, and branch-heavy classification.

## 6. Use variants for states

Variants are tagged unions:

```point
variant Order Status
  Pending
  Shipped with tracking number: Text
```

Dispatch with `on Case`:

```point
label order status label
  input status: Order Status
  output Text
  on Pending return "Pending"
  on Shipped with tracking number return tracking number
  otherwise return "Unknown"
```

The checker can report missing cases for variant dispatch.

## 7. Represent optional and fallible values

Use `Maybe<T>` for absence:

```point
record Contact
  email: Text

label contact email label
  input contact: Maybe<Contact>
  output Text
  when contact present return contact.email
  when contact is none return "missing"
  otherwise return "missing"
```

Use `T or Error` for operations that can fail:

```point
action load profile
  input id: Text
  output profile: Text or Error
  touches network
  return await fetch profile(id)
```

## 8. Keep effects explicit

Declare host boundaries with `external`, then wrap IO in `action`:

```point
external node fs
  read file(path: Text): Text from "node:fs" as readFileSync

action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

Actions declare effect categories such as `file`, `network`, `env`, `database`, or `time`.

## 9. Add HTTP routes

Routes expose typed server handlers:

```point
route get user
  method GET
  path "/users/:id"
  input id: Text
  output response: Text
  return id
```

Use `middleware` and `before` for request gates. Use `return json { ... }` when a route returns structured JSON.

## 10. Build UI with views and pages

Views render reusable UI fragments:

```point
view counter
  input count: Int
  when count > 0 render emphasized large "Counter ready"
  render muted "Counter empty"
```

Full apps add `layout`, `navigation`, and `page` blocks. Views can load data from actions and subscribe to stream routes.

## 11. Orchestrate with workflows

Workflows compose async steps:

```point
workflow signup flow
  input email: Text
  output user: Text or Error
  step created user is await create user(email)
  return created user
```

Steps can use retry, timeout, policy requirements, and failure branches.

## 12. Model agent flows

Agent-facing features are first-class blocks:

| Block | Use |
|-------|-----|
| `pipeline` | Multi-step automation or LLM workflow |
| `session` | Conversational state and streaming response |
| `prompt` | Versioned text template |
| `guard` | Scoped output/path safety |

These blocks still participate in checking, indexing, stable refs, and repair plans.

## 13. Test the module

Unit tests are zero-input calculations or actions whose names start with `test` and return `Bool`:

```point
calculation test arithmetic
  output passed: Bool
  passed is 2 + 2 == 4
```

Run:

```bash
point test examples/point-tests.point
```

## 14. Use agent-friendly commands

Point's repair loop uses structured compiler output:

```bash
point check-json examples/cart-total.point
point index examples/cart-total.point
point explain examples/cart-total.point point://semantic/Checkout/rule.cart total
point repair-plan examples/cart-total.point
```

Use semantic refs in issues, docs, tests, and agent prompts.

## Next steps

- [Language overview](/point/language/overview)
- [Block reference](/point/reference/blocks)
- [Expressions and operators](/point/reference/expressions)
- [Testing](/point/guide/testing)
