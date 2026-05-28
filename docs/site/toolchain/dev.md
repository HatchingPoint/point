---
title: Dev and serve
description: Runtime-owned development and production serve — no Vite or React host.
quadrant: Reference
---

## Summary

`point dev` checks your module graph and starts the owned runtime server. Runtime-owned apps (`point.json` `runtime: "owned"`, the `point create` default) run through `packages/point/runtime/` for interpreter, HTTP, and SSR.

`point serve` is the production counterpart — same runtime server without file watching.

Legacy Vite/React host workflows (`full-stack-app`, `saas-app`, `vercel-app`, `point build-app`) were removed in P10.

## point dev

```bash
point dev src/app.point
point dev src/app.point --port 4000
point dev src/app.point --api
```

| Flag | Effect |
|------|--------|
| `--port <n>` | Runtime HTTP server port (default `3456`) |
| `--api` | API-only hint for route modules (no separate UI process) |

### Modes (auto-detected)

| Mode | When | What runs |
|------|------|-----------|
| **runtime** | `point.json` has `runtime: "owned"` or app surface (routes/pages/navigation/streams) | Point runtime interpreter + HTTP + SSR |
| **schedules** | Schedule blocks + run entry | Re-runs schedule entry on rebuild |
| **run** | Zero-input action/command | Re-runs entry (smoke / CLI apps) |

On `.point` file changes, runtime-owned apps re-check and restart the runtime server.

### Runtime app template

```bash
point create my-app
cd my-app
bun install
point dev src/app.point
```

Open the URL printed by `point dev`.

For auth + SQLite, use the runtime SaaS template:

```bash
point create my-saas --template runtime-saas-app
cd my-saas
bun install
point run init database
point dev src/app.point
```

## point serve

Production server for runtime-owned apps. No `dist/` folder or route emit is required.

```bash
point serve src/app.point --port 8080
```

Or use template scripts: `bun run serve`.

| Flag | Effect |
|------|--------|
| `--port <n>` | Listen port (default `3456`) |
| `--static <dir>` | Unused for runtime-owned SSR (kept for CLI compatibility) |

Routing:

- JSON routes, SSR pages, forms, SSE, and WebSocket streams are served by the owned runtime
- Static CSS (`/point-ui.css`) ships from the runtime package

## Environment

| Variable | Effect |
|----------|--------|
| `POINT_INCREMENTAL=1` | Cache unchanged modules during dev rebuilds |
| `PORT` | Override listen port for route/serve servers |

## See also

- [Deploy](/point/toolchain/deploy) — production build and hosting
- [Build and emit](/point/toolchain/build-emit) — advanced emit targets
- [CLI reference](/point/reference/cli)
- [Routes](/point/language/routes)
