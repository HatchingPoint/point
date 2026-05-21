---
title: Replaces TypeScript and Python
description: Point is the authoring language for product logic; emitted TS, JS, and Python are build artifacts.
quadrant: Explanation
---

## Summary

Point replaces hand-written TypeScript and Python for **new application logic**. Authors maintain `.point` files. Generated TypeScript, JavaScript, or Python is a build artifact — like `.js` from `.ts` today, except Point is the source of truth.

## What you write

Authors write semantic blocks in `.point` files:

- Records, calculations, rules, labels for data and business logic
- Actions, policies, externals, and workflows for effects and orchestration
- Views, routes, and commands for application boundaries

You run `point check`, `point fmt`, `point build-ts` or `point build-js`, `point run`, and `point test` against source you own. You do **not** commit hand-edited `generated/*.ts` or patch emit output to fix product behavior.

## What the machine runs

The compiler lowers semantic source to a typed core IR in memory, checks it, and emits targets:

| Target | Role today |
|--------|------------|
| TypeScript | Primary emit for existing Bun, Node, React, Hono stacks |
| JavaScript | Direct emit when you want JS without type syntax |
| Python | Pure-logic modules (roadmap; see phase 9 plan) |

Bun or Node still executes emitted JavaScript. React and Next.js can import generated view components. npm packages remain available through `external` blocks. That is interop, not a second authoring language.

## What Point replaces now

| Layer | Status |
|-------|--------|
| Business logic (records, rules, calculations, labels) | ✅ Author in Point |
| HTTP routes, actions, workflows, CLI commands | ✅ Author in Point; emit TS/JS |
| `point run` / `point test` without editing emit | ✅ Today uses temp TS; JS-default path in progress |
| Libraries published from `.point` only | 🎯 In progress |
| Pure logic Python modules | 🎯 Python emit for modules like `math.point` |
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

- [Philosophy](/point/concepts/philosophy)
- [Introduction](/point/guide/introduction)
- [CLI reference](/point/reference/cli)
- [Language overview](/point/language/overview)
