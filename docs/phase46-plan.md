# Phase 46 — Real SaaS path (adoption burst)

**Status:** Complete — v0.1.38

## Goal

Close the gap between “template looks production-shaped” and “stranger gets members from SQLite.”

## Deliverables

### P46-1 SQL-backed members
- [x] `sqlJsonRowsList` std runtime helper
- [x] `fetch members` decodes `query member rows` via external typed as `List<Member>`
- [x] Remove `sample members()` from saas-app fetch path

### P46-2 Build inlining
- [x] `point build` / `build-js` uses `programWithDependencyDeclarations` (self-contained JS)
- [x] Test: saas-app build has no `./auth` sibling imports

### P46-3 E2E integration
- [x] Integration test init db → serve → GET members returns seeded rows
- [x] Uses `point build` output (not manual graph emit)

### P46-4 Pilot + docs
- [x] phase46-plan, codex-goal-phase46, roadmap, external pilot checklist
- [ ] Adoption postmortem v4 addendum (after real pilot)

### P46-5 Ship
- [x] CI green, bump v0.1.38, tag, push, publish

## Ship

Version **0.1.38**
