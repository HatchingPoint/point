---
title: Database interop
description: SQL and relational databases through external blocks and parameterized actions — without a Point-owned ORM or DB runtime.
quadrant: Explanation
---

## Summary

Point does **not** ship a database engine, ORM, or migration runner. Relational data belongs in **your** database (PostgreSQL, SQLite, MySQL, etc.). Point modules declare typed `external` boundaries into a driver npm package, then wrap IO in `action` blocks with explicit effect metadata.

Use the pattern on this page when you need direct SQL, an existing ORM host, or a database outside your application framework.

## The pattern in one picture

```text
Author (.point)              Compiler                 Runtime
──────────────────────────────────────────────────────────────────
record Note           →   check types + effects  →   your DB schema
external pg driver    →   emit ES import         →   import from "pg"
action get note       →   async action fn        →   prepared query + params
rule validate note    →   pure guard             →   no IO
```

Semantic blocks stay on the left. Driver imports and connection pooling stay in generated glue and host bootstrap — not in calculations or rules.

## Step 1 — declare the driver external

Pick one npm driver (`pg`, `better-sqlite3`, `@libsql/client`, etc.) and declare a **parameterized** query entry point. Never expose a “run arbitrary SQL string built from user input” helper.

```point
module NotesDb

external postgres driver
  pg query raw(sql: Text, params: List<Text>): Text or Error from "pg" as parameterizedQuery
```

The raw external returns JSON text (or your app's row type) from the driver shim. Keep the signature narrow: fixed SQL template in source, values in `params`.

## Step 2 — wrap IO in actions

Actions carry `touches database` (or `touches network` when the DB is remote) so `point index` and review tools see the boundary.

```point
module NotesDb

external postgres driver
  pg query raw(sql: Text, params: List<Text>): Text or Error from "pg" as parameterizedQuery

record Note
  id: Text
  title: Text
  body: Text

action get note by id
  input note id: Text
  output rows: Text or Error
  touches database
  return pg query raw("SELECT id, title, body FROM notes WHERE id = ?", [note id])

action insert note
  input note id: Text
  input title: Text
  input body: Text
  output rows: Text or Error
  touches database
  return pg query raw("INSERT INTO notes (id, title, body) VALUES (?, ?, ?) RETURNING id, title, body", [note id, title, body])

action list notes
  output rows: Text or Error
  touches database
  return pg query raw("SELECT id, title, body FROM notes ORDER BY title", [])
```

Pure validation stays in `record`, `rule`, and `calculation` blocks — for example title length limits or slug normalization — and runs **before** the action calls the driver.

## Step 3 — host wiring (outside Point)

Connection strings, pool sizing, TLS, and migrations live in host config:

- Environment variables via `std.env` (`DATABASE_URL`, `PGSSLMODE`, etc.)
- Framework bootstrap (Hono middleware, Next.js server module, worker process)
- Migration tool of your choice (`dbmate`, `flyway`, Prisma migrate, etc.)

Point emits the action functions; your deploy wires them to a shared pool. Do **not** hand-edit generated files to inject secrets — read env at runtime in the external shim or host entry.

## Security — parameterized queries only

SQL injection comes from **building query text from untrusted input**. Point has no special SQL syntax; security is a discipline enforced in your module design and driver shims.

| Do | Don't |
|----|-------|
| Fixed SQL template as a string literal in `.point` | `"SELECT * FROM notes WHERE id = '" + note id + "'"` |
| Pass user values only through `params: List<Text>` | Formatting or concatenating identifiers from request fields |
| One statement per call in production shims | Chaining multiple statements in one string |
| Validate shape in `rule` / `policy` before IO | Trusting raw request bodies as column names |

Agents and reviewers should flag any calculation or action that concatenates user `Text` into SQL. Prefer semantic action names (`get note by id`) so diagnostics refer to intent, not driver symbols.

### Identifier parameters

Some drivers use `$1`, `?`, or named placeholders. Match your shim to the driver API, but keep the Point-facing contract “template + param list”. Dynamic table or column names from user input require an allow-list in a **pure** rule — never direct interpolation.

## Optional std.sql spike

For local scripts and tests, `std/sql.point` exposes a minimal parameterized query action backed by Bun's built-in SQLite (`bun:sqlite`). It is a **spike**, not a production Postgres client:

```point
module NotesSqlite

external point std sql
  sql query raw(sql: Text, params: List<Text>): Text or Error from "@hatchingpoint/point/std/sql" as sqlQueryRaw

action get note by id
  input note id: Text
  output rows: Text or Error
  touches database
  return sql query raw("SELECT id, title, body FROM notes WHERE id = ?", [note id])
```

Set `POINT_SQL_DATABASE` or `DATABASE_URL` to a `sqlite:` path (defaults to in-memory). For PostgreSQL in production, use the `external` + driver pattern above — `std.sql` rejects `postgres:` URLs with a clear error.

See repository `std/sql.point` and `@hatchingpoint/point/std/sql` for the runtime shim. Application modules may also `use std.sql` instead of repeating the external declaration.

## Production checklist

1. **Model** domain types with `record` blocks in `.point`.
2. **Declare** one external module per driver with parameterized entry points.
3. **Wrap** every query in an `action` with `touches database`.
4. **Validate** inputs in pure blocks before calling actions.
5. **Check** with `point check` / `point check-all` before emit.
6. **Emit** JavaScript (`point build`) and import actions from your server host.
7. **Run migrations** outside the compiler — Point does not emit DDL.

## Common mistakes

- Putting SQL strings in `calculation` or `rule` blocks and calling externals from there — use `action` with `touches`.
- Returning opaque driver objects — prefer JSON text or typed records you parse in pure code.
- Sharing one global connection inside generated output without host lifecycle — pool in bootstrap.
- Using `std.sql` against PostgreSQL — declare `external postgres driver` instead.

## Agent diagnostic notes

- Database actions appear in `point index` with `effects: ["database"]` when `touches database` is set.
- Prefer semantic action names over raw driver function names in repair plans.
- When adding a new query, extend an existing module's actions rather than new inline externals in business logic.

## See also

- [Effects](/point/language/effects) — `external`, `action`, and `touches`
- [Stdlib bridge](/point/stdlib/bridge) — how `std/*.point` maps to runtime shims
- [Integrations](/point/ecosystem/integrations) — Bun, Node, npm interop
