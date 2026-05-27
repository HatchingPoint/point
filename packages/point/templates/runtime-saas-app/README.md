# {{APP_NAME}}

Point **runtime-native SaaS** app - auth middleware, SQLite, SSR navigation, and JSON routes run through the owned Point runtime. There is no `web/` directory, Vite host, or generated app tree.

## Commands

```bash
bun install
bun run check
bun run init:db
bun run dev
```

Open the URL printed by `point dev`.

Useful routes:

| Path | Purpose |
|------|---------|
| `/settings` | Runtime-rendered settings page |
| `/members` | Runtime-rendered members datagrid (SQLite via `load data`) |
| `/members/new` | Create-member form |
| `/login` | Login form |
| `/api/health` | Health check |
| `/api/login` | Demo login, password `demo` |
| `/api/members` | SQLite-backed members API; `POST` requires a Bearer token |

## Layout

| Path | Purpose |
|------|---------|
| `src/app.point` | Auth, SQLite actions, routes, pages, and commands |
| `point.json` | Manifest (`runtime: "owned"`) |

SQLite uses `DATABASE_URL=sqlite:./data/members.db` by default in `bun run init:db`. Production secrets and database paths should be provided as environment variables by the host.
