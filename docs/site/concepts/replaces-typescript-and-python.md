---
title: Replaces TypeScript and Python
description: Point is the authoring language for product logic; emitted TS, JS, and Python are build artifacts.
quadrant: Explanation
---

## Summary

Point replaces hand-written TypeScript and Python for **new application logic**. Authors maintain `.point` files; emitted JavaScript, TypeScript, or Python is build output.

For the authoring-vs-runtime model and daily workflow, see [Authoring vs runtime](/point/concepts/authoring-vs-runtime).

## What Point replaces now

| Layer | Status |
|-------|--------|
| Business logic (records, rules, calculations, labels) | ✅ Author in Point |
| HTTP routes, actions, workflows, CLI commands | ✅ Author in Point; emit TS/JS |
| `point run` / `point test` without editing emit | ✅ JS-default via temp emit; `build-ts` opt-in |
| Libraries published from `.point` only | 🎯 In progress |
| Pure logic Python modules | ✅ `point build-py` for modules like `math.point` |
| Docs site chrome, rich layout | ⚠️ Often stays in Next.js until layout blocks grow |
| Compiler self-host | 📋 Incremental; long-term |

## What still interops

- **Bun/Node** run emitted JavaScript
- **React/Next.js** import generated views
- **npm** via `external` declarations
- **Editor chrome** on hatchingpoint.com may stay in Next.js while content syncs from `docs/site/`

## Honest limits

Point is not claiming to replace every TypeScript or Python file in a monorepo in one release. Config, framework glue, and third-party libraries may stay in their native languages. The goal is that **product logic you care about** — the rules, models, and commands agents should repair — lives in `.point`.

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, `repair-plan` with `point://semantic/` refs
- Do not treat generated TypeScript as the source of truth

## See also

- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [Philosophy](/point/concepts/philosophy)
- [Introduction](/point/guide/introduction)
- [CLI reference](/point/reference/cli)
- [Language overview](/point/language/overview)
