# {{APP_NAME}}

A Point-native **SaaS starter** — full-stack admin with **auth**, **SQLite**, and an opinionated path from scaffold to deploy.

## Quick start

```bash
bun install
bun run check
bun run init:db
bun run dev
```

Open **http://localhost:5173** for the UI. API on **http://localhost:3456**.

Set `JWT_SECRET` in production (Render generates one in `render.yaml`). Local dev uses a demo fallback when unset.

## Discover and launch

```bash
point demo src/app.point
point box src/app.point
point launch src/app.point admin demo
point launch src/app.point init database
```

## What's wired

| Layer | Included |
|-------|----------|
| **Capabilities** | `auth`, `http`, `sql`, `env` |
| **UI** | Settings, members list, member detail — same shell as full-stack-app |
| **Database** | SQLite via `std.sql` — `command init database` creates + seeds members table |
| **Auth** | JWT middleware on `POST /api/members` — swap secret via `JWT_SECRET` |
| **Routes** | `GET /api/health`, `GET /api/members`, protected `POST /api/members` |
| **Deploy** | `render.yaml` + `bun run preview` smoke path |

## Scripts

| Script | What it does |
|--------|----------------|
| `init:db` | Create SQLite file and seed demo members |
| `dev` | Vite UI + Bun API with hot reload |
| `build` | Emit Point → `generated/`, then Vite → `dist/` |
| `serve` | Production: static `dist/` + API on one port |
| `preview` | Build then serve (local deploy smoke) |

## Next steps

1. Add login UI and pass Bearer tokens to protected routes
2. Swap SQLite for PostgreSQL — see [Database interop](https://hatchingpoint.com/point/ecosystem/database-interop)
3. Extend `POST /api/members` to insert into the members table

## Deploy (Render)

| Setting | Value |
|---------|--------|
| Build command | `bun install && bun run build` |
| Start command | `bun run serve` |

Set `JWT_SECRET` and `DATABASE_URL` in the host dashboard.

## Docs

- [Golden app demo](https://hatchingpoint.com/point/guide/golden-app-demo)
- [Point in 60 seconds](https://hatchingpoint.com/point/guide/point-in-60-seconds)
- [Deploy](https://hatchingpoint.com/point/toolchain/deploy)
