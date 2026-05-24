# Point phase roadmap

**Purpose:** Single queue for language expansion. The **phase expansion loop** reads this file, runs `point roadmap-analyze`, and drafts the next `docs/phaseNN-plan.md`.

## Active execution (implement in Agent `/loop` chats)

_None — pick a draft below or run expansion loop for Phase 32._

## Draft (ready for promotion)

| Phase | Status | Plan | Codex goals |
|-------|--------|------|-------------|
| **32** | Candidate | expansion backlog | Map/dict or Money type (see audit) |

## Completed (integrator shipped)

| Phase | Release | Highlights |
|-------|---------|------------|
| **31** | v0.1.23 | Variant-first domain errors, calculation `on failure return`, Python outcome emit |
| **30** | v0.1.22 | SQL productization — FK, dialects, migrations, multi-module schema |
| **28** | v0.1.21 | Agent loop hardening — repair fixtures, LSP parity, diagnostic catalog |
| **29** | v0.1.21 | Python std mirror — build-py, parity, emit target |
| **27** | v0.1.20 | Middleware validation, view source maps, theme toggle, `build-schema` |
| **26** | v0.1.18–0.1.19 | Field aliases, variant exhaustiveness, pipeline I/O, money lint |
| **25** | v0.1.17 | Theme blocks, native UI styling, vercel-app template |

Older phases: see `docs/phase*-plan.md` and [codex-progress.md](./codex-progress.md).

## Candidate backlog (expansion loop maintains)

**Last analyze:** 2026-05-24 — Phases 28–31 complete; next `nextSuggestedPhaseNumber: 32`.

| Priority | Theme | Evidence | Notes |
|----------|-------|----------|-------|
| 1 | Map / dict primitive | [language-primitive-audit.md](./language-primitive-audit.md) | Author friction post-outcomes |
| 2 | Money type productization | Audit deferral; cents-as-Int today | Optional Phase 32 alternate |
| 3 | Author-facing dates | `Instant` shipped; Duration follow-up | Low priority |

The expansion loop may **reprioritize**, **merge**, or **split** rows when drafting a new phase.

## Phase expansion loop (meta)

See [codex-goal-phase-expansion.md](./codex-goal-phase-expansion.md).

## Principles

Every proposed phase must pass [point-principles-gate.md](./point-principles-gate.md).  
Primitive gaps must reference [language-primitive-audit.md](./language-primitive-audit.md).
