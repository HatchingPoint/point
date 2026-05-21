# Compiler passes in Point

Self-hosted compiler policy lives here as ordinary `.point` modules. Each pass expresses validation rules with semantic blocks (`record`, `rule`, `calculation`, `label`) and runs through the same toolchain as application code.

## Passes

| Pass | File | Purpose |
|------|------|---------|
| Naming lint | `naming-lint.point` | Validates lowering names for calculations, rules, and labels against the compiler naming contract |

## Naming contract (mirrors TypeScript emitter)

- **Calculations** and **rules** lower to camelCase identifiers; rules append the PascalCase output name when it is not already a suffix (e.g. `rule cart total` → `cartTotal`, `rule launch readiness` with output `score` → `launchReadinessScore`).
- **Labels** append `Label` (e.g. `label user status` → `userStatusLabel`).

Fixture cases in `naming-lint.point` encode expected lowerings from `examples/cart-total.point` and `examples/math.point`.

## Run locally

```bash
bun packages/point/src/cli.ts check compiler/passes/naming-lint.point
bun packages/point/src/cli.ts test compiler/passes/naming-lint.point
```

CI runs this pass via `point test-all` (`compiler/**/*.point` is in the default module graph) and `tests/point-core.test.ts`.

## Adding a pass

1. Add `compiler/passes/<name>.point` with zero-input `calculation test …` blocks returning `Bool`.
2. Document the pass in this README.
3. Extend `tests/conformance/conformance.test.ts` fixture list if the pass should appear in conformance discovery.
4. Append a milestone to [docs/self-hosting.md](../../docs/self-hosting.md).

Roadmap: [docs/self-hosting.md](../../docs/self-hosting.md).
