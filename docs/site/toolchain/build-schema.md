---
title: SQL schema (build-schema)
description: Emit relational DDL and numbered migrations from Point record blocks.
quadrant: Reference
---

## Summary

`point build-schema` turns `record` blocks into SQL tables. Nested records become foreign keys (`author_id TEXT REFERENCES user(id)`), optional fields use nullable columns (`Maybe<T>`), and `Instant` maps to `TIMESTAMP WITH TIME ZONE` (postgres) or ISO text (sqlite).

Point validates schema mappings before emit and writes idempotent `CREATE TABLE IF NOT EXISTS` DDL. Apply migrations with your own tool — Flyway, golang-migrate, `psql`, or `sqlite3`.

## Single module

```bash
point build-schema examples/data/schema-demo.point generated/schema-demo.sql
point build-schema examples/app/notes/notes.point generated/notes.sql
```

Default output when omitted: `generated/<base>.sql`.

## Dialect selection

```bash
point build-schema --dialect postgres examples/data/schema-demo.point generated/schema-demo.sql
point build-schema --dialect sqlite examples/data/schema-demo.point generated/schema-demo.sqlite.sql
```

Postgres is the default. Sqlite uses `INTEGER`/`REAL`/`TEXT` equivalents and stores `Instant` as ISO-8601 text.

## Migration files

```bash
point build-schema --migrations migrations --sequence 1 examples/data/schema-demo.point
```

Writes `migrations/001_schema_demo_init.sql` with a migration header. Re-run is safe (`CREATE TABLE IF NOT EXISTS`). Increment `--sequence` for later schema changes.

Apply manually:

```bash
psql "$DATABASE_URL" -f migrations/001_schema_demo_init.sql
sqlite3 dev.db < migrations/001_schema_demo.sqlite.sql
```

## Multi-module aggregation

`build-schema` resolves the module dependency graph from `use` imports and merges all `record` blocks into one schema. Pass a directory to combine every `.point` file in that folder:

```bash
point build-schema examples/data generated/data-schema.sql
```

Duplicate record names across modules emit `record-sql-duplicate-table`.

## Type mapping

| Point type | Postgres | Sqlite |
|------------|----------|--------|
| Text | TEXT | TEXT |
| Bool | BOOLEAN | INTEGER (0/1) |
| Int | BIGINT | INTEGER |
| Float | DOUBLE PRECISION | REAL |
| Instant | TIMESTAMP WITH TIME ZONE | TEXT (ISO-8601) |
| Maybe\<T\> | nullable column | nullable column |
| Nested record | `field_id REFERENCES table(id)` | same |
| List\<T\> | TEXT JSON | TEXT JSON |

## Diagnostics

| Code | Meaning |
|------|---------|
| `record-sql-unsupported-type` | Field type cannot map to SQL yet |
| `record-sql-fk-ambiguous` | Nested record target lacks `id: Text` for FK |
| `record-sql-duplicate-table` | Same record name in multiple modules |

Use `point check-json` for structured repair hints before running `build-schema`.

## Notes app example

The notes app (`examples/app/notes/notes.point`) defines `Note` records and uses `std.sql` actions. Generate schema alongside your SQL actions:

```bash
point build-schema examples/app/notes/notes.point generated/notes.sql
point build-py examples/app/notes/notes.point generated/notes.py   # optional Python path
```

## See also

- [Build and emit](/point/toolchain/build-emit)
- [CLI reference](/point/reference/cli)
- [Check JSON](/point/ai/check-json) — structured schema diagnostics
