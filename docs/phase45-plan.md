# Phase 45 — SaaS depth + repair gate (adoption burst)

**Status:** Complete — v0.1.37

## Goal

Make the saas-app template production-shaped: SQL-backed members, auth-bearer in the repair benchmark, integration tests, and a one-command pilot path from scaffold to deploy.

## Deliverables

### P45-1 SQL wiring
- [ ] `action fetch members` reads from `query member rows` instead of `sample members()`
- [ ] `GET /api/members` route awaits SQL-backed fetch
- [ ] `members list` view loads from action (dashboard pattern)

### P45-2 Auth-bearer benchmark
- [ ] `auth-bearer` case exported in `benchmarks/agent-repair-cases.json`
- [ ] `scripts/agent-repair-sufficiency.ts` gate min single-shot 22 → 23

### P45-3 SaaS integration test
- [ ] `tests/saas-app-integration.test.ts` — health, members GET, POST auth 401/201
- [ ] Wired in CI via `bun run ci`

### P45-4 Pilot quickstart
- [x] `scripts/pilot-quickstart.sh` — create → check → demo → init db → next steps (serve, deploy)

### P45-5 Docs + ship
- [x] `docs/phase45-plan.md`, `docs/codex-goal-phase45.md`, `docs/phase-roadmap.md`
- [x] CHANGELOG v0.1.37, version bump, tag, push when CI green

## Ship

Version **0.1.37**
