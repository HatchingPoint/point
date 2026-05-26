# Codex `/goal` Setup for Point Full Language Plan

Use this doc to run the entire Point language roadmap as a long-running Codex goal from the CLI.

**Master plan:** [full-language-plan.md](./full-language-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

**Point runtime pivot (parallel goals):** [point-runtime-pivot.md](./point-runtime-pivot.md) · [codex-goal-point-only.md](./codex-goal-point-only.md) · **hard pivot, no fallbacks** · launch Wave R0 from `point-1` root.

---

## 1. Enable goals in Codex CLI

Goals are experimental. Enable once:

```text
/experimental
```

Turn on goals, **or** add this to your Codex `config.toml`:

```toml
[features]
goals = true
```

Config location varies by install. Common paths:

- `~/.codex/config.toml`
- `%USERPROFILE%\.codex\config.toml` (Windows)

---

## 2. Start Codex from the repo root

```bash
cd c:\Users\mcarr\Documents\clones\point-1
codex
```

### Windows paste fix (if Ctrl+V fails)

Codex may show `Failed to paste image` when Ctrl+V is used in some terminals (including Cursor's integrated terminal). Try in order:

1. **Right-click** in the Codex prompt to paste text
2. **Shift+Insert** to paste text
3. **Type a short goal** instead of pasting the long block:

```text
/goal Execute docs/codex-goal.prompt.txt — read that file and docs/full-language-plan.md, then work Phase 0 section by section until Phase 0 Exit Gate passes and bun run ci passes.
```

4. **Pipe the prompt file** (no paste needed) — exit interactive Codex (`Ctrl+C` or `/quit`), then run:

```powershell
Get-Content docs/codex-goal-phase0.prompt.txt -Raw | codex exec -
```

For the full Phases 0–6 goal:

```powershell
Get-Content docs/codex-goal.prompt.txt -Raw | codex exec -
```

5. **Use Windows Terminal or PowerShell outside Cursor** if the integrated terminal keeps blocking paste.

Prompt files (no paste required):

- `docs/codex-goal-phase0.prompt.txt` — Phase 0 only (recommended first run)
- `docs/codex-goal.prompt.txt` — full Phases 0–6

---

## 3. Paste this goal (copy everything inside the block)

```text
/goal Execute docs/full-language-plan.md Phases 0 through 6 in order without stopping until every checkbox in the plan is checked, every Phase Exit Gate passes, and `bun run ci` passes on the final state.

Contract:
- Read first: docs/full-language-plan.md, docs/semantic-language-design.md, docs/ai-reference-system.md, docs/codex-progress.md
- Work one phase at a time. Do not open Phase N+1 until Phase N Exit Gate is fully satisfied.
- Work one section at a time within each phase (0.1, 0.2, … then Phase Exit Gate).
- Public .point source must stay semantic. Implement features via lowering in packages/point/src/core/parser.ts. Never expose fn/let/type/braces in public .point source.
- Every behavior change needs tests in tests/point-core.test.ts.
- User-visible features need examples in examples/ and grammar/snippet updates in packages/point-vscode/ when keywords change.
- Mark checkboxes [x] in docs/full-language-plan.md only after the Definition of Done is met.
- Append a checkpoint to docs/codex-progress.md after each verified section.

Validation loop (run after every section and before every phase exit):
  bun test
  bun run fmt-check
  bun run check
  bun run build
  bun run ci

Definition of done for any checkbox:
  behavior implemented, tests pass, example/docs updated if needed, verification commands pass, checkbox marked in full-language-plan.md.

Do not change:
  - Git config, remotes, or branch protection
  - Force push, hard reset, or skip hooks unless explicitly asked
  - Unrelated refactors outside the active phase scope
  - Product naming (Point / @hatchingpoint/point)

Pause and report (do not guess) if blocked on:
  - Optional type design choice (Phase 1.4) — pick one, document in docs/semantic-language-design.md, continue
  - View/route target choice (Phase 5) — default to React + Hono unless plan says otherwise
  - npm publish credentials (Phase 6) — implement pipeline, stop before publish if no credentials

Progress report format (append to docs/codex-progress.md):
  ## Checkpoint [phase.section] — [title]
  - Completed: ...
  - Verified: bun test / fmt-check / check / build / ci (pass/fail)
  - Checkboxes marked: ...
  - Next: ...
  - Blocked: none | ...

Stopping condition (goal complete):
  - All checkboxes in docs/full-language-plan.md are [x], including Non-Negotiable Principles and every Phase 0–6 Exit Gate item
  - Progress Tracker table shows Phases 0–6 as Done
  - `bun run ci` passes
  - docs/codex-progress.md contains a final "GOAL COMPLETE" checkpoint
```

---

## 4. Control commands while it runs

```text
/goal
/goal pause
/goal resume
/goal clear
```

- **`/goal`** — show current goal status  
- **`/goal pause`** — stop after current checkpoint (use when changing direction)  
- **`/goal resume`** — continue  
- **`/goal clear`** — remove goal when fully done or abandoning  

---

## 5. What Codex should do each checkpoint

1. Read **Active phase** in `docs/full-language-plan.md`
2. Complete the next unchecked section in that phase
3. Run the validation loop
4. Mark checkboxes and update **Active phase** / Progress Tracker when a phase completes
5. Append checkpoint to `docs/codex-progress.md`
6. Continue to next section — do not stop until stopping condition is met

---

## 6. Shorter goals (if you want to run phase-by-phase)

Full plan in one goal may run many hours. Safer alternative: one goal per phase.

### Phase 0 only

```text
/goal Complete Phase 0 (Foundation Lock) in docs/full-language-plan.md without stopping until every Phase 0 checkbox is [x], the Phase 0 Exit Gate passes, and bun run ci passes. Read docs/full-language-plan.md and docs/codex-progress.md first. Append checkpoints to docs/codex-progress.md after each section (0.1–0.4). Do not start Phase 1.
```

### Phase 1 only (run after Phase 0 is done)

```text
/goal Complete Phase 1 (Control Flow and Data) in docs/full-language-plan.md without stopping until every Phase 1 checkbox is [x], examples/cart-total.point works end-to-end, the Phase 1 Exit Gate passes, and bun run ci passes. Read docs/full-language-plan.md first. Do not start Phase 2.
```

Repeat for Phases 2–6 using the phase sections in the plan.

---

## 7. Recommended first run

If this is your first `/goal` on this repo, start with **Phase 0 only** (section 6). Verify the loop works: checkboxes update, progress log fills, CI passes. Then clear the goal and launch the full Phases 0–6 goal from section 3.

---

## 8. Quick sanity check before launching

```bash
bun install
bun run ci
```

Both should pass on current baseline before Codex starts Phase 0.

---

## 9. Phase 7 — AST compiler (after Phase 6 only)

When Phases 0–6 are complete, run the compiler modernization plan:

```powershell
Get-Content docs/codex-goal-phase7.prompt.txt -Raw | codex exec -
```

Plan: [phase7-ast-plan.md](./phase7-ast-plan.md)

Do **not** run Phase 7 while Phases 0–6 are still in progress.
