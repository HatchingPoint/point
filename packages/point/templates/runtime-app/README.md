# {{APP_NAME}}

Point **runtime-native** app — authors write only `.point` files. Execution, HTTP, and SSR run through `@hatchingpoint/point/runtime` (no Vite, React, or emit fallbacks).

## Commands

```bash
bun install
bun run check
bun run dev
```

Open the URL printed by `point dev` — SSR readiness UI, JSON at `/readiness`, and navigation at `/readiness-ui`.

```bash
bun run test
bun run serve
point run src/app.point smoke
```

## Layout

| Path | Purpose |
|------|---------|
| `src/app.point` | Rules, routes, views, pages |
| `tests/score.test.point` | Point-only tests |
| `point.json` | Manifest (`runtime: "owned"`) |

Legacy full-stack templates remain available: `point create my-app --template full-stack-app`.
