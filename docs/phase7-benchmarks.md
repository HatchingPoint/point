# Phase 7 Benchmarks

Benchmarks compare the **legacy string-lowering pipeline** (test-only: semantic text → core text → parse → check) with the **production AST pipeline** (semantic text → semantic AST → desugar → check → emit).

Run locally:

```bash
bun run benchmark:phase7
BENCHMARK_ITERATIONS=200 bun run benchmark:phase7
bun run benchmark:emit
```

Environment:

| Variable | Default | Purpose |
|----------|---------|---------|
| `BENCHMARK_ITERATIONS` | `50` | Repeat count for phase7 benchmark |
| `BENCHMARK_ITERATIONS` | `500` | Repeat count for emit-only benchmark |
| `POINT_INCREMENTAL=1` | off | Skip unchanged modules in `check-all` (Phase 6.3, unchanged in Phase 7) |

## Results (reference machine, 2026-05-21)

Fixture set: 26 files under `examples/`, `std/`, `compiler/` (8,330 bytes combined).  
Iterations: 50 full parse+check cycles over all fixtures.

| Pipeline | Total | Per iteration |
|----------|-------|---------------|
| Legacy string-lowering (parse + check) | 300.9 ms | 6.018 ms |
| Semantic AST desugar (parse + check) | 197.6 ms | 3.952 ms |

Emit on cached `examples/math.point` core AST (50 iterations):

| Backend | Per emit |
|---------|----------|
| TypeScript | 0.087 ms |
| JavaScript | 0.094 ms |

## Emit parity

`tests/semantic-emit.test.ts` asserts **byte-identical** TypeScript and JavaScript output from the AST pipeline vs the legacy pipeline for every conformance fixture. This confirms author-visible emit is unchanged from Phase 6.

Spot-check during benchmark: TypeScript and JavaScript emit identical for `compiler/naming-lint.point`.

## Production path

CLI `build-ts`, `build-js`, `build-ts-all`, and `build-js-all` call `emitPointCoreTypeScript()` / `emitPointCoreJavaScript()` on `PointCoreProgram` nodes produced by `parsePointSource()` only. No core text is generated or re-parsed before emit.

## Incremental check (optional)

`POINT_INCREMENTAL=1` enables source-hash caching in `check-all` via `packages/point/src/core/incremental.ts`. Unchanged modules skip re-check. This shipped in Phase 6.3 and remains compatible with the AST pipeline.
