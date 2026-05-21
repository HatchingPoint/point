# Point Vision — Authoring vs Runtime

**For users and agents.** Canonical public copy (synced to hatchingpoint.com/point):

- [Why Point exists](./site/concepts/why-point-exists.md)
- [Proof of concept](./site/concepts/proof-of-concept.md)
- [Point vs other languages for AI engineering](./site/ai/vs-other-languages.md)
- [Authoring vs runtime](./site/concepts/authoring-vs-runtime.md)

## One sentence

Point is a general-purpose language you **write**; TypeScript, JavaScript, and Python are what the **machine runs** — generated automatically, not authored by you.

## What we replace today

You replace **hand-written application logic** in TypeScript and Python:

- Data models, business rules, calculations, labels
- HTTP routes, CLI commands, workflows, side effects
- Tests and checks on semantic source
- Interactive views and pages (emit React; host in Next.js or similar)

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
- **React/Next.js** imports generated view and page components (today)
- **npm packages** called via `external` blocks and `@hatchingpoint/point/std/*` shims
- **Docs site chrome** (sidebar, markdown routing) may stay in Next.js; content syncs from `docs/site/`

## Shipped through Phase 11 (v0.0.13)

| Milestone | Outcome |
|-----------|---------|
| JS-default run/build | ✅ |
| Python emit (logic + actions, `build-py-all`) | ✅ |
| Point-only npm packages | ✅ `@hatchingpoint/point-logic` |
| Richer views and `page` block | ✅ Controlled inputs, `Handler` callbacks |
| `point add` + lockfile | ✅ `workspace:` and `file:` |
| Std runtime shims | ✅ json, http (more in Phase 12) |

**Active:** [phase12-plan.md](./phase12-plan.md) — `npm:` deps, full std shims, starter template, Open VSX.

Scope table: [replaces-typescript-and-python.md](./site/concepts/replaces-typescript-and-python.md).

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, `repair-plan`
- Prefer `point://semantic/` refs
- Do not expose core syntax in public files

See [phase10-plan.md](./phase10-plan.md) and [phase11-plan.md](./phase11-plan.md) for completed exit gates.
