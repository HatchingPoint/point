---
title: Point vs other languages for AI engineering
description: How Point compares to TypeScript, Python, Rust, DSLs, and prompt-only workflows when coding agents write and repair software.
quadrant: Explanation
---

## Summary

For **human-only** coding, staying on TypeScript or Python is often enough. For **LLM coding agents** that write, check, and repair application logic continuously, Point is designed as the bleeding-edge option: semantic source, stable refs, and compiler APIs that other languages do not ship as a cohesive package.

## Comparison at a glance

| Dimension | TypeScript / JavaScript | Python | Rust / Go | Narrow DSL / YAML rules | Point |
|-----------|-------------------------|--------|-----------|-------------------------|-------|
| General-purpose app logic | ✅ | ✅ | ✅ | ❌ usually | ✅ |
| Preserves product intent in syntax | ❌ implementation-first | ❌ same | ❌ same | ✅ limited domain | ✅ `record`, `rule`, `label`, … |
| Stable symbol refs for agents | ❌ line/file based | ❌ same | ❌ same | ⚠️ sometimes | ✅ `point://semantic/...` |
| Structured repair diagnostics | ⚠️ text errors | ⚠️ text errors | ⚠️ text errors | ⚠️ varies | ✅ `check-json` + `repair` |
| `explain` / `index` / `repair-plan` | ❌ | ❌ | ❌ | ❌ | ✅ CLI |
| Effect boundaries in source | ❌ discipline | ❌ discipline | ✅ types | ⚠️ varies | ✅ `action`, `policy`, `external` |
| Runs on existing JS stack | ✅ native | ⚠️ separate runtime | ❌ without FFI | ⚠️ | ✅ emit JS default |
| Agent-first language design | ❌ retrofitted | ❌ retrofitted | ❌ retrofitted | ⚠️ partial | ✅ core thesis |

## TypeScript and JavaScript

**Strengths:** Ecosystem, hiring, React/Next/Bun, mature types, great human IDE experience.

**Gap for agents:** Source is optimized for human readers of `function`, `class`, and `interface`. A scoring rule and a utility helper look the same. Diagnostics point at types and lines, not at “the `rule launch readiness` block.” Formatters and import organizers move line numbers; agents re-search by string match.

**How Point relates:** Point **replaces hand-written TS for application logic** you want agents to own. Framework shells, config, and third-party `.ts` files can remain. Emit stays boring TypeScript or JavaScript for interop — see [Authoring vs runtime](/point/concepts/authoring-vs-runtime).

**When TS alone wins:** Thin UI glue, mostly npm composition, no agent repair loop in CI.

**When Point wins:** Rules, models, commands, and workflows that agents change weekly; you want `point check-json` in CI.

## Python

**Strengths:** Data scripts, ML adjacency, readable syntax for humans.

**Gap for agents:** Same line-based repair story. Business logic in Django/FastAPI apps mixes framework layers with domain code. Optional typing is inconsistent across codebases.

**How Point relates:** `point build-py` emits Python for logic, actions, routes, workflows, and commands. Views, layouts, and realtime client code still target JS/TS. Point is not claiming to replace every Python service — it targets the **logic and automation agents should patch**, with emit parity for server-side Python where teams need it.

**When Python alone wins:** Notebook-style analytics, heavy C extensions, existing Python-only ops.

**When Point wins:** Shared logic must be checked once and emitted to both JS services and Python workers; agents need the same semantic source either way.

## Rust and Go

**Strengths:** Performance, strong contracts, excellent human-driven refactors.

**Gap for agents:** Steeper syntax surface; longer generated patches; compile times can slow agent loops. Neither ships semantic product blocks or `point://` refs for LLM repair.

**How Point relates:** Point is not competing on systems programming. Use Rust/Go for kernels and hot paths; use Point for **product semantics** emitted into TS/JS that your app already runs.

## DSLs, config languages, and “rules in YAML”

**Strengths:** Short files, clear domain vocabulary.

**Gaps:** Cannot express HTTP routes, React views, CLI commands, and tests in one checked language. Agents bridge YAML + TypeScript manually — two sources of truth.

**How Point relates:** Semantic blocks **are** the DSL, but generalized: the same module can hold `record`, `rule`, `route`, `view`, and `test` with one checker.

## Prompt-only and Copilot-only workflows

| Technique | What it optimizes | What it does not give you |
|-----------|-------------------|---------------------------|
| Better system prompts | Model behavior | Stable refs after `fmt` |
| RAG over repo | Context | Ground-truth types on patch |
| Copilot inline | Human typing speed | Ordered multi-error repair |
| Point + agent | Patch correctness | — requires adopting `.point` |

Point’s position: **the model proposes; the compiler disposes.** Agents still use LLMs; Point ensures there is a machine-verifiable source and a repeatable repair protocol.

## “In the box” — what other stacks make you build

To approximate Point on TypeScript alone, a team would need to invent and maintain:

- A canonical product-logic syntax (or strict internal DSL)
- A parser and typechecker for that syntax
- JSON diagnostics with refs, expected/actual, repair text
- Symbol index and explain command
- Formatter that preserves ref stability
- Emit to TS/JS/PY for interop
- LSP and editor extension
- CI integration docs for agents

Point ships these as `@hatchingpoint/point` and documents the loop on [Agent workflow](/point/ai/agent-workflow). That is the **worth-it** calculation: not slightly nicer syntax, but **less custom agent infrastructure**.

## Bleeding edge for LLM coding agents

What is genuinely new relative to “TypeScript + Claude”:

1. **Semantic source is the contract** — not comments on TS functions.
2. **Refs are part of the public model** — `point://semantic/Math/rule.launch readiness` is stable across formatting.
3. **Repair plans are ordered** — multi-error files get a sequence, not a dump of stderr.
4. **Effects are declared** — `action` metadata tells agents when filesystem or network is in play.
5. **Authoring vs runtime split** — agents never “fix” generated TS; they fix `.point` and rebuild.

That combination is why Point is positioned as **AI-first general-purpose** — not “a language that also has a linter.”

## Honest limits (read before betting the monorepo)

- Point is not a standalone VM; you still run emitted JavaScript on Bun/Node for most app paths.
- Expression-level source maps are weaker than declaration-level mapping today.
- Not every TypeScript or Python file should migrate — see [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python).
- External adoption is growing; pilot proofs live under `examples/adopters/`.

## Decision guide

| Your situation | Recommendation |
|--------------|----------------|
| Agents edit business rules often | Start with `.point` modules + `check-json` in CI |
| Only humans touch code; no agent CI | Stay on TS/Python |
| Rules in YAML + handlers in TS | Consolidate into Point modules |
| Need max perf native core | Rust/Go core + Point-emitted TS boundary |
| Greenfield app on Bun + agents | Starter template + semantic modules early |

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Proof of concept](/point/concepts/proof-of-concept)
- [AI overview](/point/ai/overview)
- [Repair loops](/point/ai/repair-loops)
- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
