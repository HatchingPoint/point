---
title: Labels
description: Classify inputs into output values with when and otherwise branches.
quadrant: Reference
---

## Summary

A `label` maps inputs to a display or domain value using ordered `when` branches and `otherwise`.

## Syntax

```point
label score status
  input score: Int
  output Text
  when score >= 90 return "excellent"
  otherwise return "keep going"
```

## Semantics

Branches are evaluated in order. The first matching `when` wins. `otherwise` is the fallback. Output type is usually `Text` but may be any declared output type.

## Compiler note

Labels are ordered decision tables: first matching `when` wins; `otherwise` is required when branches do not cover all inputs.

## Example

From `examples/math.point`:

```point
record User
  name: Text
  active: Bool

label user status
  input user: User
  output Text
  when user.active return "active"
  otherwise return "inactive"
```

## Common mistakes

- Missing `otherwise` when not all cases are covered by `when`
- Comparing incompatible types in conditions (`operator-type-mismatch`)

## Agent diagnostic notes

- Ref: `point://semantic/Math/label.score status`
- Good target for `point explain` when an agent needs branch context only

## See also

- [Rules](/point/language/rules)
- [Types](/point/language/types)
- [Repair loops](/point/ai/repair-loops)
