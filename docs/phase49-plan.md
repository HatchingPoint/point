# Phase 49 — UI kit depth + billing example (adoption burst)

**Status:** Complete — v0.1.41

## Goal

Upgrade admin UI primitives (button, table), finish auth UX (sign-out, login validation), add Stripe interop example.

## Deliverables

### P49-1 Button + sign-out
- [x] `button "Label" clear auth navigate "/path"`
- [x] `pointAuthClearToken()` emit
- [x] Sign-out in saas-app nav

### P49-2 Table primitive
- [x] `table item in data columns a, b link col to path`
- [x] Members list uses table in saas-app

### P49-3 Login validation
- [x] Middleware rejects bad password on `POST /api/login` with 401
- [x] Integration test asserts invalid login

### P49-4 Stripe example
- [x] `examples/billing/stripe-demo.point` — external + action pattern

### P49-5 Docs + ship
- [x] phase49-plan, codex-goal-phase49, roadmap, CHANGELOG
- [x] CI green, bump v0.1.41, tag, push

## Ship

Version **0.1.41**
