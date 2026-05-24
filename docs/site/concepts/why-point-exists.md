---
title: Why Point exists
description: The problem Point solves, why a new language made sense, and when teams should choose it over staying on TypeScript or Python alone.
quadrant: Explanation
---

## Summary

Point exists because **coding agents became a primary author of software**, but general-purpose languages were never designed to be repaired by machines. Point is a general-purpose language whose surface syntax, compiler, and CLI are built so agents can check, explain, and patch application logic reliably — without replacing your existing JavaScript stack.

## The shift: agents write code continuously

Teams already use LLMs to add features, fix bugs, and refactor modules. That workflow breaks down on TypeScript and Python in predictable ways:

- **Line numbers drift** after formatters run or imports reorder.
- **Intent is buried** in functions, classes, and framework glue — an agent cannot tell whether a change should touch a data model, a scoring rule, or a UI label.
- **Diagnostics are text** — `Property 'email' does not exist` does not say which declaration to patch or what fields are valid.
- **No compiler API for agents** — tools scrape stderr or paste whole files into a prompt and hope the model finds the right symbol.

Point was created to fix that interface gap, not to replace Bun, React, or npm.

## What Point is (and is not)

| Point is | Point is not |
|----------|--------------|
| A general-purpose authoring language for application logic | A new browser or server runtime you must deploy separately |
| Semantic blocks (`record`, `rule`, `label`, `action`, …) that preserve intent | A Python or TypeScript syntax clone with different keywords |
| A compiler that emits JavaScript (default), TypeScript, or Python | A promise that every file in a monorepo becomes `.point` overnight |
| Built-in agent commands (`check-json`, `index`, `explain`, `repair-plan`) | A chat wrapper around GPT with no ground truth |

You still run emitted JavaScript on Bun or Node. You still import React views from generated output. You still call npm packages through `external` blocks. Point sits **above** those targets as the source you and agents maintain.

## Why not just use TypeScript better?

TypeScript is excellent for implementation detail and ecosystem interop. It was not designed for **machine repair loops**:

- Symbols are identified by file paths and positions that change under edit.
- Business rules look like ordinary functions — `calculateScore(signals)` could be scoring, pricing, or analytics.
- There is no standard `tsc --json-for-agents` with `repair`, `expected`, `actual`, and stable refs across format runs.
- Agents often edit generated-style code (nested conditionals, mutable `let score`) instead of the product concept (“add 30 when bundle id is present”).

Point keeps TypeScript as a **target**, not as the daily authoring surface for logic agents should own.

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
```

The same logic in emitted TypeScript is correct but **opaque to repair tools** — it is implementation-shaped, not intent-shaped. The compiler maps between them; agents patch the rule block and stable ref `point://semantic/Math/rule.launch readiness`.

## Why not a DSL or “prompt engineering”?

| Approach | Limit |
|----------|-------|
| **Prompt-only** | No single source of truth; no CI gate; models hallucinate APIs |
| **Narrow DSL** (e.g. rules YAML) | Cannot grow into routes, views, workflows, tests |
| **Stay on TS + Copilot** | Faster autocomplete, same fragile repair story |
| **Point** | General-purpose blocks + typed checker + agent-native CLI |

Point is deliberately **wider than a rules engine** and **narrower than “rewrite everything in a new syntax”** — it covers the application logic layer teams already ask agents to change.

## Why it made sense to create a language

Creating a language is a heavy bet. It was justified when these constraints stacked:

1. **Agents need stable symbols**, not stable line numbers — refs must survive `point fmt`.
2. **Application logic deserves its own grammar** — `record` / `rule` / `label` are cheaper to check and explain than inferring intent from `function` bodies.
3. **Repair must be loopable in CI** — `check-json` → patch → `check-json` with the same schema agents use locally.
4. **Teams will not adopt a new VM first** — emit to JS/TS/PY keeps adoption incremental.
5. **Effects must be visible** — `action` blocks declare `touches file`, `touches network`, and similar metadata so review tools and agents know boundaries.

No off-the-shelf TypeScript or Python toolchain shipped all five as one package when Point started. Bolting them on later would still leave source syntax optimized for humans reading `def` and `class`, not agents resolving `point://semantic/...`.

## When Point is worth it

Choose Point when:

- Coding agents (Cursor, Codex, custom CI bots) **own** business rules, models, and app commands.
- You want **one checked source** for logic that today sprawls across TS services and Python scripts.
- You need **explainable patches** — diagnostics name the declaration and suggest repairs.
- You are fine keeping framework shells (Next.js, Hono config) in TypeScript while **application logic** moves to `.point`.

Stay on TypeScript/Python alone when:

- The codebase is mostly framework wiring with little domain logic.
- No agent or CI loop will call structured check APIs.
- The team will not run `point check` in CI or editor workflows.

## Bleeding edge for LLM coding agents

Point treats the **compiler as the agent’s runtime partner**:

```bash
point index examples/math.point
point check-json examples/math.point
point explain examples/math.point point://semantic/Math/rule.launch readiness
point repair-plan examples/math.point
```

That loop is not documentation fiction — it ships in `@hatchingpoint/point` today, with semantic refs, LSP, formatter, and VS Code/Cursor extension on the Marketplace. Other languages can add JSON diagnostics; Point’s bet is that **semantic source + refs + repair plans** belong in the language design from day one, not as an afterthought.

## See also

- [Proof of concept](/point/concepts/proof-of-concept) — side-by-side examples and measurable workflow wins
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages) — detailed comparison table
- [Philosophy](/point/concepts/philosophy)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [AI overview](/point/ai/overview)
