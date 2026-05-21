# Point After Phase 7 — Architecture Review

**Status:** Phase 7 (compiler modernization) is **complete** as of 2026-05-21.  
**CI:** `bun run ci` passes (78 tests).  
**Progress log:** [codex-progress.md](./codex-progress.md) — see **Phase 7 GOAL COMPLETE**.

Use this doc to onboard yourself, review what shipped, or paste sections into a Codex `/goal`.

---

## Short answer: Is Point “like Python and TypeScript” now?

**Partly — but not in the way people usually mean.**

| Layer | What it is | Like Python/TS? |
|-------|------------|-----------------|
| **Public `.point` source** | Semantic, AI-first syntax: `record`, `calculation`, `rule`, `label`, `action`, `policy`, `view`, `route`, … | **No** — not `def`, `class`, `fn`, `let`. Authors write product-shaped declarations, not imperative scripts. |
| **Capabilities** | Types, records, lists, `Maybe`, unions, loops, mutation, async/actions, multi-file `use`, stdlib, CLI, VS Code extension | **Yes (general-purpose)** — you can model real apps and libraries without domain-specific builtins. |
| **Core IR (internal)** | Typed AST: functions, types, values, `if`, `for`, assignment, calls — **data structures only** in production | **Similar role to** Python’s `ast` module or TypeScript’s checker IR — **not a second language authors write**. |
| **Runtime today** | Emits **TypeScript** (and optional JS); runs in Bun/Node via generated `.ts` | **Not a standalone Python/TS replacement yet** — interop target is TS/JS ecosystems. |
| **Agent tooling** | Stable `point://` refs, semantic index, explain, repair plans, span-accurate diagnostics | **Unique to Point** — designed for coding agents, not typical in Python/TS toolchains. |

**Bottom line:** Point is a **general-purpose semantic language** with a **low-level typed compiler IR underneath**, comparable to how Python has a high-level language plus an internal AST — except Point’s “high level” is deliberately semantic and agent-friendly, and the primary ship target is still TypeScript.

---

## What changed in Phase 7

### Before (Phases 0–6)

```text
semantic .point  →  string lowering  →  core text (fn/let/type)  →  parse  →  AST  →  check  →  emit
```

Core text was an intermediate **source language** inside the compiler.

### After (Phase 7 complete)

```text
semantic .point  →  parse  →  semantic AST  →  desugar (in memory)  →  core AST  →  check  →  emit
```

- **No string lowering** on the production path.
- **Core text parser** moved to `packages/point/src/core/test-only/` (parity tests + IR unit tests only).
- **Diagnostics** use semantic refs and `.point` line spans.
- **Index / explain** index semantic AST nodes for public files.
- **Emit** unchanged from the author’s perspective (byte-identical TS/JS vs legacy pipeline — see `tests/semantic-emit.test.ts`).

---

## Current compiler pipeline (production)

```text
┌─────────────────┐
│  .point file    │  Author-facing semantic syntax only
└────────┬────────┘
         │ parsePointSource()
         ▼
┌─────────────────┐
│ Semantic AST    │  packages/point/src/semantic/
│ (records, rules)│  ast.ts, parse.ts, spans on nodes
└────────┬────────┘
         │ desugarSemanticProgram()
         ▼
┌─────────────────┐
│ Core AST (IR)   │  packages/point/src/core/ast.ts
│ fn/type/expr    │  Never written by authors in production
└────────┬────────┘
         │ checkPointCore() → emitPointCoreTypeScript() / emitPointCoreJavaScript()
         ▼
┌─────────────────┐
│ generated/*.ts  │  Used by Bun, Node, React, Hono, etc.
└─────────────────┘
```

**Entry point:** `parsePointSource()` in `packages/point/src/core/parser.ts` (~12 lines).

---

## Key packages and files

