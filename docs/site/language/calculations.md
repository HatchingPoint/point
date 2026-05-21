---
title: Calculations
description: Pure functions with inputs, outputs, and assignment-style bodies.
quadrant: Reference
---

## Summary

A `calculation` is a pure function: no `touches` metadata, no `await`, no filesystem or network by default.

## Syntax

```point
calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

Body forms include `input`, `output`, `{name} is {expr}`, `for each`, `add to` / `subtract from` / `set to`, and `return`.

## Semantics

Inputs are required at call sites. The output name defines the result binding inside the body. Calculations may call other pure calculations and use operators, literals, lists, and records.

## Lowering

Calculations lower to typed functions in core IR, then to TypeScript or JavaScript functions. Names with spaces become camelCase (`annual price` → `annualPrice`).

## Example

From `examples/math.point`:

```point
calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

## Common mistakes

- Using `await` or calling actions inside a calculation
- Return type does not match `output` declaration (`return-type-mismatch`, `type-mismatch`)

## Agent diagnostic notes

- Ref shape: `point://semantic/Math/calculation.annual price`
- Tests are calculations whose name starts with `test` and return `Bool` (see `point test`)

## See also

- [Rules](/point/language/rules)
- [Control flow](/point/language/control-flow)
- [Effects](/point/language/effects)
