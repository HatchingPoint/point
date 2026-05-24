# Phase 13 — Registry & Python surface

**Status:** Complete — Python routes shipped (Phase 19+); standalone template documented (Phase 33).  
**Prerequisite:** Phase 12 complete (v0.0.15).  
**Platform context:** [platform-vision-plan.md](./platform-vision-plan.md) — Phase 13 can run in parallel with Phase 14; full Python parity continues in Phase 19.

**North star:** Discover and install Point packages from a registry; emit Python for routes (spike).

---

## Success criteria (Phase 13 exit gate)

- [x] **Point package registry** — documented: npm + GitHub Packages via `point add npm:` ([point-add.md](./site/ecosystem/point-add.md), [npm-packages.md](./site/ecosystem/npm-packages.md)); hosted catalog remains manual / future
- [x] **Python route emit spike** — route blocks → Python `http.server` handlers with middleware (see `tests/python-route-emit.test.ts`)
- [x] **Starter template as standalone repo** — `point create` ships `full-stack-app` from npm; see [standalone-template.md](./site/ecosystem/standalone-template.md)
- [x] `bun run ci` passes

---

## Non-goals

- Owned VM / native binary
- Full Next.js replacement
