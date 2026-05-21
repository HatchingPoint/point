# Phase 11 — Ecosystem & stdlib

**Status:** Complete (v0.0.13).  
**Prerequisite:** Phase 10 complete.

**North star:** Point projects depend on other Point packages and a real stdlib — not ad-hoc relative imports and missing npm shims.

---

## Success criteria (Phase 11 exit gate)

- [x] **`point add`** resolves `workspace:` and `file:` dependencies into `point.lock`
- [x] **`@hatchingpoint/point-logic`** publishes from CI on tag push
- [x] **Std runtime shims** — `@hatchingpoint/point/std/json` and `std/http` exist and work at runtime
- [x] **Richer views** — controlled inputs / callback props in emitted React (P10-2)
- [x] `bun run ci` passes (133 tests)

---

## Wave 2 (completed)

| Goal | Focus |
|------|--------|
| **P10-5** | point-logic npm publish in GitHub Actions |
| **P10-2** | View/page controlled props + event callbacks |
| **P11-1** | `point add` + lockfile resolution |
| **P11-2** | Std runtime shims for json + http |

**Codex goals:** [codex-goal-phase11.md](./codex-goal-phase11.md)

---

## After Phase 11

- Phase 12: Public package registry (`npm:` spec), Open VSX, external starter template
- Phase 12: Python routes/views emit spike
- Long-term: standalone runtime (see native-target-research.md)
