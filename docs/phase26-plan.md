# Phase 26 — Language ergonomics & deeper checking

**Status:** Active  
**Prerequisite:** Phase 25 Wave 2 complete (v0.1.17 — theme, vercel-app, build-app `.tsx`).  
**North star:** Reduce the highest-friction author and agent failures measured in repair benchmarks and adoption postmortems — without breaking semantic-block authoring or adding host-framework boilerplate.

**Evidence base:** [language-primitive-audit.md](./language-primitive-audit.md), [benchmarks/agent-repair-cases.json](../benchmarks/agent-repair-cases.json), [point-principles-gate.md](./point-principles-gate.md).

---

## Problem statement

Point’s grammar is broad (20+ block kinds). The biggest **language** gaps today are:

1. **Field naming friction** — spaced identifiers vs camelCase (`unknown-field` ≈ 36% of agent-repair cases)
2. **Shallow cross-block typing** — wiring checkers exist; variant exhaustiveness and step I/O do not
3. **`Maybe<T>` ceremony** — no narrowing sugar (`nullable-field-access`)
4. **UI modifier gaps** — tab/layout slot renders cannot use semantic style modifiers (Phase 25 deferred)
5. **Async/load idioms** — correct but unfamiliar (`missing-await` ≈ 21% of repair cases)

Phase 26 addresses (1)–(4) in Wave 1–2 and (5) in Wave 2. ORM, SSR, and full `Result<T,E>` remain **non-goals**.

---

## Success criteria (Phase 26 exit gate)

- [x] **Field alias resolution** — camelCase property access resolves to spaced record fields when unambiguous; diagnostics include fuzzy “did you mean” when not
- [x] **Variant exhaustiveness** — `on Case` dispatch reports `missing-variant-case` for uncovered cases
- [x] **`Maybe` presence narrowing** — `when <expr> present` / `when <expr> is none` narrows type in branch; improved `nullable-field-access` repair
- [ ] **Tab + layout slot modifiers** — `tab "X" render muted "..."` and `slot main render padded view()` parse and emit like view renders
- [ ] **Pipeline step I/O** (Wave 2) — checker validates step output record fields match next step input where declared
- [ ] **Money lint** (Wave 2) — optional diagnostic when Float used on `*price*` / `*amount*` / `*cents*` named fields
- [ ] **Load-data repair** (Wave 2) — `missing-await` in views suggests exact `load data` fix with field name
- [ ] General examples + agent-repair fixtures for each feature
- [ ] `bun test`, `point check-docs`, principles gate per deliverable
- [ ] Patch release **v0.1.18+**

---

## Non-goals

- Full `Result<T,E>` / try-catch across emit targets
- ORM, migrations, owned database runtime
- SSR / second UI emit backend
- Optional chaining operator (`?.`) — use presence narrowing instead
- Changing spaced identifier authoring model (aliases at **access** only)

---

## Workstreams

### P26-1 — Field access aliases & fuzzy diagnostics (Wave 1)

**Scope:** In `check.ts` property resolution, accept camelCase identifiers that uniquely map to a spaced field name on the record. When still unknown, rank `expected` fields by edit distance / token overlap and append `Did you mean "monthly price"?` to repair.

**Deliverables:**

- `fieldAliasCandidates(recordFields, accessName)` helper (new module or `semantic/naming.ts`)
- Checker resolves `input.monthlyAmount` → `monthly price` when unambiguous
- Ambiguous camelCase → error with candidates list
- Extend agent-repair benchmark export if new fixture needed
- Tests: `tests/field-alias.test.ts` + extend existing repair fixtures
- Docs: `docs/site/reference/diagnostics.md` — `unknown-field` section

**General example:** Fix pattern in `examples/catalog/price-lookup.point` comment or small calc showing alias acceptance.

---

### P26-2 — Variant exhaustiveness (Wave 1)

**Scope:** When a label/rule/calculation uses `on <Case> return ...` dispatch on a variant-typed input, require all declared cases handled. Emit `missing-variant-case` with repair listing uncovered cases.

