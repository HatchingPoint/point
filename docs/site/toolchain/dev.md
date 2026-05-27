---
title: Dev and serve
description: Hot reload for routes, schedules, and full-stack apps — plus production serve for Path B.
quadrant: Reference
---

## Summary

`point dev` watches your module graph, re-checks on save, and re-runs the dev entry. Runtime-owned apps (`point.json` `runtime: "owned"`, the `point create` default) run through `packages/point/runtime/` for interpreter, HTTP, and SSR. Legacy host apps with `web/vite.config.*` can still start Vite.

`point serve` is the production counterpart. Runtime-owned apps serve through `packages/point/runtime/`; legacy host apps serve static files from `dist/` and API routes under `/api/*`.

## point dev

```bash
point dev src/app.point
point dev src/app.point --port 4000
point dev src/app.point --api
```

| Flag | Effect |
|------|--------|
| `--port <n>` | API / route server port (default `3456`) |
| `--api` | Legacy API-only mode — skip Vite even when `web/` exists |

### Modes (auto-detected)

| Mode | When | What runs |
|------|------|-----------|
| **runtime** | `point.json` has `runtime: "owned"` | Point runtime interpreter + HTTP + SSR |
| **app** | Legacy bootstrap navigation + routes + `web/vite.config.*` | Bun API + Vite UI (`:5173` by default) |
| **routes** | Route blocks present | Bun HTTP server only |
| **schedules** | Schedule blocks + run entry | Re-runs schedule entry on rebuild |
| **run** | Zero-input action/command | Re-runs entry (smoke / CLI apps) |

On `.point` file changes, runtime-owned apps re-check and restart the runtime server. Legacy app mode rebuilds emit and restarts the API; Vite handles UI hot module replacement for generated TypeScript.

**Legacy UI port:** set `VITE_PORT` (default `5173`). Vite proxies `/api` to the API port via `VITE_API_PORT`.

### Runtime app template

```bash
point create my-app
cd my-app
bun install
point dev src/app.point
```

Open the URL printed by `point dev`. Use `point create my-app --template full-stack-app` or `--template saas-app` only when you explicitly want the legacy Vite/React host.

### point build-app

```bash
point build-app src/app.point
```

Legacy host build: check + emit JS/TS + Vite production build -> `dist/`. Runtime-owned apps block this path.

## point serve

Production server for runtime-owned apps or legacy Path B apps. Runtime-owned apps do not require `dist/` or route emit; legacy apps require a prior frontend build (`dist/`) and route emit (`generated/*.js`).

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
| `VITE_PORT` | Vite dev server port (legacy app mode) |
| `VITE_API_PORT` | API port Vite proxies to (legacy app mode) |

## See also

- [Deploy](/point/toolchain/deploy) — production build and hosting
- [Build and emit](/point/toolchain/build-emit) — emit targets
- [CLI reference](/point/reference/cli)
- [Routes](/point/language/routes)
