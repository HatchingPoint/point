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
| **UI** | Settings, members datagrid, login form, create-member form with role select + toasts, theme toggle |
| **Database** | SQLite via `std.sql` — `command init database` creates + seeds members table |
| **Auth** | JWT middleware on `POST /api/members`; login form saves Bearer token in browser storage |
| **Routes** | `GET /api/health`, `GET /api/members`, `POST /api/login`, protected `POST /api/members` |
| **Deploy** | `render.yaml` + `bun run preview` smoke path |

## Scripts

| Script | What it does |
|--------|----------------|
| `init:db` | Create SQLite file and seed demo members |
| `dev` | Vite UI + Bun API with hot reload |
| `build` | Emit Point → `generated/`, then Vite → `dist/` |
| `serve` | Production: static `dist/` + API on one port |
| `preview` | Build then serve (local deploy smoke) |

## Pilot login

1. Open **Login** in the sidebar
2. Enter any email and password `demo`
3. Submit — token is saved and you are redirected to **Members**
4. Use **New member** to create a row via the protected API

## Next steps

1. Swap SQLite for PostgreSQL — see [Database interop](https://hatchingpoint.com/point/ecosystem/database-interop)
2. Add password validation and sign-out UI for production auth
3. Deploy with `render.yaml` — run `bash scripts/deploy-smoke.sh` from the monorepo to verify login + CRUD

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
