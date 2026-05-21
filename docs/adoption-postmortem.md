# Point Adoption Pilot Postmortem

This document records adoption exercises for Point as a general-purpose semantic language.

## Pilot scope

**Artifact:** `examples/app/todo.point`

**What it proves:**

- Multi-block app in pure Point (`record`, `view`, `action`, `workflow`, `route`, `command`)
- Standard library import (`use std.http`)
- Generated TypeScript as build output only
- `point check`, `point build-ts`, and `point run` on a non-trivial module

## What worked

| Area | Result |
|------|--------|
| Semantic authoring | Agents and Codex could extend language features without exposing core syntax |
| AST pipeline (Phase 7) | Semantic parse → desugar → core AST → TS emit stable across 26+ fixtures |
| Agent tooling | Semantic refs, check-json, repair-plan improved fix loops |
| Runtime | `point run` and `point test` made the language feel executable |
| Stdlib | `use std.*` reduced repeated externals |
| CI | Single `bun run ci` gate caught regressions (78 tests) |
| Distribution | npm `@hatchingpoint/point@0.0.9`, Marketplace `hatchingpoint.point@0.0.9`, automated publish on tag |

## What broke or blocked (historical)

| Issue | Impact | Status |
|-------|--------|--------|
| Publish credentials / PAT format | Blocked automated Marketplace publish | **Resolved** — secrets fixed, 0.0.9 live |
| String-based lowering | Harder long-term maintenance | **Resolved** — Phase 7 AST pipeline |
| Statement-level source maps | Runtime errors map to declarations, not expressions | Open — Phase 8.5 optional |
| External adoption proof | No outside contributor yet | **Pilot:** `examples/adopters/starter-labs/` — external-style README + module |
| Codex quota limits | Long goals stop mid-phase | Mitigated — phase-scoped goals |

## Adopter modules

| Team | Path | Role |
|------|------|------|
| Hatching Point (dogfood) | `examples/adopters/hatchingpoint/store-readiness.point` | App Store listing readiness |
| Starter Labs (external example) | `examples/adopters/starter-labs/subscription-tier.point` | SaaS pricing — global CLI + LSP only |

## First external adopter checklist

When someone outside the core team ships a feature in Point:

1. Add their module under `examples/adopters/<team>/`
2. Document run/build steps in a local README
3. Add fixture to conformance suite
4. Record postmortem notes in this file
5. Capture agent prompts that worked

## Recommendation

Point is ready for **pilot projects** transpiling to TypeScript on Bun, with global install and Marketplace extension. Public distribution infrastructure is live.

**Next:** docs site (D1–D5), recruit a real external team to replace the Starter Labs example. See [phase8-plan.md](./phase8-plan.md).
