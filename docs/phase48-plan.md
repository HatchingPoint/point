# Phase 48 — Login UI + create member (adoption burst)

**Status:** Complete — v0.1.40

## Goal

Close the saas-app UI loop: login form saves Bearer token, create-member form POSTs with auth, deploy smoke proves the path.

## Deliverables

### P48-1 Form submit primitive
- [x] `submit "Label" POST "/api/..." body record` inside `form` blocks
- [x] Optional `with auth`, `save token field token`, `then navigate "/path"`
- [x] Emit auth localStorage helpers + submit button CSS

### P48-2 SaaS login + create member UI
- [x] `POST /api/login` route (demo password hint in UI)
- [x] Login page + create member page in saas-app template
- [x] Nav links; theme `toggle` enabled in template

### P48-3 Deploy smoke
- [x] `scripts/deploy-smoke.sh` — login → POST member → GET 4+ members
- [x] `tests/deploy-smoke.test.ts` wired in CI via `bun test`
- [x] saas integration test covers login flow

### P48-4 Docs + ship
- [x] phase48-plan, codex-goal-phase48, roadmap
- [ ] CI green, bump v0.1.40, tag, push

## Ship

Version **0.1.40**

## Ship

Version **0.1.40**
