---
title: Control flow
description: Loops, mutation, and conditionals in calculations and rules.
quadrant: Reference
---

## Summary

Control flow in Point appears inside `calculation` and `rule` bodies: loops, accumulation, and conditionals in `label` blocks.

## Syntax

**Iteration**

```point
record Cart Item
  unit price: Int
  quantity: Int

rule line totals
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
    add item.unit price * item.quantity to total
  return total
```

**Mutation in rules and calculations**

```point
rule adjust score
  input score: Int
  output total: Int
  total starts at score
  add 10 to total
  subtract 5 from total
  set total to 0
  return total
```

**Conditional adds in rules**

```point
record Deploy Signals
  has bundle id: Bool

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 30 when signals.has bundle id
  return score
```

**Labels**

```point
label score status
  input score: Int
  output Text
  when score >= 90 return "excellent"
  otherwise return "keep going"
```

## Semantics

`for each` requires a `List<T>` iterable. Rule outputs initialized with `starts at` are mutable; calculation outputs using `is` are typically single assignment unless mutation forms are used.

## Compiler note

`for each` requires a `List<T>`. Rule accumulators initialized with `starts at` may use `add to`, `subtract from`, and `set to` inside the body.

## Example

From `examples/cart-total.point`:

```point
module Checkout

record Cart Item
  name: Text
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

## Common mistakes

- `for each` over a non-list (`iteration-type-mismatch`)
- Assigning to an immutable binding (`immutable-assignment`)

## Agent diagnostic notes

- Loop diagnostics point at the `for each` span with `repair` text when the iterable is wrong
- After fixing control flow, re-run `point check-json` before touching unrelated blocks

## See also

- [Rules](/point/language/rules)
- [Calculations](/point/language/calculations)
- [Labels](/point/language/labels)
