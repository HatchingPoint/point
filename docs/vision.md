# Point Vision — Authoring vs Runtime

**For users and agents.** Canonical public copy (synced to hatchingpoint.com/point):

- [Why Point exists](./site/concepts/why-point-exists.md)
- [Proof of concept](./site/concepts/proof-of-concept.md)
- [Point vs other languages for AI engineering](./ai/vs-other-languages.md)
- [Authoring vs runtime](./site/concepts/authoring-vs-runtime.md)

## One sentence

Point is a **general-purpose, AI-first language** you **write**; JavaScript and Python are what the **machine runs** — generated automatically, not authored by you.

## True vision (Phases 14–21)

Point should author **entire applications** — not only business logic fragments embedded in hand-written TypeScript and React.

| Layer | Today (v0.0.15) | Platform vision |
|-------|-------------------|-----------------|
| Logic (records, rules, calculations) | ✅ | ✅ |
| HTTP routes, CLI, workflows | ✅ Basic | Production depth + middleware |
| UI | ✅ Widgets/pages | Full multi-page apps |
| Realtime | ❌ | WebSockets, streaming processes |
| Data | ❌ | Any DB via `external` + `std.sql` (emit, not replace) |
| Agents | ✅ Repair Point source | Pipelines, sessions, prompts |
| Python | ⚠️ Partial | Full parity for automation |
| Dev experience | check/build/run | `point dev`, full-stack template |

**Master roadmap:** [platform-vision-plan.md](./platform-vision-plan.md)

## What we replace

Hand-written **TypeScript, React, Next.js glue, and Python** for product code:

- Data models, business rules, calculations, labels
- HTTP routes, middleware, WebSockets, CLI commands, workflows
- Multi-page UI, layouts, navigation, forms
- Database client usage (via `action` + `external` or `std.sql`)
- Agent pipelines and automation scripts
- Tests and checks on semantic source

## What stays outside Point

- **Xcode, Swift, iOS apps** — Point invokes native tools, does not replace them
- **Database engines** — PostgreSQL, SQLite, etc. — via `external` blocks and std shims, not reimplementation
- **npm ecosystem** — via `external` blocks and std shims, not reimplementation

## Daily workflow

```bash
point check
point fmt
point build
point run
point test
point dev          # Phase 20
```

You do **not** maintain `generated/*` in git or edit it by hand.

## Shipped through Phase 12 (v0.0.15)

| Milestone | Outcome |
|-----------|---------|
| JS-default run/build | ✅ |
| Python emit (logic + actions) | ✅ |
| Point-only npm packages | ✅ `@hatchingpoint/point-logic` |
| Richer views and `page` block | ✅ |
| `point add` + lockfile + npm: | ✅ |
| Std runtime shims | ✅ json, http, fs, env, time, text |
| LSP + Open VSX | ✅ |

**Active:** [platform-vision-plan.md](./platform-vision-plan.md) — Phases 14–21  
**Next execution:** [phase14-plan.md](./phase14-plan.md) + [codex-goal-phase14.md](./codex-goal-phase14.md)

## Self-hosting roadmap

The compiler stays in TypeScript today; compiler **policy** moves into Point incrementally. Each milestone is a `.point` module under `compiler/passes/` that runs through `point check`, `point test`, and CI like any other module.

| Milestone | Status | Location |
|-----------|--------|----------|
| Naming lint pass | ✅ Phase 21 | `compiler/passes/naming-lint.point` |
| Effect-boundary lint | 📋 Next | `compiler/passes/` |
| Formatter validation | 📋 Planned | `compiler/passes/` |
| Conformance fixtures in Point | 📋 Planned | `compiler/passes/` |
| Full formatter in Point | 📋 Long-term | after validation pass proves pattern |
| Parser / desugar in Point | 📋 Long-term | sustained milestones |

Details: [self-hosting.md](./self-hosting.md), pass guide: [compiler/passes/README.md](../compiler/passes/README.md).

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, `repair-plan`
- Prefer `point://semantic/` refs
- Do not expose core syntax in public files
- Do not add platform-specific keywords — keep features general-purpose

See [phase12-plan.md](./phase12-plan.md) for Phase 12 exit gate.
