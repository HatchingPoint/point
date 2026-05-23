---
title: Expressions and operators
description: Literals, field access, calls, operators, maps, optionals, and expression typing in Point.
quadrant: Reference
---

## Summary

Point expressions are intentionally small: literals, names, field access, calls, records, lists, maps, optionals, arithmetic, comparisons, boolean operators, `await`, and `Error` values.

The checker assigns every expression a type and reports structured diagnostics when an expression does not match the expected context.

## Literals

| Literal | Type | Notes |
|---------|------|-------|
| `"text"` | `Text` | Double-quoted string |
| `123` | `Int` | Integer literal |
| `12.5` | `Float` | Decimal literal |
| `true`, `false` | `Bool` | Boolean literal |
| `none` | `Maybe<T>` | Requires expected optional context |
| `[1, 2, 3]` | `List<Int>` | All items must share one type |
| `{ name: "Ada" }` | Record | Requires expected record context |
| `Error "message"` | `Error` | Commonly used in `T or Error` outputs |

Empty lists need expected type context:

```point
calculation empty names
  output names: List<Text>
  names is []
```

## Names and field access

Inputs, output bindings, loop variables, and local bindings are referenced by semantic name:

```point
item.unit price
```

Field labels may contain spaces. Diagnostics use the source spelling, while emitted host code uses normalized identifiers.

Optional values must be narrowed before field access:

```point
label contact email label
  input contact: Maybe<Contact>
  output Text
  when contact present return contact.email
  when contact is none return "missing"
  otherwise return "missing"
```

## Calls

Pure blocks can call pure calculations, rules, and labels. Effectful calls belong in actions, workflows, pipelines, routes, stream routes, schedules, sessions, or commands.

```point
total is line total(item)
```

Action calls from another effectful block require `await`:

```point
action load profile
  input id: Text
  output profile: Text or Error
  touches network
  return await fetch profile(id)
```

## Arithmetic

| Operator | Inputs | Output |
|----------|--------|--------|
| `+` | `Int`, `Float`, or `Text` depending on context | Numeric sum or text concatenation |
| `-` | Numeric | Numeric |
| `*` | Numeric | Numeric |
| `/` | Numeric | Numeric |

Use `Int` minor units for money. The checker reports `float-money-field` for money-like field names with `Float`.

## Comparisons

| Operator | Output |
|----------|--------|
| `==` | `Bool` |
| `!=` | `Bool` |
| `<` | `Bool` |
| `<=` | `Bool` |
| `>` | `Bool` |
| `>=` | `Bool` |

Comparisons are most common in labels, rules, policies, and route guards:

```point
when total >= 10000 return "Large order"
```

## Boolean operators

| Operator | Meaning |
|----------|---------|
| `and` | Both operands are true |
| `or` | Either operand is true |
| `not` | Negates a boolean expression |

Use boolean expressions in `when`, `allow`, `deny`, `require`, and route/middleware logic.

## Lists

List values are homogeneous:

```point
calculation sample ids
  output ids: List<Text>
  ids is ["a", "b", "c"]
```

Iterate with `for each`:

```point
for each item in items
  add item.quantity to total
```

`for each` requires `List<T>`; otherwise the checker reports `iteration-type-mismatch`.

## Maps

Maps are string-keyed:

```point
calculation default prices
  output prices: Map<Text, Int>
  prices is map { "sku-a": 100, "sku-b": 250 }

calculation unit price
  input prices: Map<Text, Int>
  input sku: Text
  output price: Int
  price is lookup prices sku
```

Keys must be `Text`; values share one type `T`.

## Variants

Construct variant cases by case name:

```point
variant Order Status
  Pending
  Shipped with tracking number: Text
```

Dispatch in labels:

```point
label status label
  input status: Order Status
  output Text
  on Pending return "Pending"
  on Shipped with tracking number return tracking number
  otherwise return "Unknown"
```

Payload fields are only available in narrowed branches.

## Statement expressions

Assignments and mutations appear inside executable blocks:

| Form | Meaning |
|------|---------|
| `name is expr` | Bind or assign a derived value |
| `name starts at expr` | Initialize mutable accumulator |
| `add expr to name` | Add to accumulator |
| `subtract expr from name` | Subtract from accumulator |
| `set name to expr` | Replace accumulator value |
| `add expr when condition` | Rule shorthand for conditional output accumulation |

## Common diagnostics

| Code | Expression issue |
|------|------------------|
| `unknown-identifier` | Name is not in scope |
| `unknown-field` | Field is not on the record type |
| `nullable-field-access` | Field access on `Maybe<T>` without `present` narrowing |
| `type-mismatch` | Expression type does not match expected context |
| `operator-type-mismatch` | Operator used with unsupported operand types |
| `list-type-required` | Empty or invalid list context |
| `record-type-required` | Record literal lacks expected record context |
| `missing-await` | Action call used without `await` |

## See also

- [Types](/point/language/types)
- [Control flow](/point/language/control-flow)
- [Block reference](/point/reference/blocks)
- [Diagnostics](/point/reference/diagnostics)
