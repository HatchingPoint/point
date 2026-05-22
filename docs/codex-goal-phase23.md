# Codex Goals — Phase 23 (Language primitives)

**Master plan:** [phase23-plan.md](./phase23-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Wave 1 (launch in parallel)

### P23-1 — Map<Text, T>

```text
/goal Execute docs/phase23-plan.md P23-1: Add Map<Text, T> type parsing, map { "key": value } literals, lookup map key expression. Wire semantic desugar, checker, JS/TS/Python emit. Add examples/catalog/price-lookup.point and tests/conformance/fixtures/map-lookup.point. Update docs/site/language/types.md and language-spec.md. bun test tests/map-types.test.ts. Commit: "Phase 23 P23-1: Map Text T with lookup."
```

### P23-2 — Money std pattern

```text
/goal Execute docs/phase23-plan.md P23-2: Add std/money.point with record Money (amount cents, currency Text), calculations for add/format/compare. Document cents-as-Int pattern in docs/site/language/types.md. Wire std discovery if needed. point check std/money.point. Commit: "Phase 23 P23-2: std money pattern."
```

---

## Wave 2

### P23-3 — Instant type spike

```text
/goal Execute phase23 P23-3: Spike Instant as Text-backed opaque type or document defer in language-primitive-audit.md with std.time examples. Commit: "Phase 23 P23-3: Instant type decision."
```

### P23-4 — Phase 13 Python route + starter

```text
/goal Execute docs/phase13-plan.md remaining gates: verify Python route emit for examples/route.point, document standalone starter extract path. Update phase13-plan checkboxes. bun test tests/python-route-emit.test.ts. Commit: "Phase 13: close Python route and starter docs."
```

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun packages/point/src/cli.ts check-docs
bun test tests/map-types.test.ts tests/conformance/conformance.test.ts
```
