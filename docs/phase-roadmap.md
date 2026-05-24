# Point phase roadmap

**Purpose:** Single queue for language expansion. The **phase expansion loop** reads this file, runs `point roadmap-analyze`, and drafts the next `docs/phaseNN-plan.md`.

## Active execution (implement in Agent `/loop` chats)

| Phase | Status | Plan | Codex goals |
|-------|--------|------|-------------|
| **28** | Active | [phase28-plan.md](./phase28-plan.md) | [codex-goal-phase28.md](./codex-goal-phase28.md) |
| **29** | Active | [phase29-plan.md](./phase29-plan.md) | [codex-goal-phase29.md](./codex-goal-phase29.md) |

Run **at most one implementation phase per chat** to avoid file conflicts. Use file ownership tables inside each plan.

## Draft (ready for promotion)

| Phase | Status | Plan | Codex goals |
|-------|--------|------|-------------|
| **30** | Draft — not started | [phase30-plan.md](./phase30-plan.md) | [codex-goal-phase30.md](./codex-goal-phase30.md) |

Promote to **Active** when Phase 28/29 exit gates pass or user starts a dedicated Phase 30 execution chat.

## Completed (integrator shipped)

| Phase | Release | Highlights |
|-------|---------|------------|
| **27** | v0.1.20 | Middleware validation, view source maps, theme toggle, `build-schema` |
| **26** | v0.1.18–0.1.19 | Field aliases, variant exhaustiveness, pipeline I/O, money lint |
| **25** | v0.1.17 | Theme blocks, native UI styling, vercel-app template |

Older phases: see `docs/phase*-plan.md` and [codex-progress.md](./codex-progress.md).

## Candidate backlog (expansion loop maintains)

Evidence-driven themes not yet assigned to a numbered phase file:

| Priority | Theme | Evidence | Notes |
|----------|-------|----------|-------|
| 1 | ~~SQL codegen productization~~ | P27-4 spike shipped v0.1.20 | **Drafted → [phase30-plan.md](./phase30-plan.md)** |
| 2 | Typed errors / `Result` | [language-primitive-audit.md](./language-primitive-audit.md) | Candidate Phase 31 — variants + labels today |
| 3 | Python std completion | phase29-plan, P19 leftovers | **Active in Phase 29** |
| 4 | Self-host compiler passes | phase28 P28-5, phase21 | More `.point`-authored passes under `compiler/` |
| 5 | LSP ↔ CLI parity matrix | phase28 P28-4 | Automated diagnostic parity tests |

The expansion loop may **reprioritize**, **merge**, or **split** rows when drafting a new phase.

## Phase expansion loop (meta)

**Not a shell ticker.** Use Cursor Agent with auto-run:

```
/loop 2h Read docs/codex-goal-phase-expansion.md and execute the next expansion slice.
```

See [codex-goal-phase-expansion.md](./codex-goal-phase-expansion.md) for the full procedure.

**Outputs only:** `phase-roadmap.md`, new `phaseNN-plan.md`, `codex-goal-phaseNN.md`, checkpoint in `codex-progress.md`.  
**Does not implement compiler changes** unless you explicitly promote a draft phase to an execution chat.

## Principles

Every proposed phase must pass [point-principles-gate.md](./point-principles-gate.md).  
Primitive gaps must reference [language-primitive-audit.md](./language-primitive-audit.md).
