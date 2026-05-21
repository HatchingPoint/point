# Phase 12 — Ecosystem scale

**Status:** Active — Wave 1 parallel agents.  
**Prerequisite:** Phases 10–11 complete (v0.0.13).

**North star:** Third parties can adopt Point without touching this monorepo — registry deps, full stdlib shims, credible runtime path.

---

## Success criteria (Phase 12 exit gate)

- [x] **`npm:` dependency resolution** in `point add` (install + lock path under `node_modules/`)
- [ ] **Remaining std shims** — `text`, `time`, `fs`, `env`
- [x] **Standalone runtime spike** — research doc + run bridge (NOT full VM)
- [ ] **External starter template** repo (100% `.point` app) — Wave 2
- [ ] **Open VSX** publish — Wave 2
- [ ] **Live readiness demo** on hatchingpoint.com/point/examples — Wave 2
- [ ] `bun run ci` passes

---

## Wave 1 (launch now)

| Goal | Focus | Realistic today? |
|------|--------|------------------|
| **P12-1** | `npm:` in `point add` | ✅ yes |
| **P12-2** | std fs/env/time/text shims | ✅ yes |
| **P12-3** | Runtime research + run bridge spike | ✅ spike only |
| **P12-4** | `point add` docs page | ✅ yes |

**Not today:** owned VM, WASM production target, full registry service.

**Codex goals:** [codex-goal-phase12.md](./codex-goal-phase12.md)

---

## After Phase 12

- Package registry service (Phase 13)
- Python routes/views emit
- Native binary (multi-year)
