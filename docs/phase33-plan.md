# Phase 33 — Money productization, Python pipelines, Phase 13 close

**Status:** Complete — v0.1.25  
**Prerequisite:** Phase 32 complete (v0.1.24)  
**North star:** Close the highest-friction **general-purpose** gaps: usable money formatting, Python **pipeline** parity for agents, and Phase 13 exit items already implemented but unchecked.

---

## Why now

| Gap | Evidence | Impact |
|-----|----------|--------|
| Money pattern incomplete | `std/money.point` `money display` returns currency code only | Authors still hand-format cents |
| Python pipeline blocked | `UNSUPPORTED_SEMANTIC_KINDS` includes `pipeline` | Agent examples (`document-ingest`) cannot target Python |
| Phase 13 stale | Routes + middleware ship with HTTP tests; checkboxes open | Roadmap analyze keeps Phase 13 active |

---

## Success criteria (Phase 33 exit gate)

- [x] **`std/money` runtime** — `format cents usd` helper in JS + Python shims; `money display` calculation
- [x] **`std/text` int helpers** — `text from int`, `text pad start` for general formatting
- [x] **General example** — `examples/tools/money-demo.point`
- [x] **Python pipeline emit** — helpers + async pipeline functions; conformance + smoke tests
- [x] **Phase 13 closed** — python route checkbox done; standalone template documented
- [x] **Audit note** — Money row → **Pattern shipped (format helpers)**
- [x] `bun run ci` passes; patch release **v0.1.25**

---

## Non-goals

- Full `Money` / `Decimal` primitive type
- Generic `Result<T, E>`
- Python view/page emit (JS target for UI)
- Hosted package registry catalog

---

## File ownership (parallel)

| Wave | Owner files |
|------|-------------|
| A | `std/money.point`, `std/text.point`, `packages/point/src/std/money.ts`, `packages/point/src/std/text.ts`, `python_std/point_std/money.py`, `python_std/point_std/text.py`, `examples/tools/money-demo.point`, money tests |
| B | `emit-python-pipeline.ts`, `emit-python.ts`, pipeline tests, conformance |
| C | `phase13-plan.md`, `phase-roadmap.md`, `docs/site/ecosystem/standalone-template.md`, audit |
