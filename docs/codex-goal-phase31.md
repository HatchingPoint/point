# Codex goals — Phase 31 (Typed domain errors, variant-first)

**Prerequisite:** Phase 26 variant exhaustiveness shipped. Prefer starting **after** Phase 28/29 exit gates; if parallel, read [phase31-plan.md](./phase31-plan.md) file ownership first.

**Do not touch:** bulk agent-repair expansion (28), Python std wiring (29), SQL schema (30).

**North star:** Variant + label + action outputs — **not** try/catch or `Result<T, E>`.

**Principles gate:** [point-principles-gate.md](./point-principles-gate.md) — append gate line to every checkpoint.

---

## Wave 1

```
/goal Execute docs/phase31-plan.md P31-1: Document variant-first outcome pattern in docs/site/language/types.md. Add examples/variants/payment-outcome.point with Payment Outcome variant, action, and label. Tests for parse/check/emit. Update language-primitive-audit Rich errors row. Append codex-progress. Do NOT commit unless user asked.
```

```
/goal Execute docs/phase31-plan.md P31-2: Action output variant exhaustiveness — action-outcome-not-exhaustive diagnostic, index/explain, tests. Extend P26-2 paths for action return dispatch. Append checkpoint.
```

---

## Wave 2

```
/goal Execute docs/phase31-plan.md P31-3: Calculation on failure return — parse/check/emit parity with workflow steps. JS TS Python emit. tests/calculation-on-failure.test.ts. Append checkpoint.
```

```
/goal Execute docs/phase31-plan.md P31-4: Python variant outcome emit parity. 2 outcome-specific agent-repair fixture pairs. bun run ci. Append checkpoint.
```

---

## Integrator (after Wave 1+2)

```
/goal Phase 31 integrator: bun run ci. Mark phase31-plan.md checkboxes. Update language-primitive-audit.md Rich errors → pattern shipped. Append codex-progress. Follow docs/codex-goal-cursor-overnight.md — patch v0.1.23+ with variant-first domain errors.
```

---

## Goal index (plan checkboxes)

| ID | Checkbox |
|----|----------|
| P31-1 | Outcome variant spec + payment-outcome example |
| P31-2 | Action output exhaustiveness diagnostic |
| P31-3 | Calculation on failure return |
| P31-4 | Python parity + outcome repair fixtures |
| P31-5 | bun run ci + patch release |

Exit gate checkboxes in phase31-plan.md are authoritative.
