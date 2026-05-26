# Point phase roadmap

**Purpose:** Single queue for language expansion. The **phase expansion loop** reads this file, runs `point roadmap-analyze`, and drafts the next `docs/phaseNN-plan.md`.

## Active execution

**Next:** Phase 78 (ops Next scaffold, notes form app-repair) → v0.1.56 — **overnight loops armed**

**Wave shipped (v0.1.55):** 77 notes detail app-repair, agent-app model-eval gate, gate 12

**Wave shipped (v0.1.54):** 76 ops page-size + refresh app-repair, agent-app gate 11

**Wave shipped (v0.1.53):** 75 ops datagrid filter app-repair, agent-app gate 9

**Wave shipped (v0.1.52):** 74 ops datagrid sort app-repair, agent-app gate 8, LandingPage OSS sync

**Wave shipped (v0.1.51):** 73 ops chart app-repair, bind textarea repair gate 35, agent-app gate 7

**Wave shipped (v0.1.50):** 72 agent-app expansion — multistep UI + SSE cases, agent-app gate 6

**Wave shipped (v0.1.49):** 71 SSE route + push dashboard, repair gate 34

## Completed (integrator shipped)

| Phase | Release | Highlights |
|-------|---------|------------|
| **77** | v0.1.55 | Notes detail app-repair, agent-app model-eval gate (no LLM), gate 12 |
| **76** | v0.1.54 | Ops page-size + refresh app-repair, agent-app gate 11 |
| **75** | v0.1.53 | Ops datagrid filter app-repair, agent-app gate 9 — chart/sort/filter trilogy complete |
| **74** | v0.1.52 | Ops datagrid sort app-repair, agent-app gate 8, LandingPage OSS + benchmark sync |
| **73** | v0.1.51 | Ops chart app-repair, invalid-bind-textarea-target, repair gate 35, agent-app gate 7 |
| **72** | v0.1.50 | Agent-app gate 6: ops chart/datagrid/form, SSE live feed feature-add |
| **71–71b** | v0.1.49 | SSE route, subscribe to sse, sse-dashboard example, repair gate 34 |
| **70–70b** | v0.1.48 | Agent plateau: bind select/textarea, toast-without-submit, LSP parity, repair gate 33 |
| **69** | v0.1.47 | Integrator: pagination, metrics chart dashboard, repair gate 31 |
| **68–68b** | (in v0.1.47) | Datagrid page size, job queue chart + combined load |
| **67** | v0.1.46 | Integrator: job queue live UI, chart field check, repair gate 30 |
| **66–66b** | (in v0.1.46) | Job queue datagrid/refresh/toast; invalid-chart-field |
| **65** | v0.1.45 | Integrator: datagrid filter, repair gate 29 |
| **64–64b** | (in v0.1.45) | Datagrid text filter, invalid-datagrid-filter-column repair |
| **62–62b** | (in v0.1.44) | Saas select/toast/datagrid; datagrid sort repair case |
| **61** | v0.1.43 | Integrator: UI kit, chart/datagrid, std.image, agent repair 27, apple toolkit |
| **56–60** | (in v0.1.43) | Form controls, chart/datagrid, std.image, agent repair gate 27, apple toolkit, emit pruning |
| **55** | v0.1.42 | Integrator: job queue, live refresh, std.pty, terminal view |
| **51–54** | (in v0.1.42) | Job queue pattern, live refresh, std.pty, terminal view + script runner |
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
