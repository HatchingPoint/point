# Point Adoption Pilot Postmortem

This document records the first end-to-end adoption exercise for Point as a general-purpose semantic language. It substitutes for external-team adoption until marketplace publish credentials are available.

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
| Lowering pipeline | String semantic → core → TS remained stable through Phases 0–5 |
| Agent tooling | Semantic refs, check-json, repair-plan improved fix loops |
| Runtime | `point run` and `point test` made the language feel executable |
| Stdlib | `use std.*` reduced repeated externals |
| CI | Single `bun run ci` gate caught regressions across 25+ fixtures |

## What broke or blocked

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Publish credentials missing | Phase 6.2 npm/marketplace publish blocked | Documented; pipeline scaffold runs credential check |
| String-based lowering | Harder long-term maintenance | Phase 7 AST plan prepared |
| Statement-level source maps | Runtime errors map to declarations, not expressions | Documented in performance/runtime docs |
| Codex quota limits | Long goals stop mid-phase | Phase-scoped goals + Cursor fallback |
| External adoption proof | No outside contributor yet | This pilot + template for first external feature |

## First external adopter checklist

When someone outside the core team ships a feature in Point:

1. Add their module under `examples/adopters/<team>/`
2. Document run/build steps in a local README
3. Add fixture to conformance suite
4. Record postmortem notes in this file
5. Capture agent prompts that worked

## Recommendation

Point is ready for **internal/full-stack pilot projects** transpiling to TypeScript on Bun. It is **not yet ready** for public marketplace distribution until publish credentials land and Phase 7 compiler modernization completes.

## Next steps

1. Finish Phase 6 publish when `NPM_TOKEN` / `VSCE_PAT` exist
2. Execute Phase 7 AST modernization
3. Recruit one external team to port a small service module to `.point`
