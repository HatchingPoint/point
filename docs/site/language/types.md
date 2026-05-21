---
title: Types
description: Primitive types, lists, optionals, results, and record references.
quadrant: Reference
---

## Summary

Point uses a small typed surface: primitives, generics, unions, and user record names.

## Syntax

| Type | Meaning |
|------|---------|
| `Text` | Strings |
| `Int`, `Float` | Numbers |
| `Bool` | Booleans |
| `Void` | No value |
| `List<T>` | Homogeneous lists |
| `Maybe<T>` | Optional (`none` lowers to `null` in TS) |
| `A or B` | Union / result (`Text or Error`) |
| Record name | User-defined struct (`Cart Item`) |

Literals: `"text"`, numbers, `true`, `false`, `none`, `[1, 2]`, `{ name: "Ada" }`.

Operators: `+`, `-`, `*`, `/`, comparisons, `and`, `or`, property access with `.`

## Semantics

The checker enforces types on inputs, outputs, returns, and operators. `Error "message"` builds error values for result types.

## Lowering

- `Maybe<T>` → `T | null` in TypeScript
- `A or B` → union types
- `List<T>` → `Array<T>`
- Record names → interfaces

## Example

From `examples/optional.point`:

```point
record User
  name: Text
  email: Maybe<Text>
```

From `examples/result.point` (pattern): actions and workflows may return `Text or Error`.

## Common mistakes

- Wrong arity on generics (`invalid-type-arity`)
- Accessing fields on `Maybe<T>` without narrowing (`nullable-field-access`)
- Empty list without expected `List<T>` context (`list-type-required`)

## Agent diagnostic notes

- `type-mismatch` diagnostics include `expected` and `actual` type strings
- Prefer semantic refs on the declaration that owns the wrong type

## See also

- [Records](/point/language/records)
- [Grammar summary](/point/reference/grammar)
- [Diagnostics](/point/reference/diagnostics)
