---
title: Agent repair tests
description: CI-verified agent repair fixtures, benchmarks, and what is measured vs estimated on the site.
quadrant: Explanation
---

## Summary

Point ships **real automated tests** for agent repair — not marketing screenshots. They live in the Point repository and run on every `bun test`.

This page is the hub for those tests, the interactive comparison demo, and optional model benchmarks.

## What is CI-verified (real tests)

| Test | Command | What it proves |
|------|---------|----------------|
| Agent repair sufficiency | `bun test tests/agent-repair-sufficiency.test.ts` | Real `check-json` on broken fixtures; golden one-line fix → `point check` passes |
| Context size | same test file | `check-json` context stays under 1,200 chars per case |
| Benchmark summary | `bun run benchmark:agent-repair` | Prints token counts and pass/fail for all fixtures |

**Fixtures:** `tests/fixtures/agent-repair/` — two cases today:

- `unknown-field-broken.point` / `unknown-field-fixed.point` — wrong field on a **rule**
- `label-unknown-field-broken.point` / `label-unknown-field-fixed.point` — wrong field on a **label**

No LLM is involved in sufficiency tests. They prove the **compiler output alone** is enough to reach a passing check.

## What is estimated (not a logged agent session)

The TypeScript column on the comparison demo uses a **12,000-character paste heuristic** (~3,000 tokens) for a typical component + lib + tests paste. That number is illustrative — we have not published a logged Cursor/Codex trace for it.

## Model benchmark (optional, not run by default)

`bun run benchmark:agent-repair-models` calls GPT, Claude, and Gemini on the same fixtures under TS vs Point workflows. Requires provider API keys. Results sync to the site when committed to `benchmarks/agent-repair-model-results.json`.

## Reproduce locally

```bash
git clone https://github.com/HatchingPoint/point
cd point
bun test tests/agent-repair-sufficiency.test.ts
bun run benchmark:agent-repair
point check-json tests/fixtures/agent-repair/unknown-field-broken.point
```

## See also

- [Agent coding loop](/point/ai/agent-coding-loop)
- [Check JSON](/point/ai/check-json)
- [Repair loops](/point/ai/repair-loops)
- [Proof of concept](/point/concepts/proof-of-concept)
