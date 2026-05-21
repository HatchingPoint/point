# Phase 20 — Dev Platform

**Status:** Complete.  
**Prerequisite:** Phase 15 exit gate (app shell); Phase 14 exit gate (HTTP).  
**North star:** A new project runs **`point dev`** and gets hot reload, check, test, and deploy story — no hand-written `dev.ts`.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Point principles gate

Every P20 deliverable must pass [point-principles-gate.md](./point-principles-gate.md). `point dev` treats `.point` as source of truth — not a wrapper around hand-written dev scripts.

---

## Success criteria (Phase 20 exit gate)

- [x] **`point dev`** — watch `.point`, rebuild emit, reload server + client (Bun)
- [x] **`point app new`** — scaffold from `examples/full-stack-template/`
- [x] **Full-stack template** — layout, 3 pages, routes, actions, tests, `point.json`, README
- [x] **Integration test harness** — `point test integration` hitting HTTP routes and WS
- [x] **Package registry service** — Phase 13 registry documented (npm + GitHub Packages); hosted index manual
- [x] **`point deploy` spike** — emit + instructions for Bun/Vercel deploy (not platform-specific magic)
- [x] `bun run ci` passes

---

## P20-1 — `point dev`

- [x] File watcher on project graph
- [x] Incremental check + emit
- [x] Bun server restart or HMR for views
- [x] `--port` flag
- [x] Tests

---

## P20-2 — Full-stack template

- [x] `examples/full-stack-template/` — extractable repo
- [x] Dashboard demo from Phase 15
- [x] Database interop docs (`std.sql` + external drivers)
- [x] `point app new myapp` copies template

---

## P20-3 — Integration tests

- [x] `integration test` blocks or convention `test integration ...`
- [x] HTTP assert helpers in std
- [x] CI job runs integration harness via `bun test`

---

## P20-4 — Registry service (Phase 13 completion)

- [x] GitHub Packages + public npm documented for `point add npm:@scope/pkg`
- [x] Full publish → consume workflow in ecosystem docs
- [x] `@hatchingpoint/point-logic` as reference package
- [ ] Hosted Point package index (manual catalog / future service)

---

## P20-5 — Deploy spike

- [x] `point build --production` — optimized emit bundle
- [x] Docs for Bun single-binary, Vercel static+serverless, database wiring via actions
- [x] No Surgent-specific deploy

---

## Parallel tracks

```text
Wave 1:  P20-1, P20-2
Wave 2:  P20-3, P20-4, P20-5
```

---

## After Phase 20

Phase 21 — Hardening and conformance at scale.
