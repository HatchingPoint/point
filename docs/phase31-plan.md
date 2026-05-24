# Phase 31 — Typed domain errors (variant-first)

**Status:** Draft — not started  
**Prerequisite:** Phase 26 variant exhaustiveness shipped; Phases 28/29/30 may still be active — run **after** 28/29 exit gates or in a dedicated chat with file ownership respected  
**North star:** Authors model success and failure with **`variant` + `label` + action outputs** — not host `try/catch`, not a generic `Result<T, E>` type parameter.

---

## What this phase closes

The [language-primitive-audit.md](./language-primitive-audit.md) defers a full **`Result<T, E>`** primitive. Phase 31 **does not add it**. Instead it **productizes the idiomatic Point pattern** already used in:

- `examples/variants/order-status.point` — tagged domain states + `label` dispatch
- `std/process.point` — `Process Result or Error` on actions (Phase 2 union syntax)
- Workflow/pipeline — `on failure return` for step boundaries

Phase 31 makes **variant-first outcomes** first-class in the checker, emit, docs, and agent loop — so agents and authors reach for semantic blocks, not thrown exceptions.

---

## Design stance (not try/catch)

| Approach | Phase 31 |
|----------|----------|
| `variant Payment Outcome` with `Succeeded` / `Failed with …` | **Yes — primary pattern** |
| `label` blocks mapping cases → user-facing `Text` | **Yes — document + verify emit** |
| Action `output result: Payment Outcome` | **Yes — checker + exhaustiveness** |
| Simple `User or Error` on IO boundaries | **Already shipped (Phase 2)** — extend docs only |
| Host `try/catch` / `throw` in author source | **Non-goal** |
| Generic `Result<T, E>` type in grammar | **Non-goal** — audit deferral stands |

---

## Why sequential (after 28/29/30)

| Track | Primary files |
|-------|----------------|
| Phase 28 | agent-repair fixtures, benchmarks, index/explain |
| Phase 29 | emit-python, python_std |
| Phase 30 | emit-sql-schema, build-schema |
| **Phase 31** | variant/outcome checking, action output unions, calculation `on failure`, emit union parity, domain-error examples |

Low overlap if ownership respected. Phase 28 may still own generic repair fixture expansion; Phase 31 adds **outcome-specific** conformance only.

---

## Principles

Same as [point-principles-gate.md](./point-principles-gate.md):

- **Semantic** — outcomes are `variant` cases, not stringly-typed error codes in calculations
- **Block family** — extend `variant`, `label`, `action`, `calculation`; no new catch syntax
- **Agent loop** — new diagnostics → semantic refs, repair hints, index/explain
- **General proof** — ecommerce or payment example (neutral domain, not product-specific)
- **Boring emit** — tagged unions / discriminated records in JS/TS/Python — no exception-driven control flow in generated glue for domain paths

---

## Success criteria (Phase 31 exit gate)

- [ ] **Outcome variant convention** — documented pattern: `variant <Domain> Outcome` with success/failure cases; spec section in `docs/site/language/types.md`
- [ ] **Action output variant checking** — actions declaring `output result: Some Outcome` get exhaustiveness when callers `on Case` dispatch (reuse/extend P26-2)
- [ ] **Calculation `on failure return`** — calculations may declare `on failure return <expr>` for domain fallbacks (workflow/pipeline parity); checker + emit for JS/TS/Python
- [ ] **Label ↔ outcome wiring** — `label` blocks over outcome variants emit readable message helpers; tests for `order-status`-style example
- [ ] **Python emit parity** — variant outcome actions emit discriminated shapes (dataclass/TypedDict or documented dict tag) in `emit-python.ts`
- [ ] **General example** — `examples/variants/payment-outcome.point` (or extend order-status) with action returning outcome variant + label for UI copy
- [ ] **Agent loop** — at least 2 domain-outcome diagnostics or repair fixtures (e.g. missing outcome case, invalid `on failure return` type)
- [ ] `bun run ci` passes; patch release **v0.1.23+** (integrator after prior phases)

---

## Non-goals

- `try/catch`, `throw`, `Result<T,E>` generic type
- Replacing compiler `check-json` diagnostics with runtime error types
- Agent repair benchmark expansion (Phase 28) — Phase 31 adds outcome-specific fixtures only
- SQL schema (30), Python std mirror (29), theme/view (27)

---

## Workstreams

### P31-1 — Outcome variant spec + example (Wave 1)

- Document variant-first error pattern in `docs/site/language/types.md` and `language-primitive-audit.md` (close "Rich errors" row as **pattern shipped**, not new primitive)
- Add `examples/variants/payment-outcome.point`: `variant Payment Outcome`, action simulating charge, `label` for receipt/error copy
- Tests: parse, check, emit snapshot for outcome action + label

**Touch:** docs, examples, tests — minimal checker changes if example passes today

---

### P31-2 — Action output exhaustiveness (Wave 1)

- When action `output` is a variant type, callers using `on Case` must cover all cases (extend variant exhaustiveness to action return paths)
- Diagnostic `action-outcome-not-exhaustive` with semantic ref + repair
- Index/explain entries

**Touch:** `check.ts` / variant checker modules, `semantic/context.ts`, tests

**Do not touch:** agent-repair bulk expansion (28)

---

### P31-3 — Calculation `on failure return` (Wave 2)

- Parse/check/emit `on failure return` on **calculations** (already on workflow/pipeline steps)
- Type-check failure expression against calculation output type
- Emit: early return or conditional in JS/TS; Python equivalent

**Touch:** `parse.ts`, checker, `emit*.ts`, tests

---

### P31-4 — Python parity + agent fixtures (Wave 2)

- Python emit for variant outcome returns (tag field convention documented)
- 2 broken/fixed `.point` pairs under `tests/fixtures/agent-repair/` for outcome exhaustiveness (register in export script)
- `bun run ci` green

**Touch:** `emit-python.ts`, fixtures, tests

---

## File ownership

**Phase 31 only:**

- Variant/outcome checking (extend P26-2 paths)
- Calculation `on failure return` parse/check/emit
- `examples/variants/payment-outcome.point`, outcome-specific fixtures
- `docs/site/language/types.md`, audit doc update for Rich errors row

**Do not touch (28/29/30):**

- Bulk agent-repair expansion, benchmarks gate (28)
- `emit-python.ts` std wiring, `python_std/` (29) — except outcome return emit in P31-4
- `emit-sql-schema.ts`, `build-schema` (30)

---

## After Phase 31

- **Phase 32 (candidate):** Map / dict primitive — if author friction remains after data + outcomes solid
- **Phase 32 (alternate):** Money type productization (audit gap; cents-as-Int documented today)
- Update [language-primitive-audit.md](./language-primitive-audit.md): Rich errors → **Pattern shipped (variant-first)**; generic `Result<T,E>` remains deferred

---

## Agent dispatch

See [codex-goal-phase31.md](./codex-goal-phase31.md).
