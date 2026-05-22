# Codex Goals — Phase 26 (Language ergonomics & deeper checking)

**Master plan:** [phase26-plan.md](./phase26-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Wave 1 — launch all four in parallel

Each goal is one agent session. **Do not commit** unless the master plan checkbox says commit — append checkpoint to `codex-progress.md` instead. Wave 1 integrator merges and commits once all four pass tests.

### P26-1 — Field access aliases & fuzzy diagnostics

```text
/goal Execute docs/phase26-plan.md P26-1: Add camelCase→spaced field alias resolution in check.ts when unambiguous. Add fuzzy "did you mean" repair hints on unknown-field. Add tests/field-alias.test.ts and update docs/site/reference/diagnostics.md. MUST pass point-principles-gate.md. Run bun test tests/field-alias.test.ts and agent-repair unknown-field fixtures. Append checkpoint to docs/codex-progress.md. Do NOT commit.
```

### P26-2 — Variant exhaustiveness

```text
/goal Execute docs/phase26-plan.md P26-2: Add missing-variant-case diagnostic when on Case dispatch does not cover all variant cases. Wire check + index + explain. Add tests/variant-exhaustiveness.test.ts and extend examples/variants/order-status.point. MUST pass point-principles-gate.md. bun test tests/variant-exhaustiveness.test.ts. Append checkpoint to docs/codex-progress.md. Do NOT commit.
```

### P26-3 — Maybe presence narrowing

```text
/goal Execute docs/phase26-plan.md P26-3: Add when expr present / when expr is none narrowing for Maybe T in labels rules calculations. Checker narrows scope; emit null checks in JS TS Python. Add examples/tools/maybe-narrow.point and tests/maybe-narrowing.test.ts. Update docs/site/language/types.md. MUST pass point-principles-gate.md. bun test tests/maybe-narrowing.test.ts. Append checkpoint to docs/codex-progress.md. Do NOT commit.
```

### P26-4 — Tab & layout slot style modifiers

```text
/goal Execute docs/phase26-plan.md P26-4: Extend parse.ts tab and layout slot lines to accept semantic style modifiers via parseStylePrefix. Wire check-views emit. Update vercel-app template tabs. Add tests to tests/semantic-view-style.test.ts. Update docs/site/language/ui.md. MUST pass point-principles-gate.md. bun test tests/semantic-view-style.test.ts. Append checkpoint to docs/codex-progress.md. Do NOT commit.
```

---

## Wave 1 integrator (after all four complete)

```text
/goal Merge Phase 26 Wave 1: Resolve conflicts between P26-1–P26-4 branches/worktrees. Run bun run ci. Fix any overlap in check.ts or parse.ts. Commit: "Phase 26 Wave 1: field aliases, variant exhaustiveness, Maybe narrowing, tab modifiers." Bump v0.1.18 if release-ready.
```

---

## Wave 2 — launch three in parallel (after Wave 1 merged)

### P26-5 — Pipeline step I/O checking

```text
/goal Execute docs/phase26-plan.md P26-5: Validate pipeline step output/input record field compatibility. Add pipeline-step-type-mismatch diagnostic. tests/pipeline-step-types.test.ts. Append checkpoint. Do NOT commit.
```

### P26-6 — Money field lint

```text
/goal Execute docs/phase26-plan.md P26-6: Add float-money-field diagnostic for Float fields matching price/amount/cents heuristics. Repair points to std/money.point. Update types.md. tests/money-lint.test.ts. Append checkpoint. Do NOT commit.
```

### P26-7 — View load-data repair hints

```text
/goal Execute docs/phase26-plan.md P26-7: Enhance missing-await repair in check-data-load.ts with suggested load data block when action is loadable. Add agent-repair fixture pair. Re-run scripts/export-agent-repair-cases.ts. Append checkpoint. Do NOT commit.
```

---

## Wave 2 integrator

```text
/goal Merge Phase 26 Wave 2. bun run ci. Update phase26-plan.md checkboxes. Commit: "Phase 26 Wave 2: pipeline I/O, money lint, load-data repairs." Tag v0.1.18.
```

---

## Sanity check

```bash
cd /Users/pla_cebro/clones/point
bun test tests/field-alias.test.ts tests/variant-exhaustiveness.test.ts tests/maybe-narrowing.test.ts tests/semantic-view-style.test.ts
bun packages/point/src/cli.ts check-docs
bun run ci
```

---

## Copy-paste: launch Wave 1 (four terminals or four Codex sessions)

Open four sessions from repo root and paste one `/goal` block per session from **P26-1** through **P26-4** above.

Or use Cursor Agent parallel tasks (same prompts).
