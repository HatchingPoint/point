---
title: Rules
description: Stateful scoring and accumulation with starts-at, add-when, and loops.
quadrant: Reference
---

## Summary

A `rule` expresses logic that accumulates into an output: scores, totals, and conditional adds.

## Syntax

```point
record Launch Signals
  has bundle id: Bool
  submitted for review: Bool

rule launch readiness
  input signals: Launch Signals
  output score: Int
  score starts at 0
  add 30 when signals.has bundle id
  add 40 when signals.submitted for review
  return score
```

## Semantics

- `output name starts at expr` initializes mutable state
- `add N when condition` adds to the output when the condition is true
- `for each item in list` iterates; `add X to Y` mutates accumulators
- `return` finishes the rule

## Compiler note

Rules use mutable accumulators (`starts at`, `add when`, loops). The checker validates input types and field access on each condition.

## Example

From `examples/math.point`:

```point
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
