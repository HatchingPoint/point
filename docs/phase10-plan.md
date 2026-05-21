# Phase 10 — Language depth & UI/Python parity

**Status:** Active — launch parallel Codex agents.  
**Prerequisite:** Phase 9 complete (v0.0.12).

**North star:** Authors write richer apps in Point — UI without raw React boilerplate, Python for scripts/services beyond pure logic, and a growing stdlib/ecosystem.

---

## Success criteria (Phase 10 exit gate)

- [ ] **`page` or `layout` block spike** — one docs or app page authored in Point, embedded in Next.js
- [ ] **Python emit for actions** — at least one `action` block in an example emits runnable Python
- [ ] **`point build-py-all`** — batch Python emit for pure-logic fixtures
- [ ] **Publish `@hatchingpoint/point-logic@0.0.2`** (or patch) with CI proof
- [ ] **Stdlib bridge doc** — how Point calls npm/Python externals in production
- [ ] **LandingPage committed** — docs sync + routes pushed (build verified separately in deploy CI)

---

## Parallel tracks

```text
Track A — UI            P10-1 page/layout spike, P10-2 richer view props
Track B — Python        P10-3 action emit, P10-4 build-py-all
Track C — Ecosystem     P10-5 point-logic publish pipeline, P10-6 stdlib bridge doc
Track D — Docs live     P10-7 LandingPage deploy + embed readiness widget
```

Launch **P10-1 + P10-3 + P10-4 + P10-7** in parallel (four sessions).

**Codex goals:** [codex-goal-phase10.md](./codex-goal-phase10.md)  
**Router prompt:** [codex-goal-phase10.prompt.txt](./codex-goal-phase10.prompt.txt)

---

## Non-goals (this round)

- Full Next.js replacement in Point
- Native VM / WASM production target
- Public package registry (Phase 11)
- Self-hosting compiler in Point

---

## After Phase 10

- Phase 11: Point package registry + `point add`
- Phase 12: Standalone runtime research → prototype
