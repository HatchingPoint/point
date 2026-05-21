# Phase 13 — Registry & Python surface

**Status:** In progress — registry documented (P20-4); Python route spike and standalone template remain.  
**Prerequisite:** Phase 12 complete (v0.0.15).  
**Platform context:** [platform-vision-plan.md](./platform-vision-plan.md) — Phase 13 can run in parallel with Phase 14; full Python parity continues in Phase 19.

**North star:** Discover and install Point packages from a registry; emit Python for routes (spike).

---

## Success criteria (Phase 13 exit gate)

- [x] **Point package registry** — documented: npm + GitHub Packages via `point add npm:` ([point-add.md](./site/ecosystem/point-add.md), [npm-packages.md](./site/ecosystem/npm-packages.md)); hosted catalog remains manual / future
- [ ] **Python route emit spike** — one route block → Python handler
- [ ] **Starter template as standalone repo** — optional extract from monorepo
- [ ] `bun run ci` passes

---

## Non-goals

- Owned VM / native binary
- Full Next.js replacement
