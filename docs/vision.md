# Point Vision — Authoring vs Runtime

**For users and agents.** Canonical public copy (synced to hatchingpoint.com/point):

- [Point in 60 seconds](./site/guide/point-in-60-seconds.md)
- [Why Point exists](./site/concepts/why-point-exists.md)
- [Proof of concept](./site/concepts/proof-of-concept.md)
- [Point vs other languages for AI engineering](./ai/vs-other-languages.md)
- [Authoring vs runtime](./site/concepts/authoring-vs-runtime.md)
- [Product map](./product-map.md)

## One sentence

Point is a **general-purpose, AI-first language** you **write**; JavaScript and Python are what the **machine runs** — generated automatically, not authored by you.

## Platform status (v0.1.50)

Point authors application logic, HTTP, automation, and full-stack apps in one semantic source — with simple daily commands and an agent-native compiler.

| Layer | Status |
|-------|--------|
| Logic (records, rules, calculations) | ✅ Shipped |
| HTTP routes, middleware, CLI, workflows | ✅ Production depth |
| UI (views, pages, layouts, navigation) | ✅ Full-stack template (Vite/React host) |
| Realtime | ✅ Stream routes |
| Data | ✅ `std.sql`, `build-schema`, migrations |
| Agents | ✅ Pipelines, prompts, repair CI gate |
| Python | ✅ Logic, routes, workflows, pipelines (not UI/views) |
| Dev experience | ✅ `point dev`, `point create`, `capabilities`, `point box`, `point launch` |
| Cross-module imports | ✅ CLI + LSP + selective use merge |
| Built-in capabilities | ✅ `capabilities http json`, `point capabilities` |

**621 tests** in CI. **Master roadmap:** [phase-roadmap.md](./phase-roadmap.md)

## What you write vs what runs

You author **`.point`**. JavaScript is the default runtime (`point build`, `point run`, `point dev`). Full-stack apps compose with a Vite/React host for UI — Point generates routes, views, and glue. Python emit covers logic, routes, workflows, and pipelines; views and rich UI stay on JS/TS. Database engines, npm packages, and native SDKs integrate via `external`, `use`, and `point add` — Point does not replace them.

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
point box <file>
point launch <file> <command>
point dev
point capabilities
```

You do **not** maintain `generated/*` in git or edit it by hand.

## Agent workflow

The compiler is the agent's IDE:

```bash
point check-json
point repair-plan
point index
point explain point://semantic/...
```

34+ repair benchmark cases; CI gate at 100% sufficiency.

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
