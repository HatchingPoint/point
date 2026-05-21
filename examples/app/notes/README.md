# Notes app (database interop)

General-purpose notes UI using **any SQL database** via `std.sql` + parameterized `action` blocks. Works with SQLite locally (Bun); swap the external for `pg`, `@libsql/client`, etc. in production.

## Pattern

```point
external point std sql
  sql query raw(sql: Text, params: List<Text>): Text or Error from "@hatchingpoint/point/std/sql" as sqlQueryRaw

action list notes
  output rows: Text or Error
  touches database
  return sql query raw("SELECT id, title, body FROM notes ORDER BY title", [])

view notes list
  load data from action list notes
  when loading render "Loading notes..."
  when error render "Could not load notes"
  render "Notes"
```

See [Database interop](/point/ecosystem/database-interop) for PostgreSQL and other drivers.

## Run

```bash
point check examples/app/notes/notes.point
point build-ts examples/app/notes/notes.point generated/notes.ts
```

Set `DATABASE_URL=sqlite:./notes.db` (or `POINT_SQL_DATABASE`) before running actions that touch the database.

## Connect any database

| Database | Approach |
|----------|----------|
| SQLite (local) | `use std.sql` or external to `@hatchingpoint/point/std/sql` |
| PostgreSQL | `external postgres driver` + `pg` npm package — see database-interop.md |
| MySQL, LibSQL, etc. | Same pattern: narrow external + parameterized actions |

Point does **not** ship an ORM or migrations. Schema and connection pooling live in your host app.
