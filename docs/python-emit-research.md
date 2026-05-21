# Python Emit Research

## Decision

Point will **not** ship a Python emit backend in Phase 6. TypeScript/JavaScript remains the primary target because Point's near-term product goal is living inside existing JS ecosystems (Bun, Node, React, Vue, Vite).

## Why Not Now

| Factor | Impact |
|--------|--------|
| Semantic surface still evolving | Two emitters doubles maintenance while Phases 0–6 land |
| Runtime model | Point actions/async map naturally to JS promises |
| Ecosystem bridge | npm + Node externals already solve interop |
| Self-hosting priority | Compiler modernization (Phase 7) matters more than Python parity |

## What Python Emit Would Require

1. Shared core IR (Phase 7 AST) stable across backends
2. Python type mapping: `Text`→`str`, `Int`→`int`, `Bool`→`bool`, `List[T]`→`list[T]`, `Maybe[T]`→`T | None`
3. Async emission to `async def` / `await`
4. Effect/import story for Python packages instead of npm externals
5. Conformance suite running identical semantics on TS and Python output
6. Standard library rewritten or bridged for Python runtime

## Recommended Path

1. Finish Phase 7 AST pipeline
2. Add direct JavaScript emit (done in Phase 6.3)
3. Re-evaluate Python emit when an external adopter requires it
4. If pursued, start with **pure logic modules only** (records, calculations, rules, labels) before actions/views/routes

## Prototype Scope (Future)

A viable prototype would emit one fixture such as `examples/math.point` to a single `math.py` with typed functions and no UI/effects. That is enough to validate semantics, not enough for production.
