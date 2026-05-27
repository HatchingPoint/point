# {{APP_NAME}}

Point app scaffold for **Vercel** — UI + API entirely in `src/app.point`.

> Deprecation note: `vercel-app` is a legacy emit + Vite/Vercel compatibility template. New apps should use the default `runtime-app` template, or `runtime-saas-app` for runtime-owned auth and SQLite.

## Quick start

```bash
bun install
bun run check
bun run dev
```

Open http://localhost:5173 — UI on Vite, API on http://localhost:3456.

## Deploy

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Defaults from `vercel.json`: `bun install`, `bun run build`, output `dist`

## What's included

| Piece | Source |
|-------|--------|
| Theme tokens | `theme app theme` in `src/app.point` |
| Pages + nav | Point views, layout, navigation |
| `/api/health`, `/api/tasks` | Point routes |
| Vercel Edge API | `api/[[...path]].ts` |
| UI kit | `@hatchingpoint/point/ui/point-ui.css` |

Built with `point build-app` — emits `generated/app.tsx` for Vite and `generated/app.js` for API routes.
