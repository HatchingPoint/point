---
title: Dev and serve
description: Hot reload for routes, schedules, and full-stack apps — plus production serve for Path B.
quadrant: Reference
---

## Summary

`point dev` watches your module graph, re-checks on save, and re-runs the dev entry. For full-stack apps (navigation + routes + `web/`), it also starts Vite for the React UI.

`point serve` is the production counterpart: one Bun process serves static files from `dist/` and API routes under `/api/*`.

## point dev

```bash
point dev src/app.point
point dev src/app.point --port 4000
point dev src/app.point --api
```

| Flag | Effect |
|------|--------|
| `--port <n>` | API / route server port (default `3456`) |
| `--api` | API-only — skip Vite even when `web/` exists |

### Modes (auto-detected)

| Mode | When | What runs |
|------|------|-----------|
| **app** | Bootstrap navigation + routes + `web/vite.config.*` | Bun API + Vite UI (`:5173` by default) |
| **routes** | Route blocks present | Bun HTTP server only |
| **schedules** | Schedule blocks + run entry | Re-runs schedule entry on rebuild |
| **run** | Zero-input action/command | Re-runs entry (smoke / CLI apps) |

On `.point` file changes, Point rebuilds emit and restarts the API. Vite handles UI hot module replacement for generated TypeScript.

**UI port:** set `VITE_PORT` (default `5173`). Vite proxies `/api` to the API port via `VITE_API_PORT`.

### Full-stack template

```bash
point create my-app
cd my-app
bun install
bun run dev
```

Open **http://localhost:5173** for the UI. API listens on **http://localhost:3456**.

### point build-app

```bash
point build-app src/app.point
```

Check + emit JS/TS + Vite production build → `dist/`.

## point serve

Production server for Path B apps — requires a prior frontend build (`dist/`) and route emit (`generated/*.js`).

```bash
point build-ts src/app.point generated/app.ts
point build-js src/app.point generated/app.js
vite build --config web/vite.config.ts
point serve src/app.point --port 8080
```

Or use template scripts: `bun run build` then `bun run serve`.

| Flag | Effect |
|------|--------|
| `--port <n>` | Listen port (default `3456`) |
| `--static <dir>` | Static root (default `dist`) |

Routing:

- Paths starting with `/api/` → Point route handlers
- All other paths → static files from `dist/`, with SPA fallback to `index.html`

## Environment

| Variable | Effect |
|----------|--------|
| `POINT_INCREMENTAL=1` | Cache unchanged modules during dev rebuilds |
| `PORT` | Override listen port for route/serve servers |
| `VITE_PORT` | Vite dev server port (app mode) |
| `VITE_API_PORT` | API port Vite proxies to (app mode) |

## See also

- [Deploy](/point/toolchain/deploy) — production build and hosting
- [Build and emit](/point/toolchain/build-emit) — emit targets
- [CLI reference](/point/reference/cli)
- [Routes](/point/language/routes)
