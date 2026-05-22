# Phase 23 — Language primitives

**Status:** Wave 2 complete (Instant type).  
**Prerequisite:** Phase 22 complete (dedomainized docs + primitive audit).  
**North star:** Close the highest-friction gaps from [language-primitive-audit.md](./language-primitive-audit.md) without breaking semantic-block authoring.

---

## Success criteria (Phase 23 exit gate)

- [x] **`Map<Text, T>`** — type, `map { "key": value }` literals, `lookup map key` expression; JS/TS/Python emit; conformance fixture
- [x] **Money pattern** — `std/money.point` (cents-as-Int record + format calculations) documented in types guide
- [x] **Instant** — opaque type wired to `std.time`; parser resolves `use std.*` callables; conformance fixture
- [x] Spec + site docs updated (`types.md`, `examples/tools/instant-demo.point`)
- [x] `point check-docs` and `bun test` pass

---

## Non-goals

- Full `Result<T,E>` / try-catch blocks (variants + labels remain idiomatic)
- `Map` with non-Text keys (Phase 23 v1: Text keys only)
- Owned decimal type (Money is record + std pattern first)

---

## Workstreams

### P23-1 — `Map<Text, T>` (Wave 1)
Type parsing, map literals, `lookup`, checker, emit parity, `examples/catalog/price-lookup.point`, conformance fixture.

### P23-2 — Money std pattern (Wave 1)
`std/money.point`: `record Money`, add/format/compare in cents; docs in `types.md`.

### P23-3 — Instant type (Wave 2) ✓
Opaque `Instant` + `std.time` bridge (`instant now`, `format instant`, `parse instant`); dependency-aware parse/desugar for multi-word std callables.

### P23-4 — Phase 13 resume (parallel)
Python route spike closure, standalone starter template extract.

---

## After Phase 23

- Patch release v0.1.6+
- Phase 13/19 Python parity with neutral examples
- Optional: `@hatchingpoint/point-logic-catalog` npm package (P22-8)

---

## Agent dispatch

See [codex-goal-phase23.md](./codex-goal-phase23.md).
