# Point Performance

## Platform benchmark (check-all / build-all)

Time project-wide CLI commands on the repo fixture graph:

```bash
bun run benchmark:platform
```

The script discovers all modules under `examples/`, `std/`, and `compiler/`, then reports:

| Step | What it measures |
|------|------------------|
| `check-all (cold)` | Full parse + typecheck, no cache |
| `build-all` | Check + JavaScript emit to `generated/` |
| `check-all (incremental seed)` | First run with `POINT_INCREMENTAL=1` (populates `.point-cache/`) |
| `check-all (incremental warm)` | Second run with cache — must report cached modules |

### Reference results (2026-05-21, Apple Silicon dev machine)

Fixture set: **58 modules**, **42,534 bytes** combined source.

| Command | Total | Per module |
|---------|-------|------------|
| `check-all (cold)` | ~55 ms | ~0.95 ms |
| `build-all` | ~67 ms | ~1.16 ms |
| `check-all (incremental warm)` | ~60 ms | ~0.98 ms |

Warm incremental runs still read every file and compare source hashes, so total time stays **O(m)** in module count **m**. The win is skipping **parse + check** work on unchanged modules — expect `(N cached)` in CLI output and near-zero check CPU for large graphs where typechecking dominates.

### Complexity expectations

| Operation | Cold | Incremental (`POINT_INCREMENTAL=1`) |
|-----------|------|---------------------------------------|
| Module discovery | O(m) | O(m) |
| Source read + hash | O(m) | O(m) |
| Parse + check | O(m) | O(changed) |
| Emit (`build-all`) | O(m) | O(m) — no emit cache yet |

Graph resolution and topological ordering are O(m + e) where **e** is the `use` edge count. Per-module check and emit are linear in source size.

Scale target for Phase 21: **100-module graphs** should stay under **~200 ms** cold check and **~300 ms** cold build on typical developer hardware. Re-run `benchmark:platform` after adding fixtures to confirm.

## Direct JavaScript emit

Point can emit JavaScript directly, skipping TypeScript syntax and interface declarations.

```bash
bun packages/point/src/cli.ts build-js examples/math.point generated/math.js
bun packages/point/src/cli.ts build-js-all
```

Use this when Bun or Node executes generated output directly and you do not need TypeScript as an intermediate artifact.

## Emit micro-benchmark

Compare emit backends on a single cached AST:

```bash
bun run benchmark:emit
BENCHMARK_ITERATIONS=1000 bun run benchmark:emit
```

Or compare legacy vs AST parse+check pipelines:

```bash
bun run benchmark:phase7
BENCHMARK_ITERATIONS=200 bun run benchmark:phase7
```

On typical developer hardware, direct JavaScript emit is modestly faster because it omits type annotations and interface blocks. The bigger win is pipeline simplicity, not raw speed. See [phase7-benchmarks.md](./phase7-benchmarks.md) for AST pipeline numbers.

## Incremental checks

Enable incremental `check-all` with a source-hash cache:

```bash
POINT_INCREMENTAL=1 bun packages/point/src/cli.ts check-all
```

Run twice without editing sources — the second run should print `(N cached)` for all **N** modules:

```bash
rm -rf .point-cache
POINT_INCREMENTAL=1 bun packages/point/src/cli.ts check-all
POINT_INCREMENTAL=1 bun packages/point/src/cli.ts check-all
# → Point core check passed: 58 files (58 cached)
```

`bun run benchmark:platform` automates this verification. Cache data lives in `.point-cache/manifest.json`.

Limitations today:

- Cache applies to `check-all` and `point dev` rebuilds, not `build-all` or `build-ts-all` yet
- Dependency changes in linked modules do not invalidate dependents automatically
- Delete `.point-cache` to force a full rebuild

## When to use which target

| Target | Use when |
|--------|----------|
| `build-ts` / `build-ts-all` | Importing into TypeScript projects, React/Vue targets, typed editor tooling |
| `build-js` / `build-js-all` | Bun-first runtime, smallest generated output, no `tsc` step |

Phase 7 AST modernization improves both backends equally because they share the same core IR.
