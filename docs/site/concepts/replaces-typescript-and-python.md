---
title: Replaces TypeScript and Python
description: Point is the authoring language for application logic; emitted TS, JS, and Python are build artifacts.
quadrant: Explanation
---

## Summary

**Evaluation page** — when comparing Point to other stacks. For daily docs, start with [Point in 60 seconds](/point/guide/point-in-60-seconds) and [How Point runs](/point/concepts/how-point-runs).

Point is the language for **new application logic** you want checked in one place. Authors maintain `.point` files; optional build commands produce host modules when needed.

## What Point replaces now (v0.2.6)

| Layer | Status |
|-------|--------|
| Business logic (records, rules, calculations, labels, variants) | ✅ Author in Point |
| HTTP routes, middleware, WebSockets, SSE, actions, workflows, CLI | ✅ Author in Point; owned runtime or emit |
| Multi-page UI (layout, navigation, forms, tabs, modals) | ✅ Author in Point; **owned runtime SSR by default** |
| Live UI (refresh, SSE, terminal streams) | ✅ Owned runtime client + server (default apps) |
| Database access | ✅ `action` + `external` or `std.sql` — any driver |
| Agent pipelines, sessions, prompts | ✅ Author in Point |
| `point run` / `point test` / `point dev` / `point serve` | ✅ Owned runtime for default apps |
| Python automation scripts | ✅ `point build-py` for routes, workflows, commands, stdlib |
| Libraries published from `.point` only | ✅ `@hatchingpoint/point-logic` on npm |
| Interactive views and pages | ✅ `view`, `page`, controlled checkboxes, `Handler` callbacks |
| Docs site chrome, rich layout | ⚠️ Often stays in Next.js while content syncs from `docs/site/` |
| Xcode, Swift, iOS native tooling | ❌ Outside Point — invoke via externals/commands |
| Compiler self-host | 📋 Incremental; naming lint pass shipped |

## What still interops

- **Bun/Node** run emitted JavaScript
- **React/Next.js** import generated views and pages
- **npm** via `external` declarations
- **PostgreSQL, SQLite, etc.** via driver npm packages or `std.sql`
- **Editor chrome** on hatchingpoint.com may stay in Next.js while content syncs from `docs/site/`

## Honest limits

Point is not claiming to replace every TypeScript or Python file in a monorepo in one release. Config, framework glue, and third-party libraries may stay in their native languages. Client bundler setup for production React still flows through your frontend toolchain. The goal is that **application logic you care about** — the rules, models, routes, and commands agents should repair — lives in `.point`.

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, `repair-plan` with `point://semantic/` refs
- Do not treat generated TypeScript as the source of truth

## See also

- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [Platform vision](/point/concepts/platform-vision)
- [Database interop](/point/ecosystem/database-interop)
- [Philosophy](/point/concepts/philosophy)
- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Golden app demo](/point/guide/golden-app-demo)
- [CLI reference](/point/reference/cli)
- [Language overview](/point/language/overview)