**Deliverables:**

- Track covered cases per dispatch site in `check.ts` or new `check-variants.ts`
- Works for `label`, `rule`, `calculation` bodies with `on Case` syntax
- `point index` / `explain` coverage for new diagnostic
- Example: extend `examples/variants/order-status.point` with intentional exhaustiveness demo
- Tests: `tests/variant-exhaustiveness.test.ts`

---

### P26-3 — `Maybe` presence narrowing (Wave 1)

**Scope:** Add condition forms `when <expr> present` and `when <expr> is none` (and `otherwise`) in label/rule/calculation/view guard contexts. Narrow `Maybe<T>` to `T` in the `present` branch.

**Deliverables:**

- Parse in semantic expressions / statement guards
- Checker narrows scope in branches; `nullable-field-access` only when not narrowed
- Emit unchanged logic (desugar to null checks in JS/TS/Python)
- Example: `examples/tools/maybe-narrow.point` (general, not factory-themed)
- Tests: `tests/maybe-narrowing.test.ts`
- Docs: `docs/site/language/types.md` — Maybe section

---

### P26-4 — Tab & layout slot style modifiers (Wave 1)

**Scope:** Reuse `parseStylePrefix` in tab lines and layout slot render lines (same closed modifier set as views).

**Deliverables:**

- Update `parse.ts` tab and layout slot parsers
- `check-views.ts` validates modifiers on tabs
- Emit uses existing `resolveViewWrapperClassName`
- Update vercel-app template tabs to use `render muted` where desired
- Tests in `tests/semantic-view-style.test.ts`
- Docs: `docs/site/language/ui.md` — Tabs section

---

### P26-5 — Pipeline step I/O checking (Wave 2)

**Scope:** For `pipeline` blocks, when step B declares `input` matching step A `output` record names, verify field compatibility (names + types). Report `pipeline-step-type-mismatch` with repair.

**Deliverables:**

- `check-pipelines.ts` extension
- Example in `examples/pipelines/document-ingest.point` or new neutral fixture
- Tests: `tests/pipeline-step-types.test.ts`

---

### P26-6 — Money field lint (Wave 2)

**Scope:** Soft warning (or error in strict mode later) when a field name matches money heuristics (`price`, `amount`, `cents`, `cost`) and type is `Float`. Suggest `Int` cents + `std/money`.

**Deliverables:**

- `check-money-lint.ts` or section in `check.ts`
- Diagnostic `float-money-field` with repair pointing to `std/money.point`
- Docs: `docs/site/language/types.md`

---

### P26-7 — View load-data repair hints (Wave 2)

**Scope:** When `missing-await` fires on an action call inside a view that could use `load data`, repair includes exact suggested block:

```point
load data from action <name> field data type <T>
when loading render "..."
```

**Deliverables:**

- `check-data-load.ts` enhancement
- Agent-repair fixture pair in `tests/fixtures/agent-repair/`
- Re-export benchmark cases

---

## Parallel execution

| Wave | Agents | Goals |
|------|--------|-------|
| **1** | 4 parallel | P26-1, P26-2, P26-3, P26-4 |
| **2** | 3 parallel | P26-5, P26-6, P26-7 |

Wave 2 starts after Wave 1 tests green on `main`.

---

## Sanity check

```bash
bun test tests/field-alias.test.ts tests/variant-exhaustiveness.test.ts tests/maybe-narrowing.test.ts tests/semantic-view-style.test.ts
bun test tests/fixtures/agent-repair/
bun packages/point/src/cli.ts check-docs
bun run ci
```

---

## After Phase 26

- **Phase 27 candidates:** Record-backed schema stub, middleware signature vs route validation, view runtime source maps, theme toggle API
- Update [language-primitive-audit.md](./language-primitive-audit.md) with closed gaps

---

## Agent dispatch

See [codex-goal-phase26.md](./codex-goal-phase26.md).
