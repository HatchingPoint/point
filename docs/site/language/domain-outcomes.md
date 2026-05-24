---
title: Domain outcomes
description: Model success and failure with variants instead of generic Result types.
quadrant: Reference
---

## Summary

Point does not ship a language-wide `Result<T, E>` type. Instead, model **domain outcomes** as **`variant`** blocks and dispatch with **`on Case`** in labels and calculations.

This keeps success and failure payloads explicit, checkable, and easy for agents to repair.

## Pattern

```point
module Payment Outcomes

variant Payment Outcome
  Succeeded with charge id: Text
  Failed with message: Text

label payment outcome for amount
  input amount cents: Int
  output Payment Outcome
  when amount cents <= 0 return Failed with message: "Amount must be positive"
  otherwise return Succeeded with charge id: "ch_demo"

label outcome message
  input outcome: Payment Outcome
  output Text
  on Succeeded with charge id return "Paid " + charge id
  on Failed with message return message
```

See `examples/variants/payment-outcome.point` in the repository.

## When to use

| Situation | Use |
|-----------|-----|
| Payment, auth, inventory, eligibility | Named variant with domain cases |
| HTTP/action host errors | `Text or Error` or variant with `Error` case |
| Exhaustive handling required | `on Case` dispatch — checker warns if a case is missing |
| Calculation fallback | `on failure return` when branches do not cover all cases |

## Calculations with outcomes

Use **`on failure return`** when earlier branches might not return:

```point
calculation classify status
  input code: Int
  output Text
  when code == 200 return "ok"
  on failure return "unknown"
```

Pair with variant dispatch when the output is a tagged union — the checker enforces exhaustiveness for `* Outcome` variant names.

## Actions and effects

Actions that touch the network or filesystem often return **`Text or Error`** or a domain **`variant`**. Keep effect metadata honest (`touches network`, `touches file`) so review tools and agents see boundaries clearly.

## Why not generic Result?

A generic `Result<T, E>` primitive is **deferred**. Domain variants stay precise:

- Case names document business meaning (`Succeeded`, `Failed`, `Declined`)
- Payload fields are typed per case
- Emit and repair hints stay local to your module

## See also

- [Types](/point/language/types)
- [Labels](/point/language/labels)
- [Effects](/point/language/effects)
- [Agent repair — outcome exhaustiveness](/point/ai/repair-plan)
