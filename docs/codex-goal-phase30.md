# Codex goals — Phase 30 (Record → SQL productization)

**Prerequisite:** Phase 27 P27-4 spike shipped (`point build-schema`). Prefer starting **after** Phase 28/29 exit gates; if parallel, read [phase30-plan.md](./phase30-plan.md) file ownership first.

**Do not touch:** agent-repair fixtures/benchmarks (28), Python emit/python_std (29), theme/view/middleware (27).

**Principles gate:** [point-principles-gate.md](./point-principles-gate.md) — append gate line to every checkpoint.

---

## Wave 1

```
/goal Execute docs/phase30-plan.md P30-1: FK mapping from nested record fields in emit-sql-schema.ts and check-sql-schema.ts. Add record-sql-fk-ambiguous diagnostic. tests/sql-schema-fk.test.ts. point-principles-gate. Append codex-progress. Do NOT commit unless user asked.
```

```
/goal Execute docs/phase30-plan.md P30-2: Maybe T nullable columns and Instant TIMESTAMP mapping in build-schema emit. Extend tests/sql-schema.test.ts. Update docs/site/toolchain/build-schema.md. Append checkpoint.
```

---

## Wave 2

```
/goal Execute docs/phase30-plan.md P30-3: build-schema --dialect and --migrations CLI flags. Numbered migration file output. Document apply workflow. Append checkpoint.
```

```
/goal Execute docs/phase30-plan.md P30-4: Multi-module build-schema aggregation. examples/data/schema-demo.point or notes schema docs. Index/explain for new record-sql codes in semantic/context.ts. bun run ci. Append checkpoint.
```

---

## Integrator (after Wave 1+2)

```
/goal Phase 30 integrator: bun run ci. Mark phase30-plan.md checkboxes. Append codex-progress. Follow docs/codex-goal-cursor-overnight.md release ritual — patch v0.1.22+ with SQL productization highlights.
```

---

## Goal index (plan checkboxes)

| ID | Checkbox |
|----|----------|
| P30-1 | FK from nested records |
| P30-2 | Maybe nullable + Instant TIMESTAMP |
| P30-3 | Dialect flag + migration files |
| P30-4 | Multi-module aggregation + example |
| P30-5 | General example + docs |
| P30-6 | Index/explain for record-sql codes |
| P30-7 | bun run ci + patch release |

Map P30-5/P30-6 into P30-4 integrator scope; exit gate checkboxes in phase30-plan.md are authoritative.
