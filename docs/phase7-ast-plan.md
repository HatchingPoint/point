# Phase 7 — Compiler Modernization (AST-Only Core)

**Prerequisite:** Phases 0–6 in [full-language-plan.md](./full-language-plan.md) must be complete. Do not start Phase 7 until Phase 6 Exit Gate passes and `docs/language-spec.md` + conformance tests exist.

**Goal:** Core stops being text. Semantic `.point` parses to a semantic AST, desugars in-memory to a core AST, then checks and emits. No string-based lowering in the production pipeline.

**Codex prompt:** [codex-goal-phase7.prompt.txt](./codex-goal-phase7.prompt.txt)  
**Progress log:** append checkpoints to [codex-progress.md](./codex-progress.md)

---

## Why Phase 7 Exists

Phases 0–6 deliver a **full product language** (semantic source, I/O, stdlib, runtime tools, apps, publish). The compiler still uses:

```text
semantic text  →  core text (fn/type/let)  →  parse  →  AST  →  emit
```

Phase 7 moves to the standard model:

```text
semantic text  →  parse  →  semantic AST  →  desugar  →  core AST  →  check  →  emit
```

Core becomes **data structures only**, like Python's AST — not a second source language in the repo.

---

## Non-Negotiable Principles

- [x] Public `.point` source stays semantic only — no change to author-facing syntax from Phase 6
- [x] All Phase 6 conformance tests must keep passing throughout Phase 7
- [x] Desugaring is in-memory AST transforms — no `lowerSemanticPointSyntax()` string output in production path
- [x] Diagnostics and spans map to **semantic source** lines, not lowered core text
- [x] `parsePointCore()` on author-facing files remains rejected; core text parser lives under `core/test-only/` for IR unit tests

---

## Target Architecture

```text
packages/point/src/
  semantic/
    parse.ts          ← parse .point → semantic AST
    ast.ts            ← record, calculation, rule, label, action, …
    desugar.ts        ← semantic AST → core AST
  core/
    ast.ts            ← fn bodies, types, expressions (IR nodes only)
    check.ts
    emit-typescript.ts
    emit-javascript.ts  ← optional, from Phase 6.3
```

Production entry: `parsePointSource()` → semantic AST → desugar → core AST → check → emit.

---

## Phase 7.1 — Semantic AST model

- [x] Define `PointSemanticProgram` and declaration nodes mirroring all public constructs from `docs/language-spec.md`
- [x] Each node carries `PointSourceSpan` tied to original `.point` source
- [x] Document semantic AST schema in `docs/language-spec.md` (append AST section)
- [x] Add snapshot tests for semantic AST shape of `examples/math.point`, `examples/cart-total.point`

**Verify:** Semantic AST tests pass without invoking core text lowering.

---

## Phase 7.2 — Semantic parser (direct to AST)

- [x] Implement semantic parser that reads `.point` and returns semantic AST (replace line-based lowering for new path)
- [x] Parser covers all constructs shipped in Phases 0–6
- [x] Feature-flag or parallel path: `parsePointSourceV2()` behind env/config until cutover
- [x] Tests: every `examples/**/*.point` file parses to semantic AST

**Verify:** `bun test` semantic parse suite passes.

---

## Phase 7.3 — AST desugar passes

- [x] Implement desugar: `record` → core type declaration nodes
- [x] Desugar: `calculation`, `rule`, `label`, `action`, `external`, `policy`, `workflow`, `view`, `route`, `command` (only those that exist after Phase 6)
- [x] Desugar: `for each`, mutation forms, `when`/`otherwise`, result types, `Maybe<T>`
- [x] Desugar: multi-file `use` → core import graph (preserve Phase 1.5 behavior)
- [x] Document desugar rules in `docs/language-spec.md`
- [x] Tests: desugar output matches current core AST for all conformance fixtures

**Verify:** Desugared core AST matches legacy pipeline output for every conformance test.

---

## Phase 7.4 — Cut over production pipeline

- [x] Wire `parsePointSource()` to semantic parse → desugar → core AST (remove string lowering from hot path)
- [x] Remove or gate `lowerSemanticPointSyntax()` — delete when parity proven
- [x] CLI, check, fmt, index, explain, repair-plan use new pipeline
- [x] Semantic formatter operates on semantic AST (not text regex), or preserves round-trip through parse → format

**Verify:** `bun run ci` passes with new pipeline as default.

---

## Phase 7.5 — Diagnostics and refs on semantic spans

- [x] All `check-json` diagnostics use semantic refs and semantic source spans
- [x] Remove dependency on core-text line numbers for public diagnostics
- [x] `explain` and `index` index semantic AST nodes directly
- [x] Tests: diagnostic spans point at `.point` lines agents expect

**Verify:** Breaking-change test suite for diagnostic span accuracy passes.

---

## Phase 7.6 — Retire core text parser (public surface)

- [x] Move `parsePointCore` to test-only module or delete if fully redundant
- [x] Remove dependency on core-text line numbers for public diagnostics — `assertSemanticPointSource` still rejects core syntax in author files; production never generates core text
- [x] Update `tests/point-core.test.ts`: split into semantic tests + core IR unit tests
- [x] Update docs: "core is AST IR, not a source language"

**Verify:** No production code path emits or re-parses core source text.

---

## Phase 7.7 — Emit backends on AST

- [x] Confirm TypeScript emit unchanged from author perspective
- [x] If Phase 6.3 direct JS emit exists, wire it to core AST only
- [x] Benchmark: old string-lowering path vs AST path (document in `docs/phase7-benchmarks.md`)
- [x] Optional: incremental re-check for edited modules (`POINT_INCREMENTAL=1`, Phase 6.3)

**Verify:** Emit output byte-identical or documented acceptable diff vs Phase 6 baseline.

---

## Phase 7 Exit Gate

Do not declare Phase 7 complete until all are true:

- [x] Every checkbox in Phase 7.1–7.7 is checked
- [x] `bun run ci` passes
- [x] `tests/conformance/` passes entirely on new pipeline
- [x] No `lowerSemanticPointSyntax` in production path
- [x] `docs/language-spec.md` documents semantic AST + desugar rules
- [x] `docs/codex-progress.md` contains Phase 7 GOAL COMPLETE checkpoint

---

## Validation Loop (every section)

```bash
bun test
bun run fmt-check
bun run check
bun run build
bun run ci
```

---

## Progress Tracker

| Section | Name | Status |
|---------|------|--------|
| 7.1 | Semantic AST model | Complete |
| 7.2 | Semantic parser | Complete |
| 7.3 | AST desugar passes | Complete |
| 7.4 | Production cutover | Complete |
| 7.5 | Semantic diagnostics | Complete |
| 7.6 | Retire core text | Complete |
| 7.7 | Emit backends | Complete |

**Active section:** Phase 7 complete — see Exit Gate

**Last updated:** 2026-05-21
