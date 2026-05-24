# Phase 35 — Agent gate, timezone std, LSP imports

**Status:** Complete — v0.1.27  
**Prerequisite:** Phase 34 complete (v0.1.26)  
**North star:** Harden the agent loop in CI, close the timezone audit gap at the std boundary, and make cross-module `use` work in the editor — without new language syntax.

---

## Why now

| Gap | Evidence | Track |
|-----|----------|-------|
| Repair regressions undetected in CI | 26 benchmark cases; no gate beyond `bun test` | **A** |
| Timezone audit deferral | `Instant + Duration` shipped; IANA still external-only | **B** |
| LSP single-file parse | Phase 34 fixed CLI; `analyzePointSource` lacks file path | **C** |

Generic `Result<T,E>` and `Decimal` primitive remain **deferred** (principles gate).

---

## Success criteria (Phase 35 exit gate)

- [x] **P35-1 Agent repair CI gate** — `benchmark:agent-repair:gate` fails CI when sufficiency drops; documented threshold
- [x] **P35-2 Timezone std pattern** — `format instant in timezone` via `std/time` external; `examples/tools/timezone-demo.point`; types guide note
- [x] **P35-3 LSP cross-module use** — LSP passes document URI to parser; hover/check works on `money-demo.point` imports
- [x] `bun run ci` passes; patch release **v0.1.27**

---

## Non-goals

- Generic `Result<T, E>` type in grammar
- `Money` / `Decimal` primitive
- Timezone rules in language core (keep in std/actions)
- Python view/page emit

---

## File ownership (parallel burst)

| Track | Owns | Do not touch |
|-------|------|--------------|
| **A — Agent gate** | `scripts/agent-repair-gate.ts`, `package.json` ci script, `docs/site/ai/repair-plan.md`, `tests/agent-repair-gate.test.ts` | `packages/point/src/semantic/*` |
| **B — Timezone std** | `std/time.point`, `packages/point/src/std/time.ts`, `python_std/point_std/time.py`, `examples/tools/timezone-demo.point`, `docs/site/language/types.md` | `emit-python.ts`, LSP |
| **C — LSP imports** | `packages/point/src/lsp/analyze.ts`, `packages/point/src/lsp/server.ts`, `tests/agent-lsp-cross-module.test.ts` | std/time, scripts |

**Integrator (after waves):** CHANGELOG, version bump, `phase35-plan.md` checkboxes, `phase-roadmap.md`, `codex-progress.md`.

---

## After Phase 35

- Phase 36 candidate: `Result` pattern productization (docs + `is error` calc helper) or Decimal spike
- Optional: `use std.*` lock resolution without `from` path
