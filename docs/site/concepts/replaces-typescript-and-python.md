---
title: Replaces TypeScript and Python
description: Point is the authoring language for product logic; emitted TS, JS, and Python are build artifacts.
quadrant: Explanation
---

## Summary

Point replaces hand-written TypeScript and Python for **new application logic**. Authors maintain `.point` files; emitted JavaScript, TypeScript, or Python is build output.

For the authoring-vs-runtime model and daily workflow, see [Authoring vs runtime](/point/concepts/authoring-vs-runtime).

## What Point replaces now (v0.1.0)

| Layer | Status |
|-------|--------|
| Business logic (records, rules, calculations, labels, variants) | ✅ Author in Point |
| HTTP routes, middleware, WebSockets, actions, workflows, CLI | ✅ Author in Point; emit TS/JS |
| Multi-page UI (layout, navigation, forms, tabs, modals) | ✅ Author in Point; emit TSX |
| Database access | ✅ `action` + `external` or `std.sql` — any driver |
| Agent pipelines, sessions, prompts | ✅ Author in Point |
| `point run` / `point test` without editing emit | ✅ JS-default via temp emit; `build-ts` opt-in |
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

Point is not claiming to replace every TypeScript or Python file in a monorepo in one release. Config, framework glue, and third-party libraries may stay in their native languages. Client bundler setup for production React still flows through your frontend toolchain. The goal is that **product logic you care about** — the rules, models, routes, and commands agents should repair — lives in `.point`.

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, `repair-plan` with `point://semantic/` refs
- Do not treat generated TypeScript as the source of truth

## See also

- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [Platform vision](/point/concepts/platform-vision)
- [Database interop](/point/ecosystem/database-interop)
- [Philosophy](/point/concepts/philosophy)
- [Introduction](/point/guide/introduction)
- [CLI reference](/point/reference/cli)
- [Language overview](/point/language/overview)
