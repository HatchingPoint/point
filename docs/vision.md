# Point Vision — Authoring vs Runtime

**For users and agents.** Canonical public copy: [docs/site/concepts/authoring-vs-runtime.md](./site/concepts/authoring-vs-runtime.md) (synced to hatchingpoint.com/point).

## One sentence

Point is a general-purpose language you **write**; TypeScript, JavaScript, and Python are what the **machine runs** — generated automatically, not authored by you.

## What we replace today

You replace **hand-written application logic** in TypeScript and Python:

- Data models, business rules, calculations, labels
- HTTP routes, CLI commands, workflows, side effects
- Tests and checks on semantic source

You run:

```bash
point check
point fmt
point build
point run
point test
```

You do **not** maintain `generated/*.ts` in git or edit it by hand. `point build` emits JavaScript by default; `point build-ts` and `point build-py` are opt-in targets.

## What still interops

- **Bun/Node** runs emitted JavaScript (today)
- **React/Next.js** imports generated view components (today)
- **npm packages** called via `external` blocks
- **Docs site chrome** (sidebar, markdown) may stay in Next.js until Point grows layout blocks

## What we're building toward (Phase 9+)

| Milestone | Outcome |
|-----------|---------|
| JS-default run/build | ✅ Authors use `point build` / `point run` without managing TypeScript |
| Python emit (pure logic) | ✅ `point build-py` for services/scripts (records, rules, calculations) |
| Point-only npm packages | 🎯 Publish libraries without TS source |
| Richer views | 🎯 More UI without raw React |
| Long-term | Optional standalone runtime |

Scope table: [replaces-typescript-and-python.md](./site/concepts/replaces-typescript-and-python.md).

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, `repair-plan`
- Prefer `point://semantic/` refs
- Do not expose core syntax in public files

See [phase9-replacement-plan.md](./phase9-replacement-plan.md) for execution checkboxes.
