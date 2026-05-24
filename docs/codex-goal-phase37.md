# Codex goals — Phase 37 (parallel burst)

**Plan:** [phase37-plan.md](./phase37-plan.md)

---

## Wave 1 (parallel)

### Track A — Selective use merge

```
/goal Execute docs/phase37-plan.md P37-1: Add packages/point/src/core/use-merge.ts. Filter dependency declarations to symbols referenced in importer source (plus record/variant type closure and external blocks). Wire into parser collectDependencyDeclarations and cli programWithDependencyDeclarations. tests/use-merge.test.ts with instant-demo vs std/time surface. Do NOT commit unless user asked.
```

### Track B — Domain outcomes guide

```
/goal Execute docs/phase37-plan.md P37-2: Add docs/site/language/domain-outcomes.md (variant-first outcomes, on Case, on failure return, payment-outcome example). Link from types.md and introduction.md. Do NOT commit unless user asked.
```

### Track C — Template capabilities

```
/goal Execute docs/phase37-plan.md P37-3: Update examples/full-stack-template/README.md and packages/point/templates/full-stack-app/README.md with capabilities (`use http`, point capabilities). Run sync-app-template. Do NOT commit unless user asked.
```

---

## Wave 2 — Integrator

```
/goal Phase 37 integrator: bun run ci. Mark phase37-plan done. CHANGELOG v0.1.29. Bump versions. Update phase-roadmap. Commit and tag v0.1.29.
```
