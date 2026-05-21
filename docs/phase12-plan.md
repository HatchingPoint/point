# Phase 12 — Ecosystem scale

**Status:** Planned — not started.  
**Prerequisite:** Phases 10–11 complete (v0.0.13).

**North star:** Third parties can adopt Point without touching this monorepo — registry deps, full stdlib shims, starter template, broader editor distribution.

---

## Success criteria (Phase 12 exit gate)

- [ ] **`npm:` dependency resolution** in `point add` (GitHub/npm packages)
- [ ] **Remaining std shims** — `text`, `time`, `fs`, `env`
- [ ] **External starter template** repo (100% `.point` app)
- [ ] **Open VSX** publish for VS Code extension
- [ ] **Live readiness demo** on hatchingpoint.com/point/examples
- [ ] `bun run ci` passes

---

## After Phase 12

- Package registry service
- Python routes/views emit
- Standalone runtime research (native-target-research.md)
