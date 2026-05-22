---
title: Agent repair walkthrough
description: Step-by-step agent context for Point check-json vs TypeScript paste — with CI-verified vs estimated labels and per-step token counts.
quadrant: Explanation
---

## Summary

This page is the **simple, step-by-step** view of the agent repair comparison. For tables and model benchmarks, see [Agent repair tests](/point/ai/agent-repair-tests).

## What we prove vs illustrate

| | Point | TypeScript paste |
|---|-------|------------------|
| Repair without LLM | **Yes** — `tests/agent-repair-sufficiency.test.ts` | **No** — no golden tsc→fix test in CI |
| Context size | **Measured** — real `check-json` on fixtures | **Estimated** — typical paste heuristic |
| Models can repair | **Live API** — when benchmark results are synced | **Live API** — same `.point` file, larger prompt |

The interactive walkthrough below uses real fixture snippets from `tests/fixtures/agent-repair/`.
