---
title: Deploy runtime-owned apps
description: Production deploy for point.json runtime owned apps — no Vite, React, or generated host tree.
quadrant: Reference
---

## Summary

Apps with `point.json` `"runtime": "owned"` (the default from `point create`) ship as **one Bun process**: owned interpreter, HTTP, SSR, forms, and JSON routes from `packages/point/runtime/`. You do not run `point build-app`, emit TypeScript for views, or build a `web/` bundle.

**Legacy templates** (`full-stack-app`, `saas-app`, `vercel-app`) still use emit + Vite — see [Deploy Point apps](/point/toolchain/deploy).

## Prerequisites

- Bun on the host (Render, Railway, Fly, Docker, or your VM)
- `@hatchingpoint/point` in `devDependencies` (templates ship this)
- Environment variables for secrets and database URLs — read via `capabilities env` / `std.env` in actions, never hard-coded in source

## Local production smoke

```bash
point check src/app.point
point serve src/app.point --port 8080
```

Or from a scaffolded app:

```bash
bun run serve
```

Open the printed URL. SSR pages, form POSTs, and JSON routes (for example `GET /readiness`) should respond without a separate frontend dev server.

## Render / Railway / Fly (no Docker)

| Setting | Value |
|---------|--------|
| Runtime | Bun |
| Build command | `bun install` |
| Start command | `bun run serve` or `point serve src/app.point --port $PORT` |
| Health check | HTTP GET on a JSON route or SSR page (for example `/readiness`) |

Set platform env vars in the dashboard:

| Variable | Use |
|----------|-----|
| `PORT` | Usually injected by the host; pass through to `point serve --port` if your start script reads it |
| `DATABASE_URL` | SQLite (`sqlite:./data/app.db`) or Postgres connection string for `runtime-saas-app` |
| `JWT_SECRET` | Auth signing for SaaS templates — override demo defaults in production |

For SQLite on ephemeral disks, mount a persistent volume or use a hosted Postgres URL instead.

## Docker (optional)

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
ENV PORT=8080
CMD ["bun", "run", "serve"]
```

Build and run:

```bash
docker build -t my-point-app .
docker run -p 8080:8080 -e DATABASE_URL=sqlite:/data/app.db my-point-app
```

No multi-stage Vite build step is required for owned-runtime apps.

## Runtime SaaS template

```bash
point create my-saas --template runtime-saas-app
cd my-saas
bun install
point run src/app.point init database
```

Production:

```bash
DATABASE_URL=sqlite:/data/members.db bun run serve
```

Verify:

- `POST /api/login` with password `demo` returns a JWT (change demo credentials before production)
- `GET /api/members` lists rows after init
- Protected routes return `401` without a Bearer token

## CI before deploy

```bash
point fmt-check
point check src/app.point
point test tests/*.test.point
```

Owned apps **block** `point build`, `point build-ts`, and `point build-app` for that project surface — do not add emit steps to CI for runtime-owned apps.

## What not to do

- Do not add `web/vite.config.*` or author `*.ts` / `*.tsx` shims — extend `packages/point/runtime/` instead
- Do not commit `generated/` for owned apps; there should be none in the author tree
- Do not assume `:5173` — owned SSR serves from the runtime HTTP port printed by `point dev` / `point serve`

## See also

- [Dev and serve](/point/toolchain/dev)
- [Deploy Point apps](/point/toolchain/deploy) — legacy emit paths
- [Standalone template](/point/ecosystem/standalone-template)
- [Database interop](/point/ecosystem/database-interop)
