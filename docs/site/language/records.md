---
title: Records
description: Define named data shapes with fields that may use spaced labels.
quadrant: Reference
---

## Summary

A `record` declares a named product type with typed fields. Field labels may contain spaces; semantic refs preserve the author spelling (`field.unit price`).

## Syntax

```point
record Cart Item
  name: Text
  unit price: Int
  quantity: Int
```

## Semantics

Records are structural types. Other blocks reference them by name (`Cart Item`, `Launch Signals`). Property access in expressions uses the same spelling as in source (`item.unit price`).

## Compiler note

Field names with spaces are normalized internally for host interop. Diagnostics and `point index` always use the semantic spelling from source.

## Example

From `examples/cart-total.point`:

```point
record Cart Item
  name: Text
  unit price: Int
  quantity: Int
```

## Common mistakes

- Referencing a field name that does not exist on the record (diagnostic `unknown-field`)
- Forgetting that record literals need a known record type in context

## Agent diagnostic notes

- `unknown-field` and `missing-field` include `expected` field lists and `repair` hints
- Use `point://semantic/<Module>/record.<Name>/field.<label>` refs from `point index`

## See also

- [Types](/point/language/types)
- [Calculations](/point/language/calculations)
- [Grammar summary](/point/reference/grammar)
