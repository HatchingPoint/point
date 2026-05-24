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
| Token gap | same test file | Point context is 79–91% smaller than illustrative TS paste heuristics |
| Benchmark summary | `bun run benchmark:agent-repair` | Prints token counts and pass/fail for all fixtures |

**Fixtures:** `tests/fixtures/agent-repair/` — **17 exported cases** (13 single-shot + 4 repair-plan loops):

- **8 typo-fix cases** — wrong field, missing await, arity, operator types
- **5 feature-build cases** — AI agent scaffolds dashboard, pipeline, notes app, routing, or guarded write with one wiring bug
- **4 repair-plan loops** — launch, cart, notes, and pipeline fixtures with two bugs; CI simulates check → fix → check again in source order

See [Repair plan](/point/ai/repair-plan) for when to use `repair-plan` vs `check-json` alone.

Each feature-build case includes an `agentTask` describing what the user asked a coding agent to build.

No LLM is involved in sufficiency tests. They prove the **compiler output alone** is enough to reach a passing check.

## What is estimated (not a logged agent session)

The TypeScript column on the comparison demo uses **per-case paste heuristics** (3,200–12,000 characters, ~4 chars/token). Those numbers are illustrative — we have not published a logged Cursor/Codex trace for them.

## Model benchmark (live run)

See the **Model benchmark** section below for the interactive table, per-fixture breakdown, and model responses. Default models include GPT-4.1, o4-mini, Claude Opus 4.6, Claude Sonnet 4.6, and Gemini 2.5 Pro.

Reproduce: `bun run benchmark:agent-repair-models -- --models=gpt-4.1,claude-opus-4-6,claude-sonnet-4-6` (requires API keys).

## Reproduce locally

```bash
git clone https://github.com/HatchingPoint/point
cd point
bun test tests/agent-repair-sufficiency.test.ts
bun run benchmark:agent-repair
bun run export:agent-repair-cases
point check-json tests/fixtures/agent-repair/unknown-field-broken.point
```

## See also

- [Agent coding loop](/point/ai/agent-coding-loop)
- [Check JSON](/point/ai/check-json)
- [Repair loops](/point/ai/repair-loops)
- [Proof of concept](/point/concepts/proof-of-concept)
