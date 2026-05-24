# Codex goals — Phase expansion loop (meta)

**Purpose:** Periodically **analyze Point** and **draft new phases** to enhance the language — without implementing them in the same session unless the user promotes a draft.

**North star:** Point stays a semantic, agent-native, general-purpose language. New phases extend block families and compiler/agent surfaces — not product-specific DSLs or wrapper repos.

---

## When to run

- After an integrator release (e.g. v0.1.20 shipped)
- When active phases (28/29) are blocked or complete
- On a **2h–6h** `/loop` interval in a **dedicated Agent chat** (auto-run ON)

**Do not** run in the same chat as Phase 28/29 implementation loops.

---

## Procedure (each loop tick)

### 1. Analyze

```bash
bun packages/point/src/cli.ts roadmap-analyze
```

Read the JSON output plus:

- [phase-roadmap.md](./phase-roadmap.md)
- [language-primitive-audit.md](./language-primitive-audit.md)
- [point-principles-gate.md](./point-principles-gate.md)
- Active plans: [phase28-plan.md](./phase28-plan.md), [phase29-plan.md](./phase29-plan.md)
- Recent checkpoints in [codex-progress.md](./codex-progress.md)

Optional deep reads when backlog is thin:

- `benchmarks/agent-repair-cases.json`
- `docs/site/language/*.md` vs `packages/point/src/semantic/parse.ts`
- `examples/` and `tests/` for missing conformance coverage

### 2. Decide (one slice per tick)

Pick **exactly one** of:

| Slice | Action |
|-------|--------|
| **A. Reprioritize backlog** | Update candidate table in `phase-roadmap.md` with evidence from analyze output |
| **B. Draft new phase** | Create `docs/phaseNN-plan.md` + `docs/codex-goal-phaseNN.md` where `NN = nextSuggestedPhaseNumber` |
| **C. Split active phase** | If 28 or 29 is too large, draft a sub-phase or wave doc — do not edit implementation files |
| **D. Close audit gap** | Propose phase scope to implement a deferred primitive from the audit (no code yet) |

**Skip** if the backlog already has an unstarted draft phase file on disk.

### 3. Draft phase template (slice B)

New `docs/phaseNN-plan.md` must include:

```markdown
# Phase NN — <title>

**Status:** Draft — not started
**Prerequisite:** <prior phases / releases>
**North star:** <one sentence>

## Success criteria
- [ ] <3–6 checkboxes, verifiable>

## Non-goals
- <explicit deferrals>

## File ownership (if parallel with 28/29)
| Owns | Does not touch |

## After Phase NN
- <sequential follow-ups>
```

New `docs/codex-goal-phaseNN.md` must include:

- `/goal` one-liners per checkbox (PNN-1, PNN-2, …)
- Integrator goal referencing [codex-goal-cursor-overnight.md](./codex-goal-cursor-overnight.md)
- Principles gate reminder

Update [phase-roadmap.md](./phase-roadmap.md): add row under **Candidate backlog** or move to **Active** when user starts execution.

### 4. Checkpoint

Append to [codex-progress.md](./codex-progress.md):

```text
## Checkpoint Phase expansion — <date/tick summary>
- Analyzed: point roadmap-analyze (active phases, audit gaps, repair cases)
- Decision: <A/B/C/D>
- Output: <files touched>
- Next expansion tick: <recommended focus>
- Principles gate: N/A (planning only) OR note if draft violates a gate
```

### 5. Commit policy

- **Commit** when a full draft phase (plan + codex-goal) is ready for human review
- **Do not commit** on backlog-only reprioritization unless the user asked
- **Never** bump version or tag from this loop

---

## Copy-paste Agent loop

```
/loop 2h Read docs/codex-goal-phase-expansion.md. Run `bun packages/point/src/cli.ts roadmap-analyze`. Execute exactly one expansion slice (A–D). Planning and docs only — no compiler changes. Append docs/codex-progress.md. Commit when a draft phaseNN plan + codex-goal are ready.
```

---

## Good phase themes (examples)

Derived from audit + recent phases — use analyze output to confirm priority:

1. **Record → SQL productization** — migrations, dialect, FK from nested records
2. **Result / typed domain errors** — variant-first design, calculation `on failure`
3. **Python std mirror completion** — remaining shims + py-parity matrix
4. **View/data ergonomics** — pagination, optimistic updates, form validation blocks
5. **Agent loop maturity** — repair sufficiency targets, index coverage SLA, benchmark regression gate in CI
6. **Self-host compiler** — naming/fmt/diagnostic catalog in `.point`

Each theme should split into **parallel tracks** only when file ownership is disjoint (same pattern as 27/28/29).

---

## Anti-patterns

- Creating phases that are “write more docs” without compiler/checker/emit deliverables
- Product-specific syntax (Surgent, ASC, deploy readiness) in core language phases
- Duplicating an active phase (28/29) instead of adding checkboxes there
- Implementing code in the expansion loop chat — use a separate execution chat with that phase’s codex-goal
