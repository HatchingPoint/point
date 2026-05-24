# Point Vision — Authoring vs Runtime

**For users and agents.** Canonical public copy (synced to hatchingpoint.com/point):

- [Why Point exists](./site/concepts/why-point-exists.md)
- [Proof of concept](./site/concepts/proof-of-concept.md)
- [Point vs other languages for AI engineering](./ai/vs-other-languages.md)
- [Authoring vs runtime](./site/concepts/authoring-vs-runtime.md)
- [Product map](./product-map.md)

## One sentence

Point is a **general-purpose, AI-first language** you **write**; JavaScript and Python are what the **machine runs** — generated automatically, not authored by you.

## Platform status (v0.1.28)

Point authors **entire applications** — logic, routes, pages, pipelines, and commands in one semantic source.

| Layer | Status |
|-------|--------|
| Logic (records, rules, calculations) | ✅ Shipped |
| HTTP routes, middleware, CLI, workflows | ✅ Production depth |
| UI (views, pages, layouts, navigation) | ✅ Full-stack template |
| Realtime | ✅ Stream routes |
| Data | ✅ `std.sql`, `build-schema`, migrations |
| Agents | ✅ Pipelines, prompts, repair CI gate |
| Python | ✅ Logic, routes, workflows, pipelines |
| Dev experience | ✅ `point dev`, `point create`, capabilities shorthand |
| Cross-module imports | ✅ CLI + LSP |
| Built-in capabilities | ✅ `use http` → `std.http`, `point capabilities` |

**591 tests** in CI. **Master roadmap:** [phase-roadmap.md](./phase-roadmap.md)

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
- **Database engines** — PostgreSQL, SQLite, etc. — via `external` blocks and std shims
- **npm ecosystem** — via `external` blocks, built-in capabilities, and `point add`

## Daily workflow

```bash
point check
point fmt
point build
point run
point test
point dev
point capabilities   # list built-in std modules
```

You do **not** maintain `generated/*` in git or edit it by hand.

## Self-hosting roadmap

The compiler stays in TypeScript today; compiler **policy** moves into Point incrementally. Each milestone is a `.point` module under `compiler/passes/` that runs through `point check`, `point test`, and CI like any other module.

| Milestone | Status | Location |
|-----------|--------|----------|
| Diagnostic catalog | ✅ | `compiler/passes/diagnostic-catalog.point` |
| More passes | Planned | `compiler/passes/` |

## See also

- [Platform vision plan](./platform-vision-plan.md)
- [Phase roadmap](./phase-roadmap.md)
- [Language primitive audit](./language-primitive-audit.md)
