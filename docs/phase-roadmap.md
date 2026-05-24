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
| **31** | Draft — not started | [phase31-plan.md](./phase31-plan.md) | [codex-goal-phase31.md](./codex-goal-phase31.md) |

Promote to **Active** when Phase 28/29 exit gates pass or user starts a dedicated execution chat.

## Completed (integrator shipped)

| Phase | Release | Highlights |
|-------|---------|------------|
| **27** | v0.1.20 | Middleware validation, view source maps, theme toggle, `build-schema` |
| **26** | v0.1.18–0.1.19 | Field aliases, variant exhaustiveness, pipeline I/O, money lint |
| **25** | v0.1.17 | Theme blocks, native UI styling, vercel-app template |

Older phases: see `docs/phase*-plan.md` and [codex-progress.md](./codex-progress.md).

## Candidate backlog (expansion loop maintains)

Evidence-driven themes not yet assigned to a numbered phase file.  
**Last analyze:** 2026-05-24 — active 28/29 (7+8 open criteria), drafts Phase 30 + 31, 18+ agent-repair cases.

| Priority | Theme | Evidence | Notes |
|----------|-------|----------|-------|
| 1 | ~~SQL codegen productization~~ | [phase30-plan.md](./phase30-plan.md) draft | Promote after 28/29 exit |
| 2 | ~~Typed errors / Result~~ | Audit gap; `order-status.point`, `process.point` `or Error` | **Drafted → [phase31-plan.md](./phase31-plan.md)** (variant-first, not try/catch) |
| 3 | Python std completion | Phase 29 active | **Execution track** — do not duplicate |
| 4 | Agent loop maturity | 18 repair cases; Phase 28 has 7 open (P28-3 partial, P28-4/P28-5 not started) | **Hold Phase 31-alt** until P28 exit; may merge into 28 integrator instead |
| 5 | Self-host compiler passes | P28-5 not started; phase21 prior art | Stays on Phase 28 execution chat |
| 6 | LSP ↔ CLI parity matrix | P28-4 not started | Stays on Phase 28 execution chat |
| — | Map / Money / dates | Audit deferrals unchanged | No phase until author friction measured post-30 |

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
