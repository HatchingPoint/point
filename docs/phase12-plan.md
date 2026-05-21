# Phase 12 — Ecosystem scale

**Status:** Complete (v0.0.15).  
**Prerequisite:** Phases 10–11 complete.

**North star:** Third parties can adopt Point without touching this monorepo — registry deps, full stdlib shims, credible runtime path.

---

## Success criteria (Phase 12 exit gate)

- [x] **`npm:` dependency resolution** in `point add`
- [x] **Std runtime shims** — json, http, fs, env, time, text
- [x] **Standalone runtime spike** — research doc + in-memory `point run --bundle`
- [x] **External starter template** — `examples/starter-template/`
- [x] **Open VSX** publish pipeline
- [x] **Live readiness demo** on hatchingpoint.com/point/examples
- [x] **point-logic ships `.point` source on npm** — `@hatchingpoint/point-logic@0.0.3+`
- [x] `bun run ci` passes (150 tests)

---

## After Phase 12

- Phase 13: Package registry service, Python routes/views emit
- Long-term: Native binary (multi-target-research.md)
