# Phase 11 — Ecosystem & stdlib

**Status:** Active — Wave 2 parallel agents.  
**Prerequisite:** Phase 10 wave 1 complete (page block, build-py-all, action emit, bridge docs).

**North star:** Point projects depend on other Point packages and a real stdlib — not ad-hoc relative imports and missing npm shims.

---

## Success criteria (Phase 11 exit gate)

- [ ] **`point add`** resolves `workspace:` and `file:` dependencies into `point.lock`
- [ ] **`@hatchingpoint/point-logic`** publishes from CI on tag (or documented workflow)
- [ ] **Std runtime shims** — `@hatchingpoint/point/std/json` and `std/http` exist and work at runtime
- [ ] **Richer views** — controlled inputs / callback props in emitted React (P10-2)
- [ ] `bun run ci` passes

---

## Wave 2 (launch now)

| Goal | Focus |
|------|--------|
| **P10-5** | point-logic npm publish in GitHub Actions |
| **P10-2** | View/page controlled props + event callbacks |
| **P11-1** | `point add` + lockfile resolution |
| **P11-2** | Std runtime shims for json + http |

**Codex goals:** [codex-goal-phase11.md](./codex-goal-phase11.md)

---

## After Phase 11

- Phase 12: Public package registry, Open VSX, external starter template
- Phase 12: Python routes/views emit spike
- Long-term: standalone runtime (see native-target-research.md)
