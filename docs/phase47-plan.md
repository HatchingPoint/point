# Phase 47 — Credible SaaS CRUD (adoption burst)

**Status:** Complete — v0.1.39

## Goal

Close the demo gaps: POST persists to SQLite, JWT secret from env, onboarding smoke proves SQL members.

## Deliverables

### P47-1 POST member INSERT
- [x] `action insert member` with INSERT ... RETURNING
- [x] `sqlJsonMemberRow` std runtime helper
- [x] Route returns persisted member

### P47-2 Env-backed JWT
- [x] Fix `env with default` in std/env
- [x] `Maybe<Text>` narrowing in checker
- [x] saas-app `jwt secret` reads `JWT_SECRET` with demo fallback

### P47-3 Onboarding + integration smoke
- [x] Onboarding smoke asserts Alex Chen in `/api/members`
- [x] Integration test POST persists + GET lists 4 members

### P47-4 Deploy env
- [x] `render.yaml` — `DATABASE_URL`, `JWT_SECRET`

### P47-5 Docs + ship
- [x] phase47-plan, codex-goal-phase47, roadmap
- [ ] Adoption postmortem v4 (after real pilot)
- [x] CI green, bump v0.1.39, tag, push

## Ship

Version **0.1.39**
