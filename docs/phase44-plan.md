# Phase 44 — Stranger succeeds (adoption burst)

**Status:** Complete — v0.1.36

## Goal

One path that always works for someone outside the repo: install → create → init DB → check → launch → deploy smoke.

## Deliverables

### P44-1 saas-app template
- [x] `packages/point/templates/saas-app` — auth + SQL + DB init on full-stack admin shell
- [x] `point create --template saas-app` registered in app-cli
- [x] Tests in `tests/app-new-cli.test.ts`

### P44-2 Onboarding smoke
- [x] `scripts/onboarding-smoke.sh` — fresh scaffold, check, launch, build-app, serve health
- [x] `tests/onboarding-smoke.test.ts` wired in CI

### P44-3 Deploy verify
- [x] Serve smoke in onboarding script (health + members API)
- [x] `render.yaml` on saas-app template

### P44-4 External pilot kit
- [x] `docs/external-pilot-checklist.md`
- [x] Adoption postmortem v3 addendum

### P44-5 Docs + publish prep
- [x] golden-app-demo saas path, README, product-map, roadmap
- [ ] Push/tag v0.1.36 when CI green

## Ship

Version **0.1.36**
