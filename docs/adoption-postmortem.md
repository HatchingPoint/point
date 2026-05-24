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

---

## V2 — Full-stack template pilot (Phase 21)

**Date:** 2026-05-21  
**Artifact:** `examples/full-stack-template/` (`src/app.point`, `point.json`, README)  
**Pilot method:** Internal dogfood simulating external onboarding — scaffold with `point app new`, run check/build/run against the template graph, validate in CI (`tests/app-new-cli.test.ts`, `tests/point-core.test.ts`, semantic emit fixtures). **360 tests** pass in CI.

**Related:** [phase21-plan.md](./phase21-plan.md) P21-5, [phase20-plan.md](./phase20-plan.md) P20-2, template README at `examples/full-stack-template/README.md`.

### What it proves

- End-to-end **SaaS admin shell** in pure Point: `layout`, `navigation`, three `page` blocks, rich `view` controls, client `load data from action`, CLI `command`
- **`point app new`** copies the template, substitutes app name in `point.json`/README, and leaves `src/app.point` ready to check and build
- **`point dev`** available for route/API modules (watch, incremental check/emit, server reload); template smoke via `point run` on `command admin demo`
- **Dashboard block family** (Phase 15) exercised at template scale — not a one-off demo file
- Generated TypeScript is build output only; authors do not hand-edit `generated/` for normal use

### What worked (v2)

| Area | Result |
|------|--------|
| **`point app new`** | Scaffolds from `examples/full-stack-template/`; rejects invalid names and non-empty targets; toolkit root discovery works from repo or global `@hatchingpoint/point` |
| **`point check` / `point build-ts` / `point run`** | Template passes check; emits React Router + layout slots; `admin demo` command prints expected smoke string |
| **`point dev`** | File watcher, incremental cache, route server reload — proven on API fixtures; usable once a scaffolded app adds `route` blocks |
| **Layout + navigation** | `layout admin shell` (sidebar + main), `navigation admin app` with path params (`/members/:id` → page `input id`) |
| **Rich views** | Settings: `form`, `tabs`, `modal`; members list: `load data from action fetch members`, `when loading/error/empty`, `each` + links; member detail: modal + param-driven render |
| **Data loading** | `action fetch members` with `touches none` + `calculation sample members` — swap calculation for real API or database action |
| **Agent loop** | Semantic refs for layout/navigation/view blocks; `check-json` diagnostics on template graph |
| **CI** | Template in module graph; `bun test` — **360 pass**; conformance map cites template as largest multi-page fixture |

### Blockers and gaps (v2)

| Issue | Impact | Status |
|-------|--------|--------|
| **No real external team yet** | v2 pilot is internal dogfood only; Starter Labs example still synthetic | **Open** — recruit team to run checklist below |
| **Template has no `route` blocks** | `point dev` hot-reload story is documented for APIs; scaffolded SaaS apps need explicit routes or a follow-on template variant | **Open** — add optional `route` + dev section to template README |
| **No database wired yet** | Template uses in-process `action` only | **By design** — add `std.sql` or `external` driver when backend chosen |
| **Client host toolchain** | `build-ts` output still flows through React Router + frontend bundler (Bun/Vite/Vercel) | **Expected** — boring emit, not zero-config single binary for UI |
| **Deploy is docs spike** | `point deploy` / production paths documented; no one-click multi-cloud upload | **Open** — Phase 20 P20-5 spike; teams wire `point build --production` themselves |
| **Statement-level source maps** | Runtime errors map to declarations, not expressions | **Open** — same as v1 |
| **Hosted Point package index** | `point add` uses npm/workspace/file; no curated registry service | **Open** — Phase 20 P20-4 |
| **Global toolkit path** | `point create` ships templates inside `@hatchingpoint/point` npm package | **Fixed in v0.1.1+** — `templates/full-stack-app/` bundled; `point app new` alias kept |

### External team checklist (v2)

When a team outside core Point ships on the full-stack template:

1. **Scaffold:** `point create <name>` (or legacy `point app new`; or clone `examples/full-stack-template/`)
2. **Install:** `bun install -g @hatchingpoint/point` (or use monorepo `bun packages/point/src/cli.ts`)
3. **Verify:** `point check src/app.point` → `point build-ts src/app.point generated/app.ts` → `point run src/app.point`
4. **Customize:** Replace `calculation sample members` / `action fetch members` with your API; add `route` blocks if you need `point dev` on HTTP
5. **Optional backend:** `std.sql`, `external` + driver, or `std.http` via `external` — not required for first UI pilot
6. **Add module:** `point add <name> <spec>` for shared Point packages; npm deps still in `package.json` for `external` blocks
7. **Contribute back:** Add `examples/adopters/<team>/` + README; extend conformance fixture if you add a new block pattern
8. **Record:** Postmortem notes in this file; agent prompts that worked in your README or `docs/codex-progress.md`

### Recommendation (v2)

Point is ready for **pilot full-stack SaaS admin apps** authored entirely in `.point`, scaffolded via **`point app new`**, with layout/navigation/rich views and client data loading proven at template scale.

**Next for adoption:** Run the v2 checklist with one **real** external team; capture blockers in a v2.1 addendum; consider a template variant with `route` + `point dev` for API-first teams.

---

## V3 — SaaS starter + onboarding smoke (Phase 44)

**Date:** 2026-05-24  
**Artifacts:** `packages/point/templates/saas-app/`, `scripts/onboarding-smoke.sh`, `docs/external-pilot-checklist.md`

### What it proves

- **`point create --template saas-app`** — auth capability, SQLite init workflow, protected POST route, same admin UI shell
- **Onboarding smoke in CI** — scaffold → check → launch → serve `/api/health` without monorepo checkout tricks
- **Std module resolution fix** — `capabilities auth` works from scaffolded project cwd (absolute std paths + bundled `packages/point/std/*.point`)

### Recommendation (v3)

Point is ready for **opinionated SaaS pilots** — one template path with DB + auth wired. Next: run [external pilot checklist](./external-pilot-checklist.md) with a real team.

---

## V4 — Real SQL CRUD + env JWT (Phase 47)

**Date:** 2026-05-24  
**Artifacts:** `sqlJsonMemberRow`, env-backed `JWT_SECRET`, POST `/api/members` INSERT, onboarding smoke SQL assertion

### What it proves

- **GET and POST members** both touch SQLite — no stub `{ id: "new" }` response
- **`JWT_SECRET` env** with demo fallback via fixed `env with default`
- **Onboarding smoke** asserts seeded member name in `/api/members` JSON after `init:db`

### Pending (real pilot)

| Item | Status |
|------|--------|
| External team runs pilot checklist | Not started |
| Blockers logged | — |
| Agent repair case from pilot friction | — |
