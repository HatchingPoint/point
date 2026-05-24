# Language primitive audit (Phase 22)

**Date:** 2026-05-21  
**Scope:** Author-facing type and value primitives for application-agnostic Point programs.  
**Outcome:** Document workarounds today; defer implementation to Phase 23 unless a spike is trivial.

---

## Summary

Point’s semantic blocks cover most product logic. Gaps appear when authors need **associative data**, **money**, **typed failures**, or **first-class dates** without dropping to `external` shims. None of these block general-purpose use — they add friction compared to TypeScript or Python.

| Primitive | Status | Phase 22 decision |
|-----------|--------|-------------------|
| `Map<K,V>` / dict | **Shipped** (Phase 23) | **`Map<Text, T>` shipped** |
| Money / decimal | `Int` only | **`Pattern shipped`** — cents-as-Int + `float-money-field` lint |
| Rich errors / `Result` | Pattern shipped (variant-first) | **`Pattern shipped (variant-first)`** — generic `Result` still deferred |
| Author-facing dates | **`Instant`** + **`Duration`** (whole seconds); timezones deferred | **`Instant + Duration`** (partial timezone defer) — use `std.time`; host/actions for TZ |

---

## Map / dictionary

### Today

- Records model fixed field sets (`record Cart Item`).
- Lists model ordered collections (`List<Cart Item>`).
- **`Map<Text, T>`** models string-keyed maps (`map { … }`, `lookup map key`).

### Workarounds

1. **Record of optional fields** when keys are a fixed small set (still fine for closed key sets).
2. **`List<{ key: Text, value: T }>`** with a calculation to find by key (fine for small maps).
3. **`external` + JSON** — parse objects in an `action` and return a record or list (`std.json`).
4. **Database** — keyed rows via `std.sql` in actions; views load through `load data from action`.

### Examples

- `examples/app/notes/notes.point` — persisted rows, not in-memory maps
- `examples/tools/yaml-config.point` — config as structured text via stdlib

### Recommendation

**Shipped (Phase 23).** Prefer `Map<Text, T>` plus `lookup …` for associative data; see [`types` guide](./site/language/types.md) and catalog examples.

---

## Money / decimal

### Today

- `Int` and `Float` only.
- Ecommerce examples use integer cents (`unit price: Int` in `examples/cart-total.point`).

### Workarounds

1. **Integer minor units** — store cents; format in labels (`when total >= 10000`).
2. **`external` money library** — wrap `dinero.js`, `decimal.js`, or Python `Decimal` in an `action`.
3. **Calculations** — keep arithmetic in Int with documented scale factor.

### Examples

- `examples/cart-total.point` — line totals in Int
- `examples/adopters/starter-labs/subscription-tier.point` — pricing tiers without floats

### Recommendation

**Pattern shipped.** Use integer minor units + **`std/money`** helpers; the checker flags `float-money-field` when money-shaped labels use `Float`. A real `Decimal`/`Money` primitive remains deferred.

---

## Typed errors / Result

### Today

- Compiler diagnostics (`check-json`) for static errors.
- Runtime failures surface as host exceptions from actions/workflows.
- No author-facing `Result<T, E>` or `try`/`catch` blocks.

### Workarounds

1. **Domain records** — `record Payment Error` with `code: Text`, `message: Text`.
2. **Labels** — classify error codes to user-facing text.
3. **Actions return unions** — `output result: Payment Ok | Payment Error` via `variant` (when payload shapes differ).
4. **Policies** — guard inputs before actions run.

### Examples

- `examples/variants/order-status.point` — tagged unions for domain states
- `examples/policy.point` — declarative guards

### Recommendation

**Pattern shipped (variant-first).** A generic `Result<T, E>` or `on failure return` on calculations would still need desugar + emit across JS and Python. Until/unless that lands, **`variant`** + labels are the idiomatic Point pattern.

### Today

- **`Instant`** — opaque UTC timestamp type (ISO string at runtime via `std.time`).
- **`Duration`** — opaque elapsed time type (integer seconds at runtime via `std.time`); combine with **`std.time`** (`duration from seconds`, `duration to seconds`, `duration from minutes`) instead of unexplained integer fields.
- **`std.time`** — instants (`instant now`, `format instant`, `parse instant`), durations (`duration from seconds`, `duration to seconds`, `duration from minutes`), plus legacy `current time` (`Text`).

### Workarounds (legacy / advanced)

1. **`Text` ISO timestamps** when you only need strings, not typed instants.
2. **`schedule`** for intervals (dev/demo; production cron on host).
3. **`external`** — `Temporal`, `date-fns`, or Python `datetime`.

### Examples

- `examples/tools/instant-demo.point` — `Instant` records + format
- `examples/tools/duration-demo.point` — `Duration` on records via `std.time`
- `examples/tools/health-check-schedule.point` — periodic jobs
- Actions in workflow examples using host time indirectly

### Recommendation

**`Instant`** and **`Duration`** are shipped (`Duration` stores **whole seconds**). Optional follow-up: finer-than-second wall-clock math or centralized IANA TZ rules — keep those in **`action`** / **`external`** boundaries rather than baking them into expressions.

Avoid timezone logic in the language core — keep in actions.

---

## What is already sufficient

| Need | Point answer |
|------|----------------|
| Product logic | `record`, `calculation`, `rule`, `label`, `variant` |
| HTTP | `route`, `middleware`, `stream route` |
| UI | `view`, `page`, `layout`, `navigation` |
| Async / jobs | `workflow`, `schedule`, `command` |
| Agents | `pipeline`, `session`, `prompt`, `guard` |
| IO boundaries | `external`, `action`, `policy`, `std.*` |
| Multi-file | `module`, `use`, `point add` |

---

## Phase 23 candidates (implementation)

1. `Map<Text, T>` with lookup syntax and emit parity ✓
2. `Money` or scaled decimal type with lint rules for raw `Float` on money fields ✓
3. `Instant` type wired to `std.time` ✓
4. Spec + conformance fixture per new primitive ✓

---

## See also

- [phase22-plan.md](./phase22-plan.md)
- [language-spec.md](./language-spec.md)
- [Types guide](./site/language/types.md)
