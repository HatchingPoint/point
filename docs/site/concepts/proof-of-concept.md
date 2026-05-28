---
title: Proof of concept
description: Concrete examples showing why Point is better for AI-assisted application logic — less guesswork, clearer intent, and tooling that ships in the box.
quadrant: Explanation
---

## Summary

This page is the **proof of concept** for Point's vision: the same application logic you would write in TypeScript or Python, expressed in semantic blocks, checked by a compiler that speaks **agent language** (refs, repair hints, effect boundaries), and emitted to run on your existing stack.

**Daily path:** [Point in 60 seconds](/point/guide/point-in-60-seconds). **Full app:** [Golden app demo](/point/guide/golden-app-demo).

## PoC 1 — Cart total (intent vs implementation)

**Goal:** Sum line items in a cart and classify order size for display.

### Point (authoring — what agents edit)

From `examples/cart-total.point`:

```point
record Cart Item
  name: Text
  unit price: Int
  quantity: Int

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total
```

Add a label in your module for classification:

```point
label order size
  input total: Int
  output Text
  when total >= 10000 return "Large order"
  otherwise return "Standard"
```

### TypeScript (runtime target — build output)

The compiler emits boring, typed functions (excerpt from generated output):

```typescript
export function cartTotal(items: CartItem[]): number {
  let total: number = 0;
  for (const item of items) {
    total += item.unitPrice * item.quantity;
  }
  return total;
}
```

### Why this matters for agents

| Question | TypeScript-only | Point |
|----------|-----------------|-------|
| What is being changed? | A function body — could be any logic | `rule cart total` or `label order size` |
| Stable patch target? | Line in `checkout.ts` (moves on format) | `point://semantic/Checkout/rule.cart total` |
| Wrong field on input? | TS error on property access | `check-json` with `expected` field list + `repair` text |
| Who owns the source? | Hand-edited `.ts` | `.point` only; regenerate targets |

Agents patch **rules and labels**, not scattered loops and `if` chains. Humans read the same blocks without parsing control flow.

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
| `point run`, `point test`, `point test integration`, `point test-all` | ✅ |
| `point dev`, `point app new` | ✅ v0.1.0 |
| Multi-page apps, WebSockets, database actions | ✅ v0.1.0 |
| Pipelines, sessions, prompts, guards | ✅ v0.1.0 |
| Stdlib (`std/json`, `std/http`, `std/sql`, …) | ✅ growing |
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

## PoC 8 — Agent context and token savings (live demo)

On the public docs site, the **Agent context demo** on [Proof of concept](/point/concepts/proof-of-concept#agent-context-demo) walks through a real repair scenario using output from `@hatchingpoint/point@0.2.7`:

| Workflow | Context loaded per repair turn | Stable patch target |
|----------|-------------------------------|---------------------|
| TypeScript + chat | Paste emit file twice + parse `tsc` text | Line number / function name (drifts on format) |
| Point agent loop | `check-json` + `explain` one ref | `point://semantic/Checkout/rule.cart total` |

Measured on `examples/cart-total.point`:

- Full `point index` output: ~8 KB (~2,000 tokens) — use once to explore, then narrow
- `point explain` one label: ~720 chars (~180 tokens)
- `point check-json` on unknown field: ~650 chars (~163 tokens) with `repair` + `expected` fields

Token estimates use a ~4 characters/token heuristic; your model billing varies. The structural win is **compiler-sized context**, not zero tokens.

**Try the interactive demo:** [Proof of concept → Agent context demo](/point/concepts/proof-of-concept#agent-context-demo)

## Try it in ten minutes

1. Install: [Installation](/point/guide/installation)
2. Copy `examples/cart-total.point` and run `point check-json` on it
3. Introduce a typo (wrong field name), run `check-json` again, read `repair`
4. Run `point explain` with the `ref` from the diagnostic
5. Fix `.point`, re-check, then `point build` and `point run`

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [How Point is novel](/point/concepts/how-point-is-novel)
- [Agent coding loop](/point/ai/agent-coding-loop)
- [Agent workflow](/point/ai/agent-workflow)
- [Examples gallery](/point/examples)
