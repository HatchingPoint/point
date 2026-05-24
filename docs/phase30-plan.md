# Phase 30 — Record → SQL productization

**Status:** Draft — not started  
**Prerequisite:** Phase 27 complete (P27-4 `build-schema` spike shipped in v0.1.20); Phases 28/29 may still be active — run **after** 28/29 exit gates or in a dedicated chat with file ownership respected  
**North star:** Authors define data with `record` blocks; `point build-schema` emits **production-ready DDL and migrations** — not a one-off spike with JSON blobs for every nested shape.

---

## What “productization” means

Phase 27 shipped a **spike**: `point build-schema` emits portable `CREATE TABLE IF NOT EXISTS` from `record` blocks, maps scalars, stores `List<T>` and nested records as JSON `TEXT`, and rejects unmappable types via `record-sql-unsupported-type`.

Phase 30 turns that spike into a **durable schema pipeline**:

1. **Relational mapping** — nested record fields become FK columns + `REFERENCES` stubs (not only JSON comments)
2. **Nullable / optional** — `Maybe<T>` fields emit nullable columns with correct SQL types
3. **Temporal types** — `Instant` maps to `TIMESTAMP` (or dialect-specific equivalent)
4. **Dialect selection** — `--dialect postgres|sqlite` (default postgres) with tested type mapping
5. **Migration output** — numbered `migrations/NNN_<module>.sql` (or `--output migrations/`) alongside raw DDL
6. **Multi-module aggregation** — `point build-schema src/` resolves module graph and emits one schema (dependency order)
7. **Agent loop** — new diagnostics have semantic refs, repair hints, index/explain coverage

This is **real integration**: extend `emit-sql-schema.ts`, `check-sql-schema.ts`, and CLI — not a wrapper around Prisma or Drizzle.

---

## Why sequential (after 28/29)

| Track | Primary files |
|-------|----------------|
| Phase 28 | `cli.ts` repair/index, `fixtures/agent-repair`, benchmarks |
| Phase 29 | `emit-python.ts`, `python_std/`, py-parity tests |
| **Phase 30** | `emit-sql-schema.ts`, `check-sql-schema.ts`, `cli build-schema`, `tests/sql-schema*` |

Low overlap with 28/29 if ownership is respected. All tracks may touch `bun run ci` and release metadata — use **integrator commits** when promoting Phase 30 to execution.

---

## Principles

Same as [point-principles-gate.md](./point-principles-gate.md):

- **Semantic** — schema derives from `record` blocks; no author-facing ORM syntax
- **Agent loop** — `record-sql-*` diagnostics use `point://semantic/` refs and repair hints
- **General proof** — extend `examples/app/notes/` or add `examples/data/schema-demo.point`
- **Boring emit** — readable SQL comments; authors apply migrations with their tool of choice

---

## Success criteria (Phase 30 exit gate)

- [ ] **FK from nested records** — `user: User` emits `user_id TEXT REFERENCES user(id)` (or documented FK stub pattern) instead of JSON-only
- [ ] **`Maybe<T>` nullable columns** — optional fields emit `NULL`-able SQL with correct base type
- [ ] **`Instant` → TIMESTAMP** — typed instant fields map in postgres + sqlite dialects
- [ ] **Dialect flag** — `point build-schema --dialect postgres|sqlite` with parity tests for both
- [ ] **Migration files** — `--migrations <dir>` writes numbered SQL; idempotent re-run documented
- [ ] **Multi-module schema** — build-schema over a module directory merges records from dependency graph
- [ ] **General example** — notes or ecommerce module demonstrates full schema + `std.sql` action path in docs
- [ ] `bun run ci` passes; patch release **v0.1.22+** (integrator after 28/29)

---

## Non-goals

- Full ORM, query builder, or automatic migration runner inside Point
- Convex/vendor-specific schema blocks
- Agent repair fixtures (28) or Python emit (29)
- `Map<K,V>`, `Money`, `Result` primitives — remain audit deferrals unless promoted separately
- SQLite as default production DB — postgres remains default; sqlite for local/dev parity only

---

## Workstreams

### P30-1 — Relational FK mapping (Wave 1)

Extend `mapRecordFieldToSqlColumn` and checker:

- Detect nested record field types → FK column + `REFERENCES parent(id)` stub
- Preserve JSON fallback for `List<Record>` (document as non-relational)
- New diagnostic `record-sql-fk-ambiguous` when multiple FK candidates or missing `id` on target record
- Tests: `tests/sql-schema-fk.test.ts`

**Touch:** `emit-sql-schema.ts`, `check-sql-schema.ts`, tests

---

### P30-2 — Nullable and Instant types (Wave 1)

- `Maybe<Text>` etc. → nullable column, no spurious `NOT NULL`
- `Instant` → `TIMESTAMP WITH TIME ZONE` (postgres) / `TEXT` ISO (sqlite spike OK with comment)
- Extend `record-sql-unsupported-type` messages for new mappings

**Touch:** same as P30-1; update `docs/site/toolchain/build-schema.md`

---

### P30-3 — Dialect + migration output (Wave 2)

- CLI: `--dialect`, `--migrations <dir>`, `--output <file>`
- Migration naming: `001_<module>_init.sql` with header comments
- Document apply workflow (Flyway, golang-migrate, manual psql)

**Touch:** `cli.ts`, `emit-sql-schema.ts`, docs

---

### P30-4 — Multi-module aggregation + example (Wave 2)

- Resolve module graph (reuse build dependency order from multi-file support)
- Merge tables; detect duplicate record names across modules → diagnostic
- Example: `examples/data/schema-demo.point` or extend notes app with build-schema docs
- Index/explain for new `record-sql-*` codes

**Touch:** `cli.ts`, `tests/sql-schema*.test.ts`, `semantic/context.ts` (explain only), docs

---

## File ownership

**Phase 30 only:**

- `packages/point/src/core/emit-sql-schema.ts`
- `packages/point/src/semantic/check-sql-schema.ts`
- `packages/point/src/core/cli.ts` (`build-schema` subcommand only — coordinate with 28 if editing shared CLI)
- `tests/sql-schema*.test.ts`
- `docs/site/toolchain/build-schema.md`, `examples/data/` or notes schema docs

**Do not touch (28/29):**

- `tests/fixtures/agent-repair/**`, `benchmarks/agent-repair-cases.json` (28)
- `emit-python*.ts`, `python_std/**`, py-parity tests (29)
- Theme, view source maps, middleware validation (27 — complete)

---

## After Phase 30

- **Phase 31 (candidate):** Typed domain errors / `Result` variant patterns — close audit gap for rich errors
- **Phase 31 (alternate):** Agent loop maturity — repair sufficiency SLA, benchmark regression gate in CI (if 28 leaves gaps)
- **Later:** ORM, SSR — still non-goals until data + multi-target emit are solid

---

## Agent dispatch

See [codex-goal-phase30.md](./codex-goal-phase30.md).
