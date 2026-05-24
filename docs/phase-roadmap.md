# Point phase roadmap

**Purpose:** Single queue for language expansion. The **phase expansion loop** reads this file, runs `point roadmap-analyze`, and drafts the next `docs/phaseNN-plan.md`.

## Active execution

**Phase 50** — Pilot + template sync. See [phase-roadmap.md](./phase-roadmap.md) backlog.

## Completed (integrator shipped)

| Phase | Release | Highlights |
|-------|---------|------------|
| **49** | v0.1.41 | Button sign-out, table primitive, login validation, Stripe example |
| **48** | v0.1.40 | Form submit POST, login/create-member UI, deploy smoke, theme toggle in saas-app |
| **47** | v0.1.39 | POST member INSERT, env JWT secret, onboarding SQL smoke, render env vars |
| **46** | v0.1.38 | SQL-backed saas members, build inlining, saas e2e integration |
| **45** | v0.1.37 | SQL action wiring, auth-bearer repair gate, saas integration test, pilot quickstart |
| **44** | v0.1.36 | saas-app template, onboarding smoke CI, std module resolution, external pilot checklist |
| **43** | v0.1.35 | std/auth capability, point demo, LSP repair enrichment, repair alias |
| **42** | v0.1.34 | Application logic terminology, Point-native voice, frontend vs capabilities |
| **40** | v0.1.32 | Presentation alignment — 60-second guide, CLI rings, honest boundaries |
| **39** | v0.1.31 | In-the-box launch: `capabilities` line, `point commands`/`box`/`launch` |
| **38** | v0.1.30 | Emit import pruning, five-minute tour |
| **37** | v0.1.29 | Selective use merge, domain outcomes guide |
| **36** | v0.1.28 | Capabilities shorthand (`use http`), README/product map, docs sync, release script |
| **35** | v0.1.27 | Agent repair CI gate, timezone std pattern, LSP cross-module use |
| **34** | v0.1.26 | Cross-module use resolution, money-demo linked std/money |
| **33** | v0.1.25 | Money format helpers, Python pipeline emit, Phase 13 closed |
| **32** | v0.1.24 | Duration type, std.time helpers, audit sync (Map/Money/errors) |
| **31** | v0.1.23 | Variant-first domain errors, calculation `on failure return`, Python outcome emit |
| **30** | v0.1.22 | SQL productization — FK, dialects, migrations, multi-module schema |
| **28** | v0.1.21 | Agent loop hardening — repair fixtures, LSP parity, diagnostic catalog |
| **29** | v0.1.21 | Python std mirror — build-py, parity, emit target |
| **27** | v0.1.20 | Middleware validation, view source maps, theme toggle, `build-schema` |
| **26** | v0.1.18–0.1.19 | Field aliases, variant exhaustiveness, pipeline I/O, money lint |
| **25** | v0.1.17 | Theme blocks, native UI styling, vercel-app template |

Older phases: see `docs/phase*-plan.md` and [codex-progress.md](./codex-progress.md).

## Candidate backlog (expansion loop maintains)

**Last analyze:** 2026-05-24 — Phase 37 complete.

| Priority | Theme | Evidence | Notes |
|----------|-------|----------|-------|
| 1 | Decimal / Money primitive spike | Audit deferrals | Int-cents pattern exists |
| 2 | Emit import pruning | use merge at check | JS emit still imports whole dep modules |
| 3 | Golden app demo polish | Product map | ✅ Phase 41 golden-app-demo guide |

The expansion loop may **reprioritize**, **merge**, or **split** rows when drafting a new phase.

## Phase expansion loop (meta)

See [codex-goal-phase-expansion.md](./codex-goal-phase-expansion.md).

## Principles

Every proposed phase must pass [point-principles-gate.md](./point-principles-gate.md).  
Primitive gaps must reference [language-primitive-audit.md](./language-primitive-audit.md).
