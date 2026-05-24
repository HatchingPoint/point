# Phase 43 — Capability depth burst

**Status:** Complete — v0.1.35

## Goal

Horizontal expansion + agent UX + one-click demo.

## Deliverables

### P43-1 std/auth capability
- [x] `std/auth.point`, runtime TS + Python, registry entry (15th capability)
- [x] `examples/tools/auth-demo.point`
- [x] `tests/std-auth.test.ts`

### P43-2 LSP repair enrichment
- [x] Repair step order `[repair N/M]` when multiple diagnostics
- [x] `relatedRefs` surfaced in LSP messages + relatedInformation

### P43-3 point demo + point repair
- [x] `point demo [file]` — golden path with box + next steps
- [x] `point repair` alias for `repair-plan`
- [x] `tests/phase43-burst.test.ts`

### P43-4 Agent repair fixture
- [x] `auth-bearer-broken.point` / `auth-bearer-fixed.point`

### P43-5 Docs
- [x] capabilities.md, golden-app-demo, README, product-map, CLI ref

## Ship

Version **0.1.35**
