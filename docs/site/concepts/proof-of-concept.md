---
title: Proof of concept
description: Concrete examples showing why Point is better for AI-assisted product logic — less guesswork, clearer intent, and tooling that ships in the box.
quadrant: Explanation
---

## Summary

This page is the **proof of concept** for Point’s vision: the same product logic you would write in TypeScript or Python, expressed in semantic blocks, checked by a compiler that speaks **agent language** (refs, repair hints, effect boundaries), and emitted to run on your existing stack.

## PoC 1 — Readiness scoring (intent vs implementation)

**Goal:** Score launch readiness from three booleans and classify the score for display.

### Point (authoring — what agents edit)

From `examples/math.point`:

```point
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

label score status
  input score: Int
  output Text
  when score >= 90 return "excellent"
  otherwise return "keep going"
```

### TypeScript (runtime target — build output)

The compiler emits boring, typed functions (excerpt from generated output):

```typescript
export function launchReadinessScore(signals: LaunchSignals): number {
  let score: number = 0;
  if (signals.hasBundleId) score += 30;
  if (signals.submittedForReview) score += 40;
  if (signals.hasPassingTests) score += 30;
  return score;
}
```

### Why this matters for agents

| Question | TypeScript-only | Point |
|----------|-----------------|-------|
| What is being changed? | A function body — could be any logic | `rule launch readiness` or `label score status` |
| Stable patch target? | Line in `math.ts` (moves on format) | `point://semantic/Math/rule.launch readiness` |
| Wrong field on input? | TS error on property access | `check-json` with `expected` field list + `repair` text |
| Who owns the source? | Hand-edited `.ts` | `.point` only; regenerate targets |

Agents patch **rules and labels**, not scattered `if` chains. Humans read the same blocks without parsing control flow.

## PoC 2 — Agent repair loop (in the box)

Point ships a full loop without custom scripts:

```bash
# 1. List symbols with stable refs
point index examples/math.point

# 2. Structured diagnostics for CI or the agent
point check-json examples/math.point

# 3. Focused context for one declaration
point explain examples/math.point point://semantic/Math/label.score status

# 4. Ordered steps when multiple errors exist
point repair-plan examples/math.point
```

**Contrast — “raw LLM” workflow on TypeScript:**

1. Paste entire file into chat.
2. Model guesses line number or searches for `launchReadinessScore`.
3. Patch may fix symptoms but break types elsewhere.
4. No machine-readable `repair` field; re-run `tsc` and parse text.

**Point workflow:**

1. `check-json` returns `ref`, `repair`, `relatedRefs`.
2. Agent patches `.point` at that ref.
3. `check-json` again until `ok: true`.
4. `point build` refreshes JS/TS targets.

That is the **proof** that Point is built for LLM coding agents: the compiler is an API, not just a batch compiler.

## PoC 3 — Policies without framework noise

Pure guards stay declarative:

```point
policy adult user
  input age: Int
  require age >= 18

policy blocked user
  input blocked: Bool
  deny blocked
```

In TypeScript you might spread this across middleware, Zod schemas, and route handlers. Point keeps **policy** as a first-class block the checker and agent index understand — separate from `action` blocks that touch the filesystem or network.

## PoC 4 — Full app surface (not just calculators)

The adoption pilot (`examples/app/todo.point`) proves Point is not a toy DSL:

- `record`, `view`, `action`, `workflow`, `route`, `command` in one module
- `use std.http` instead of ad-hoc externals
- `point check`, `point build-ts`, `point run` on a non-trivial module

Dogfood adopters under `examples/adopters/` (e.g. store readiness, subscription tiers) show **real product shapes**, not hello-world only.

Published package `@hatchingpoint/point-logic` shows **Point-only libraries**: `.point` in `src/`, emitted JS in `dist/` — npm consumers never hand-edit emit.

## PoC 5 — Pipeline speed (production path)

The semantic AST pipeline (Phase 7) is the production path: parse → semantic AST → desugar → check → emit. Reference benchmarks on the compiler repo’s fixture set (~26 files, ~8 KB combined):

| Pipeline | Per full check iteration |
|----------|--------------------------|
| Legacy string-lowering | ~6.0 ms |
| Semantic AST | ~4.0 ms |

Emit from cached AST: **~0.09 ms** per TypeScript or JavaScript file for `examples/math.point`.

Agents get fast re-check loops; CI can run `point check` and `point check-json` on every PR without treating the language as experimental overhead.

## PoC 6 — What you get in the box (no glue project)

| Capability | Ships with `@hatchingpoint/point` |
|------------|-----------------------------------|
| Parser, checker, formatter | ✅ |
| JS default emit; TS and PY opt-in | ✅ |
| `check-json`, `index`, `explain`, `repair-plan` | ✅ |
| `point://semantic/` stable refs | ✅ |
| LSP (`point lsp`) for Neovim, Zed, etc. | ✅ |
| VS Code / Cursor extension (Marketplace) | ✅ |
| `point run`, `point test`, `point test-all` | ✅ |
| Stdlib (`std/json`, `std/http`, …) | ✅ growing |
| `point add` + lockfile for deps | ✅ |

You do not need a separate “agent tools” repo to get structured diagnostics — they are part of the language CLI.

## PoC 7 — Relative to how teams use AI today

| Workflow | Weakness | Point mitigation |
|----------|----------|------------------|
| Copilot inline on `.ts` | No ground-truth repair loop; line-based | Semantic refs + `check-json` |
| ChatGPT paste whole file | Context bloat; wrong symbol | `explain` one ref at a time |
| Custom AST scripts on TS | Fragile; breaks on syntax changes | Native semantic AST + checker |
| Rules in YAML + code in TS | Two sources of truth | Rules live in `.point` with types |
| “Just write better prompts” | No CI enforcement | `point check` / `check-json` in CI |

Point does not replace the LLM. It replaces **guesswork about where and how to patch** after the model proposes a change.

## Try it in ten minutes

1. Install: [Installation](/point/guide/installation)
2. Copy `examples/math.point` and run `point check-json` on it
3. Introduce a typo (wrong field name), run `check-json` again, read `repair`
4. Run `point explain` with the `ref` from the diagnostic
5. Fix `.point`, re-check, then `point build` and `point run`

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [How Point is novel](/point/concepts/how-point-is-novel)
- [Agent workflow](/point/ai/agent-workflow)
- [Examples gallery](/point/examples)
