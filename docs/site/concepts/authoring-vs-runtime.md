---
title: Authoring vs runtime
description: Point is the language you write; TypeScript, JavaScript, and Python are what the machine runs — generated automatically, not authored by you.
quadrant: Explanation
---

## Summary

Point is a general-purpose language you **write**. TypeScript, JavaScript, and (for pure logic) Python are what the **machine runs** — build artifacts the compiler emits, not source you maintain.

Authors work in `.point` files. Generated targets are like `.js` from `.ts` today, except Point is the source of truth.

## The split

| Layer | Who owns it | What it is |
|-------|-------------|------------|
| **Authoring** | You and coding agents | Semantic `.point` blocks — records, rules, calculations, actions, views, routes, pipelines, commands |
| **Compiler IR** | Point toolchain | Typed core representation in memory — never edited by authors |
| **Runtime targets** | Build output | Emitted JavaScript, TypeScript, or Python — checked into `generated/` only as artifacts, not hand-edited |

Daily workflow stays on the authoring layer:

```bash
point check
point fmt
point build
point run
point test
point dev          # watch, check, emit, reload (v0.1.0)
```

You do **not** fix product behavior by patching `generated/*.ts` or `generated/*.js`. If emit is wrong, repair `.point` and rebuild.

## How source becomes runnable code

```text
.point (author) → semantic AST → core IR → check → emit → JS | TS | PY (targets)
```

The compiler parses semantic blocks, lowers them to a typed core IR, checks types and effects, then emits a target language. Authors never write core IR syntax (`fn`, `let`, `type`, and similar forms stay internal).

| Target | When it is used |
|--------|-----------------|
| **JavaScript** | Default for `point build`, `point run`, and `point test` — authors do not need TypeScript on the daily path |
| **TypeScript** | Opt-in via `point build-ts` when a surrounding stack wants `.ts` files (React views, layouts, pages) |
| **Python** | `point build-py` for logic, actions, routes, workflows, and commands — views and realtime client code remain JS/TS |

Bun or Node still executes emitted JavaScript. React and Next.js can import generated view components. npm packages and database drivers remain available through `external` blocks. That is **interop**, not a second authoring language.

## What emit being invisible means

**Invisible** does not mean emit does not exist. It means authors and agents should not think about target syntax when changing product logic:

- `point run` checks semantic source and runs via temp JavaScript — no author-managed `.ts` step
- `point build` writes JavaScript by default; TypeScript is explicit
- Diagnostics, explain, index, and repair-plan refer to `.point` locations and `point://semantic/` refs
- CI can validate docs snippets with `point check-docs` so public examples stay parseable

Framework glue, config files, and third-party libraries may stay in TypeScript or Python. The goal is that **product logic you care about** — models, rules, commands, and boundaries agents should repair — lives in `.point`.

## Platform milestones (v0.1.0)

| Milestone | Outcome |
|-----------|---------|
| JS-default run/build | ✅ Authors use `point build` and `point run` without managing TypeScript |
| Python emit | ✅ `point build-py` / `build-py-all` for automation parity |
| Point-only npm packages | ✅ `@hatchingpoint/point-logic` — `.point` in `src/`, JS in `dist/` |
| Multi-page apps | ✅ `layout`, `navigation`, data loading, rich views |
| Realtime & jobs | ✅ `stream route`, `schedule`, workflow retry/timeout |
| Database interop | ✅ Any DB via `action` + `external` or `std.sql` |
| Agent orchestration | ✅ `pipeline`, `session`, `prompt`, `guard` |
| Dev platform | ✅ `point dev`, `point app new`, full-stack template |
| Long-term | Optional standalone runtime — not required for adoption today |

See [Platform vision](/point/concepts/platform-vision) and [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python) for scope tables.

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, and `repair-plan` with `point://semantic/` refs
- Do not treat generated TypeScript or JavaScript as the source of truth
- Do not expose core IR syntax in public `.point` files

## See also

- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
- [Platform vision](/point/concepts/platform-vision)
- [Philosophy](/point/concepts/philosophy)
- [Introduction](/point/guide/introduction)
- [CLI reference](/point/reference/cli)
