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
| `Map<Text, T>` | String-keyed maps (`map { "key": value }`, `lookup map key`) |
| `Instant` | Opaque UTC timestamp (ISO string at runtime via `std.time`) |
| `Maybe<T>` | Optional (`none` literal) |
| `A or B` | Union / result (`Text or Error`) |
| Record name | User-defined struct (`Cart Item`) |
| `variant` | Tagged union; dispatch with `on Case` in labels |

Literals: `"text"`, numbers, `true`, `false`, `none`, `[1, 2]`, `{ name: "Ada" }`.

### Variant dispatch

```point
variant Order Status
  Pending
  Shipped with tracking number: Text

label order status label
  input status: Order Status
  output Text
  on Pending return "Pending"
  on Shipped with tracking number return tracking number
  otherwise return "Unknown"
```

See `examples/variants/order-status.point`.

### Maps

String-keyed associative data (Phase 23):

```point
calculation default prices
  output prices: Map<Text, Int>
  prices is map { "sku-a": 100, "sku-b": 250 }

calculation unit price for sku
  input prices: Map<Text, Int>
  input sku: Text
  output price: Int
  price is lookup prices sku
```

See `examples/catalog/price-lookup.point`. Keys must be `Text`; values share one type `T`.

### Money (cents pattern)

Point has no built-in decimal type yet. Store money as **integer minor units** (cents) in a record:

```point
record Money
  amount cents: Int
  currency: Text
```

See `std/money.point` for add/format helpers. Do not use `Float` for currency.

### Instant (time pattern)

Point has no timezone logic in the language core. Use **`Instant`** for UTC timestamps and **`std.time`** for create/parse/format:

```point
use std.time

record Event
  name: Text
  at: Instant

calculation sample event
  output event: Event
  event is { name: "Launch", at: instant now() }

label event summary
  input event: Event
  output summary: Text
  otherwise return event.name + " at " + format instant(event.at)
```

- `instant now()` — current UTC instant
- `format instant(value)` — human-readable label
- `parse instant(text)` — `Instant or Error` from ISO text
- `current time()` remains for plain `Text` ISO strings (legacy)

See `examples/tools/instant-demo.point`. Avoid `Float` or raw `Text` when you mean a typed timestamp.

Operators: `+`, `-`, `*`, `/`, comparisons, `and`, `or`, property access with `.`

## Semantics

The checker enforces types on inputs, outputs, returns, and operators. `Error "message"` builds error values for result types.

## Compiler note

Generic and union types are checked structurally. Variant labels use `on Case` dispatch; the checker ensures payload fields match each case.

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
