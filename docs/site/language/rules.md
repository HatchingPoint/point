---
title: Rules
description: Stateful scoring and accumulation with starts-at, add-when, and loops.
quadrant: Reference
---

## Summary

A `rule` expresses logic that accumulates into an output: totals, scores, and conditional adds. The same pattern models cart totals, fraud risk, SLA points, or eligibility — not only marketing checklists.

## Syntax

```point
record Cart Item
  unit price: Int
  quantity: Int

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total
```

## Semantics

- `output name starts at expr` initializes mutable state
- `add N when condition` adds to the output when the condition is true
- `for each item in list` iterates; `add X to Y` mutates accumulators
- `return` finishes the rule

## Compiler note

Rules use mutable accumulators (`starts at`, `add when`, loops). The checker validates input types and field access on each condition.

## Example

From `examples/cart-total.point`:

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
```

For conditional scoring without loops, see `examples/adopters/starter-labs/subscription-tier.point`.

## Common mistakes

- Using `add N when` on a calculation (rules only)
- Iterating a non-list (`iteration-type-mismatch`)

## Agent diagnostic notes

- Output names in rules avoid duplicate suffixes on the lowered symbol (`cart total` + output `total` stays readable, not `cartTotalTotal`)
- Ref: `point://semantic/<Module>/rule.<name>`

## See also

- [Calculations](/point/language/calculations)
- [Control flow](/point/language/control-flow)
- [Records](/point/language/records)
