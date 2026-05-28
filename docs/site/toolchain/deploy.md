---
title: Deploy Point apps
description: Production builds, Bun serve, and Vercel — no platform-specific deploy magic.
quadrant: Reference
---

## Summary

**Default path:** apps with `point.json` `"runtime": "owned"` deploy as one Bun process — `point serve` runs owned HTTP, SSR, forms, and JSON routes with no Vite or React build. See [Deploy runtime-owned apps](/point/ecosystem/runtime-deploy).

**Advanced emit path:** check and build JavaScript or TypeScript for tooling, automation, or host integration. The CLI does not upload binaries or provision cloud resources — you wire artifacts into your platform.

## Production build

Use the default JavaScript emit path with the production flag:

```bash
point check src/app.point
point build --production src/app.point generated/app.js
```

`--production` selects the **optimized emit path**: a production header in generated output, tighter blank-line spacing, and the same readable glue as dev builds. Run your host bundler or minifier (esbuild, Bun build, Vercel's pipeline) on `generated/*.js` before shipping.

For React views and layout, emit TypeScript and build through your frontend toolchain:

```bash
point build-ts src/app.point generated/app.ts
```

Database access stays in `action` blocks with `touches database` — wire connection strings via `std.env` in your host bootstrap. See [Database interop](/point/ecosystem/database-interop).

## Bun — Runtime-native app

For apps scaffolded with `point create` (the default `runtime-app`):

```bash
bun install
point check src/app.point
point dev src/app.point
```

Production:

```bash
point serve src/app.point --port 8080
```

Or `bun run serve` from the template.

`point serve` runs the owned runtime server for HTTP, SSR, forms, and JSON routes. No Vite build or Next.js host is required for the default app.

### Render, Railway, Fly (no Docker)

Runtime apps are a single **Web Service**: one Bun process serves runtime SSR and routes.

| Setting | Value |
|---------|--------|
| Runtime | Bun |
| Build command | `bun install` |
| Start command | `bun run serve` |

Set environment variables (`DATABASE_URL`, etc.) in the host dashboard — load them in Point via `std.env` inside actions.

## Bun — API and route apps

Route modules emit `createPointRouteFetchHandler()` and a `serve …` command that calls `Bun.serve`. After production build:

```bash
point build --production examples/api/middleware-demo.point generated/middleware-demo.js
PORT=8080 bun generated/middleware-demo.js
```

Or invoke the exported serve command if your module names one (for example `serveMiddlewareDemo` from `command serve middleware demo`).

**Schedules:** dev emit uses `setInterval`; in production prefer external cron calling `point run` or a one-shot action — see [point run](/point/toolchain/run).

**Process model:** long-lived `bun` process behind a reverse proxy (nginx, Caddy, Fly, Railway) is the typical pattern. Set `PORT` from the platform.

## Vercel — static UI + serverless API

Split concerns by emit target:

| Artifact | Command | Vercel role |
|----------|---------|-------------|
| React views / pages | `point build-ts` → `tsc` / Vite / Next adapter | Static or SSR frontend |
| HTTP routes / actions | `point build --production` → serverless handler | API routes or Edge functions |

1. Check and build in CI: `point check-all`, `point build --production` (or `build-ts` for UI).
2. Point `generated/` into Vercel `outputDirectory` or import handlers from `api/` that re-export emitted functions.
3. Map environment variables (`JWT_SECRET`, `DATABASE_URL`, etc.) in the Vercel project — load them in Point via `std.env` inside actions, never in source.

Point does not ship a Vercel adapter; treat emit as normal TypeScript/JavaScript your framework already consumes.

## Database wiring

Point emits action functions; your deploy wires them to a shared pool:

- Set `DATABASE_URL` (or driver-specific env) in the host
- Run migrations with your tool of choice (`dbmate`, Prisma migrate, etc.)
- Import emitted actions from route handlers or serverless entrypoints

See [Database interop](/point/ecosystem/database-interop).

## Suggested CI pipeline

```bash
point fmt-check-all
point check-all
point build-all          # or per-entry: point build --production src/app.point generated/app.js
point build-ts-all       # when the app has views/pages
point test-all
```

Commit `.point` source and generated snapshots only if your team checks them in; many teams regenerate `generated/` in CI.

## Local smoke before deploy

```bash
point run src/app.point
point dev src/app.point --port 3456   # hot reload; not for production
```

## See also

- [Deploy runtime-owned apps](/point/ecosystem/runtime-deploy)
- [Dev and serve](/point/toolchain/dev)
- [Build and emit](/point/toolchain/build-emit)
- [point run](/point/toolchain/run)
- [CLI reference](/point/reference/cli)
- [Database interop](/point/ecosystem/database-interop)
