---
title: Agent coding loop
description: How Cursor, Codex, and Claude Code repair code today — and how Point reduces tokens and improves first-try fixes.
quadrant: Explanation
---

## Summary

If you use **Cursor Agent**, **Codex**, or **Claude Code**, you already run a repair loop: compiler error → paste context → model patch → verify. On a TypeScript repo, that loop is expensive and fragile. Point replaces paste-and-pray with a compiler that returns JSON shaped for agents: `ref`, `expected`, `repair`, and `span`.

Live walkthrough with real code: [Agent repair tests](/point/ai/agent-repair-tests).

## The bug (same product logic, two stacks)

A typo on launch readiness scoring — wrong field name on a record:

**TypeScript repo** — logic hides inside a function:

```typescript
// src/lib/math.ts
import type { LaunchSignals } from "../types";

export function launchReadinessScore(signals: LaunchSignals): number {
  let score = 0;
  if (signals.unknownField) score += 30;  // typo
  if (signals.submittedForReview) score += 40;
  if (signals.hasPassingTests) score += 30;
  return score;
}
```

**Point source** — logic is a named rule (a typo on one field line triggers `unknown-field` in `check-json`):

```point
module Math

record Launch Signals
  has bundle id: Bool
  submitted for review: Bool
  has passing tests: Bool

rule launch readiness
  input signals: Launch Signals
  output score: Int
  score starts at 0
  add 30 when signals.has bundle id
  add 40 when signals.submitted for review
  add 30 when signals.has passing tests
  return score
```

## TypeScript + agent loop (what you do today)

1. **tsc fails** — text error, no valid field list:

```text
error TS2339: Property 'unknownField' does not exist on type 'LaunchSignals'.
  at launchReadinessScore (math.ts:5:15)
```

2. **You or the agent paste surrounding code** — `math.ts`, `types.ts`, often the React file that imported the helper (~3,000+ tokens in a real app).

3. **Model guesses** — without an `expected` list, it may invent `hasBundleId`, patch the wrong file, or hit a line number that moved after format-on-save.

4. **Retry** — wrong fix means another turn: re-paste files + chat history. Token cost compounds.

**Problems for agents:** patch target is a line in emitted JS; no repair hint; context is implementation glue, not the product rule name.

## Point agent loop

1. **Structured diagnostic only** — no React tree in context:

```bash
point check-json math.point
```

```json
{
  "ok": false,
  "diagnostics": [{
    "code": "unknown-field",
    "ref": "point://semantic/Math/rule.launch readiness",
    "expected": ["has bundle id", "submitted for review", "has passing tests"],
    "actual": "unknownField",
    "repair": "Use one of: has bundle id, submitted for review, has passing tests.",
    "span": { "start": { "line": 12 } }
  }]
}
```

2. **Patch one line at the ref** — pick from `expected` (Point field syntax, not camelCase):

```point
module Math

record Launch Signals
  has bundle id: Bool
  submitted for review: Bool
  has passing tests: Bool

rule launch readiness
  input signals: Launch Signals
  output score: Int
  score starts at 0
  add 30 when signals.has bundle id
  add 40 when signals.submitted for review
  add 30 when signals.has passing tests
  return score
```

3. **Verify with the same gate CI uses**:

```bash
point check math.point
```

**Why it wins:** stable semantic ref; repair sentence + field list; ~130–260 tokens of context vs thousands for a TS paste; authoritative source is `.point` — emit stays derived.

## Side-by-side

| | TS + Cursor / Codex / Claude | Point agent loop |
|---|---|---|
| Patch target | Line in `math.ts` (drifts on format) | `point://semantic/Math/rule.launch readiness` |
| Repair hint | tsc: property missing | `expected` + `repair` fields |
| Context | Pasted files + JSX noise | `check-json` only (~260 tokens) |
| Verify | Re-run tsc, hope the guess was right | `point check` on source |
| Source of truth | Often unclear (hand-edited emit?) | `.point` only |

Token estimates use ~4 chars/token. Exact counts vary by model and chat history; the order-of-magnitude gap holds on real repos.

## Quality, not just tokens

Smaller context helps, but the main win is **shape**: agents parse JSON fields reliably; they guess from prose and line numbers unreliably. CI in the Point repo proves `check-json` alone is **sufficient** to reach a passing check — apply the golden line at the diagnostic span and `point check` passes (see `tests/fixtures/agent-repair/`).

Optional: run `bun run benchmark:agent-repair-models` with provider API keys to compare GPT, Claude, and Gemini repair success under both workflows.

## Commands (copy-paste loop)

```bash
point check-json path/to/file.point
# read ref, expected, repair, span — patch .point at ref
point check path/to/file.point
```

For multiple errors: `point repair-plan path/to/file.point`. Optional context: `point explain path/to/file.point <ref>`.

## See also

- [Agent workflow](/point/ai/agent-workflow) — recommended CLI loop
- [check-json](/point/ai/check-json) — diagnostic schema
- [Repair loops](/point/ai/repair-loops)
- [Proof of concept](/point/concepts/proof-of-concept) — live demos and CI fixtures
