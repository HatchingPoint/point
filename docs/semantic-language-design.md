# Point Semantic Language Design

Point source is AI-first product logic. Users write semantic blocks; the compiler lowers those blocks into an internal typed core and then emits TypeScript or other targets.

Programming-language-shaped forms such as function declarations, mutable bindings, braces, and direct assignment are compiler/core details. They are useful for implementation and debugging, but they are not the forward-facing Point language.

## Source Shape

Point source is organized as named blocks:

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
  return total

label shipping offer
  input total: Int
  output Text
  when total >= 100 return "Free shipping"
  otherwise return "Standard shipping"
```

## Public Constructs

- `module` names a source module.
- `record` defines named structured data.
- `calculation` derives a value from inputs.
- `rule` accumulates or decides business logic.
- `label` classifies a value into text.
- `action`, `policy`, `workflow`, and `external` are reserved for effectful and interop work.

## Naming

User-facing names may contain spaces:

```point
monthly price
Cart Item
has bundle id
```

The compiler lowers these names into stable generated identifiers:

```text
monthly price -> monthlyPrice
Cart Item -> CartItem
has bundle id -> hasBundleId
```

Diagnostics and repair plans should point at semantic source names first, with generated identifiers treated as target details.

## Lowering Contract

Semantic source lowers into the internal core:

```point
calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

Internal core equivalent: a typed function named `annualPrice` that accepts `monthlyPrice: Int` and returns `monthlyPrice * 12`.

TypeScript target:

```ts
export function annualPrice(monthlyPrice: number): number {
  return monthlyPrice * 12;
}
```

The semantic source is the language. The core and generated TypeScript are implementation artifacts.
