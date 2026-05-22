# {{APP_NAME}}

A Point full-stack admin app scaffolded with `point create`.

Everything lives in `.point` source — layout, navigation, pages, views, and actions. No hand-written TypeScript required for product logic.

## Quick start

```bash
point check src/app.point
point run src/app.point
npm run build
```

Expected `point run` output:

```text
Admin app navigation ready
```

## Project layout

```text
{{APP_NAME}}/
  point.json
  package.json
  src/
    app.point
  generated/          # created by point build (gitignored)
```

## What's inside

- **layout** `admin shell` — sidebar + main slots
- **navigation** — `/settings`, `/members`, `/members/:id`
- **pages** — settings (form + tabs + modal), members list, member detail
- **action** `fetch members` — sample data (swap for your API)
- **command** `admin demo` — CLI smoke test for `point run`

## Next steps

1. Edit `src/app.point` — add rules, routes, pages, pipelines
2. Run `point check-json src/app.point` for agent-friendly diagnostics
3. Wire a database with `std.sql` or `external` drivers — see [Database interop](https://hatchingpoint.com/point/ecosystem/database-interop)
4. Emit TypeScript for a React host: `point build-ts src/app.point generated/app.ts`

## Docs

- [Quick start](https://hatchingpoint.com/point/guide/quick-start)
- [Language overview](https://hatchingpoint.com/point/language/overview)
- [Agent coding loop](https://hatchingpoint.com/point/ai/agent-coding-loop)
