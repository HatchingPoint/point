# Point Performance

## Direct JavaScript Emit

Point can emit JavaScript directly, skipping TypeScript syntax and interface declarations.

```bash
bun packages/point/src/cli.ts build-js examples/math.point generated/math.js
bun packages/point/src/cli.ts build-js-all
```

Use this when Bun or Node executes generated output directly and you do not need TypeScript as an intermediate artifact.

## Benchmark

Compare emit backends on your machine:

```bash
bun scripts/benchmark-emit.ts
BENCHMARK_ITERATIONS=1000 bun scripts/benchmark-emit.ts
```

On typical developer hardware, direct JavaScript emit is modestly faster because it omits type annotations and interface blocks. The bigger win is pipeline simplicity, not raw speed.

## Incremental Checks

Enable incremental `check-all` with a source-hash cache:

```bash
POINT_INCREMENTAL=1 bun packages/point/src/cli.ts check-all
```

Cache data lives in `.point-cache/manifest.json`. Unchanged files with a prior successful check are skipped until their source hash changes.

Limitations today:

- Cache applies to `check-all`, not `build-ts-all` yet
- Dependency changes in linked modules do not invalidate dependents automatically
- Delete `.point-cache` to force a full rebuild

## When To Use Which Target

| Target | Use when |
|--------|----------|
| `build-ts` / `build-ts-all` | Importing into TypeScript projects, React/Vue targets, typed editor tooling |
| `build-js` / `build-js-all` | Bun-first runtime, smallest generated output, no `tsc` step |

Phase 7 AST modernization should improve both backends equally because they share the same core IR.
