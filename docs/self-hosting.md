# Point Self-Hosting Strategy

Point's compiler is currently implemented in TypeScript. Self-hosting means rewriting compiler passes in Point itself and executing them through the same `point check`, `point build`, and `point test` pipeline used for application code.

## First Self-Hosted Pass

The first pass lives in `compiler/passes/naming-lint.point`. It encodes naming validation rules that mirror the compiler's semantic naming contract:

- calculations lower to camelCase function names
- rules append their output role without duplicate suffixes
- labels append `Label`

Phase 21 extended the pass with fixture cases from `examples/cart-total.point` and `examples/math.point`, kind-specific validation calculations, and a suite test (`test naming fixture suite`). See [compiler/passes/README.md](../compiler/passes/README.md).

Phase 28 added `compiler/passes/diagnostic-catalog.point` — a Point-authored catalog of agent-ready diagnostic codes shipped in Phases 26–27 (middleware inputs, pipeline step I/O, money lint, variant exhaustiveness, view bind targets, plus core `unknown-field` / `missing-await`). Run `point test compiler/passes/diagnostic-catalog.point` in CI via `tests/point-core.test.ts`.

Run it with:

```bash
bun packages/point/src/cli.ts test compiler/passes/naming-lint.point
bun packages/point/src/cli.ts check compiler/passes/naming-lint.point
```

This is intentionally small. It proves Point source can express compiler policy and be tested like any other module.

## Self-Hosting Roadmap

1. **Lint passes in Point** — naming, effect boundaries, missing awaits
2. **Formatter validation in Point** — canonical layout rules checked by semantic rules
3. **Conformance fixtures in Point** — expected lowering behavior expressed as data + rules
4. **Full formatter in Point** — semantic formatter exists in TS; optional Point rewrite once a pass proves the pattern
5. **Parser/desugar in Point** — long-term; depends on sustained self-hosting milestones

## Rules For Self-Hosted Compiler Code

- Compiler passes are ordinary `.point` files under `compiler/`
- They use the same semantic blocks as product code
- They must pass `point test` and be included in CI through conformance tests
- TypeScript compiler code remains until a Point pass reaches parity and replaces it

## Why Start With Lint

Lint passes are pure, easy to test, and do not require rewriting the parser first. They give agents a familiar pattern: express policy in Point, validate with `point test`, ship with the repo.