| Concern | Location |
|---------|----------|
| Semantic AST | `packages/point/src/semantic/ast.ts` |
| Semantic parser | `packages/point/src/semantic/parse.ts` |
| Desugar | `packages/point/src/semantic/desugar.ts` |
| Core IR types | `packages/point/src/core/ast.ts` |
| Type checker | `packages/point/src/core/check.ts` |
| TS / JS emit | `packages/point/src/core/emit-typescript.ts`, `emit-javascript.ts` |
| Semantic diagnostics | `packages/point/src/semantic/context.ts` |
| CLI | `packages/point/src/core/cli.ts` |
| Test-only core text | `packages/point/src/core/test-only/` |
| Language spec | `docs/language-spec.md` (sections 20–22: AST, desugar, emit) |
| Phase 7 plan (done) | `docs/phase7-ast-plan.md` |
| Benchmarks | `docs/phase7-benchmarks.md`, `bun run benchmark:phase7` |

---

## Test coverage map

| Suite | What it proves |
|-------|----------------|
| `tests/point-core.test.ts` | End-to-end semantic language + CLI + apps |
| `tests/core-ir.test.ts` | Core text parser + checker (test-only IR path) |
| `tests/semantic-ast.test.ts` | Every example parses to semantic AST |
| `tests/semantic-desugar.test.ts` | Desugared IR matches legacy for all fixtures |
| `tests/semantic-diagnostics.test.ts` | Semantic refs + source line spans |
| `tests/semantic-emit.test.ts` | TS/JS emit byte-identical vs legacy |
| `tests/conformance/` | Project-wide check/build |

---

## CLI commands (agent-facing)

```bash
bun run check              # typecheck all .point files
bun run check-json FILE    # structured diagnostics (semantic refs + spans)
bun run index FILE         # semantic symbol index (public .point)
bun run explain FILE REF   # explain a point://semantic/... ref
bun run repair-plan FILE   # repair steps from diagnostics
bun run fmt / fmt-check    # semantic formatter
bun run build              # emit TypeScript to generated/
```

---

## What is *not* done yet

| Item | Notes |
|------|-------|
| **Phase 8 product work** | Editor UX, dogfood module, external adopter — see [phase8-plan.md](./phase8-plan.md) |
| **Native Point runtime** | Still emits TS/JS; no standalone VM |
| **Python emit (production)** | Researched, deferred — optional spike in Phase 8.6 |
| **Public core syntax** | Intentionally rejected — `assertSemanticPointSource()` blocks `fn`/`let` in `.point` |

**Shipped (2026-05-21):** `@hatchingpoint/point@0.0.9` on npm, `hatchingpoint.point@0.0.9` on VS Code Marketplace, GitHub Actions publish on tag push, docs at [hatchingpoint.com/point](https://www.hatchingpoint.com/point).

---

## Relationship to the original roadmap

- **Phases 0–6** ([full-language-plan.md](./full-language-plan.md)): Product language — semantic syntax, stdlib, multi-file, actions, views, routes, tooling, conformance.
- **Phase 7** ([phase7-ast-plan.md](./phase7-ast-plan.md)): Compiler modernization — core stops being text; AST-only pipeline. **Done.**

**Phase 8+ directions** — see [phase8-plan.md](./phase8-plan.md):

1. Editor: format-on-save, explain hover, repair quick-fixes
2. Dogfood module for a real Hatching Point use case
3. First external adopter under `examples/adopters/`
4. More self-hosted compiler lint passes in Point
5. Optional: Python emit spike, expression-level source maps

---

## Codex goal templates

See [codex-goal-post-phase7.md](./codex-goal-post-phase7.md) for copy-paste `/goal` blocks and a prompt file.

---

## One-paragraph pitch (for goals or README)

Point is an AI-first general-purpose language: developers write semantic `.point` source (`record`, `calculation`, `rule`, `label`, …), the compiler builds a semantic AST, desugars in memory to a typed core IR, checks types, and emits TypeScript for existing JS ecosystems. Phase 7 retired string-based core lowering; core is compiler IR only. Agents get stable `point://semantic/` refs, span-accurate diagnostics, and repair plans. The language is general-purpose in expressiveness but semantic in syntax — not a clone of Python or TypeScript surface syntax.
