# {{APP_NAME}}

A Point-native full-stack admin app — UI, API, and product logic in `.point` source.

## Quick start

```bash
bun install
bun run check
bun run dev
```

Open a `.point` file — **VS Code / Cursor** will recommend the Point Language extension. **Neovim / Zed / other LSP editors:** see `.point/editor.json`.

Open **http://localhost:5173** for the React UI. The Bun API listens on **http://localhost:3456** (`/api/health`, `/api/members`).

## Discover and launch

```bash
point box src/app.point
point launch src/app.point admin demo
```

One screen for capabilities and commands. Copy the launch line from `point box`.

## Scripts

| Script | What it does |
|--------|----------------|
| `dev` | Vite UI + Bun API with hot reload |
| `dev:api` | API only (no Vite) |
| `build` | Emit Point → `generated/`, then Vite → `dist/` |
| `serve` | Production: static `dist/` + API on one port |
| `preview` | Build then serve |

## Project layout

```text
{{APP_NAME}}/
  src/app.point       # layout, pages, views, routes, actions
  web/                # Vite host (main.tsx mounts generated UI)
  generated/          # point build output (gitignored)
  dist/               # vite production bundle (gitignored)
```

## What's already wired

This template is more than hello world — ready on day one:

- **theme** — accent, density, radius tokens
- **layout + navigation** — `/settings`, `/members`, `/members/:id`
- **routes** — `GET /api/health`, `GET /api/members`
- **pages** — settings form, members list with HTTP data load, member detail
- **views** — forms, tabs, modals, conditional render branches
- **command** `admin demo` — CLI smoke test (`point launch src/app.point admin demo`)

You write `.point`. The Vite/React host runs the UI; Point generates routes, views, and glue.

## Built-in capabilities

Import std modules in one line in `src/app.point`:

```point
capabilities http json
```

Run `point capabilities` for the full catalog. See [Capabilities](https://hatchingpoint.com/point/language/capabilities).

## Agent loop

```bash
point check-json src/app.point
point repair-plan src/app.point
```

The compiler is the agent's IDE — stable refs, not line-number guessing.

## Next steps

1. Edit `src/app.point` — add rules, DB actions, more routes
2. Add `capabilities sql crypto` when you need data or auth helpers
3. Deploy: `bun run build` then `bun run serve` on any Bun host (Render, Railway, Fly, a VPS). No Docker required.

Optional: use `render.yaml` in the project root for one-click Render setup.

## Deploy (Render and similar)

On a **Web Service** with Bun:

| Setting | Value |
|---------|--------|
| Build command | `bun install && bun run build` |
| Start command | `bun run serve` |

The platform sets `PORT`; `point serve` picks it up automatically.

## Docs

- [Point in 60 seconds](https://hatchingpoint.com/point/guide/point-in-60-seconds)
- [Five-minute tour](https://hatchingpoint.com/point/guide/five-minute-tour)
- [Deploy Path B](https://hatchingpoint.com/point/toolchain/deploy)
