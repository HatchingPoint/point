# Phase 37 — Selective use merge, domain outcomes, template polish

**Status:** Complete — v0.1.29  
**Prerequisite:** Phase 36 complete (v0.1.28)  
**North star:** Imports stay tight — only symbols you reference; outcomes are obvious; new apps demo capabilities.

---

## Why now

| Gap | Evidence | Track |
|-----|----------|-------|
| Whole-module merge | `use time` pulled every std/time calculation | **A** |
| Result pattern buried | Audit says variant-first; one types.md paragraph | **B** |
| Template doesn't demo capabilities | full-stack-app has no `use http` / capabilities mention | **C** |

---

## Success criteria (Phase 37 exit gate)

- [x] **P37-1 Selective use merge** — merge only declarations referenced in importer source (+ type/external closure)
- [x] **P37-2 Domain outcomes guide** — `docs/site/language/domain-outcomes.md`, link from types.md + introduction
- [x] **P37-3 Template capabilities** — full-stack template README + example tools note; sync template
- [x] `bun run ci` passes; patch release **v0.1.29**

---

## File ownership (parallel burst)

| Track | Owns | Do not touch |
|-------|------|--------------|
| **A — Use merge** | `use-merge.ts`, `parser.ts`, `cli.ts`, `tests/use-merge.test.ts` | docs |
| **B — Outcomes docs** | `docs/site/language/domain-outcomes.md`, types.md, introduction.md | use-merge.ts |
| **C — Template** | `examples/full-stack-template/README.md`, template README, `sync-app-template` output | parser |

**Integrator:** CHANGELOG, version bump, roadmap, commit, tag v0.1.29.
