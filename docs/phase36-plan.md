# Phase 36 — Product packaging + built-in capabilities

**Status:** Complete — v0.1.28  
**Prerequisite:** Phase 35 complete (v0.1.27)  
**North star:** Make Point marketable on first read — straight syntax for std modules, synced public docs, and a capabilities catalog agents and humans can discover.

---

## Why now

| Gap | Evidence | Track |
|-----|----------|-------|
| GitHub README stale | Says Phases 0–12, 339 tests, JS-only | **A** |
| No fluid std import story | Authors write `use std.http`; verbose vs brand | **B** |
| Docs/version drift | Site changelog 0.1.24; CLI ref 0.1.14 | **C** |
| Releases lag tags | GitHub latest v0.0.5; local v0.1.27 | **D** |

---

## Success criteria (Phase 36 exit gate)

- [x] **P36-1 README + product map** — root README hero, five block families, install, CLI groups, link to docs site
- [x] **P36-2 Built-in capabilities** — `use http` shorthand → `std.http`; `point capabilities` JSON catalog; tests
- [x] **P36-3 Docs sync** — vision.md, cli.md, site changelog, capabilities reference page, modules.md
- [x] **P36-4 GitHub releases** — script + notes for v0.1.21–v0.1.28; push tags when remote ready
- [x] `bun run ci` passes; patch release **v0.1.28**

---

## Non-goals

- New semantic block types (`capability` block in grammar)
- Generic `Result<T,E>` or `Decimal` primitive
- Renaming existing blocks

---

## File ownership (parallel burst)

| Track | Owns | Do not touch |
|-------|------|--------------|
| **A — README** | `README.md`, `docs/product-map.md`, `packages/point/README.md` | `packages/point/src/semantic/*` |
| **B — Capabilities** | `packages/point/src/core/capabilities.ts`, `cli.ts`, `semantic/parse.ts`, `examples/capabilities-demo.point`, `tests/capabilities.test.ts` | README prose |
| **C — Docs sync** | `docs/vision.md`, `docs/site/reference/cli.md`, `docs/site/changelog.md`, `docs/site/language/capabilities.md`, `docs/site/language/modules.md`, `docs/site/stdlib/overview.md`, `docs/site/guide/introduction.md` | capabilities.ts |
| **D — Releases** | `scripts/publish-github-releases.sh`, release note fragments in CHANGELOG | language core |

**Integrator:** CHANGELOG v0.1.28, version bump, `phase36-plan.md`, `phase-roadmap.md`, `codex-goal-phase36.md`, `codex-progress.md`.

---

## Capability syntax (shipped design)

```point
use http
use json
use time
```

Equivalent to `use std.http`, `use std.json`, `use std.time`. Local modules stay explicit:

```point
use Billing from "./billing.point"
```

Run `point capabilities` to list built-ins with one-line summaries.
