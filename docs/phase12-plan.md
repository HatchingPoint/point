# Phase 12 — Ecosystem scale

**Status:** Wave 1 complete — Wave 2 in progress.  
**Prerequisite:** Phases 10–11 complete (v0.0.13).

**North star:** Third parties can adopt Point without touching this monorepo — registry deps, full stdlib shims, credible runtime path.

---

## Success criteria (Phase 12 exit gate)

- [x] **`npm:` dependency resolution** in `point add` (install + lock path under `node_modules/`)
- [x] **Std runtime shims** — json, http, fs, env, time, text
- [x] **Standalone runtime spike** — research doc + in-memory `point run --bundle`
- [x] **External starter template** repo (100% `.point` app) — Wave 2
- [x] **Open VSX** publish — Wave 2
- [x] **Live readiness demo** on hatchingpoint.com/point/examples — Wave 2
- [x] **point-logic ships `.point` source on npm** — Wave 2 (P12-8)
- [x] `bun run ci` passes (148 tests)

---

## Wave 1 (complete)

| Goal | Focus |
|------|--------|
| **P12-1** | `npm:` in `point add` |
| **P12-2** | std fs/env/time/text shims |
| **P12-3** | Runtime research + run bridge spike |
| **P12-4** | `point add` docs page |

## Wave 2 (active)

| Goal | Focus |
|------|--------|
| **P12-5** | External starter template |
| **P12-6** | Open VSX publish |
| **P12-7** | Live readiness demo on LandingPage |
| **P12-8** | point-logic npm tarball includes `.point` source |

**Codex goals:** [codex-goal-phase12.md](./codex-goal-phase12.md)

---

## After Phase 12

- Package registry service (Phase 13)
- Python routes/views emit
- Native binary (multi-year)
