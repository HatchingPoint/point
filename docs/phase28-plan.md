# Phase 28 — Agent loop hardening (parallel with Phase 27)

**Status:** Active — runs **in parallel** with [phase27-plan.md](./phase27-plan.md)  
**Prerequisite:** Phase 26 complete; Phase 27 may be in progress  
**North star:** Strengthen Point as a **single-package, agent-native compiler** — stable refs, structured repair, index/explain coverage — without wrapper tooling or new npm dependencies.

**Parallel rule:** Phase 28 agents must **not** edit Phase 27-owned paths (see [File ownership](#file-ownership) below). Integrator merges when both tracks are green on `main`.

---

## Why parallel with Phase 27?

| Phase 27 focus | Phase 28 focus |
|----------------|----------------|
| Runtime/UI completeness (theme toggle, SQL schema stub) | Compiler ↔ agent interface (repair, index, explain, benchmarks) |
| `parse.ts`, `emit-*`, `ui-style`, theme blocks | `cli.ts`, `semantic/context.ts`, `benchmarks/`, `tests/fixtures/agent-repair/` |
| App author experience | Agent author experience |

No shared hot files if ownership is respected → **no negative interference**.

---

## Principles (non-wrapper, real integration)

Every P28 deliverable must pass [point-principles-gate.md](./point-principles-gate.md) plus:

| Principle | Meaning for Phase 28 |
|-----------|----------------------|
| **Real integration** | Features live in `@hatchingpoint/point` compiler/CLI — not a separate “agent wrapper” repo or MCP-only shim |
| **Single source** | Agents patch `.point` via `check-json` + semantic refs; no hand-editing generated TS for normal repair |
| **No new runtime deps** | Use Bun/Node built-ins + existing package surface; extend compiler, don’t add orchestration libraries |
| **Agent-native by design** | Every new diagnostic → `ref`, `repair`, `index`, `explain`; every fixture → exportable benchmark case |
| **General purpose** | Fixtures and examples use neutral domains (notes, cart, HTTP) — not Surgent/readiness-only |

**Fail** if a deliverable is “prompt documentation only” or requires an external chat service to work.

---

## Success criteria (Phase 28 exit gate)

- [ ] **Repair-plan quality** — multi-step cases ordered correctly; `point repair-plan` docs match behavior
- [ ] **Index/explain parity** — every public diagnostic code has index coverage or documented exception; explain returns useful summary for top 20 codes
- [ ] **Agent repair expansion** — 5+ new broken/fixed fixture pairs + `benchmarks/agent-repair-cases.json` export
- [ ] **LSP ↔ CLI parity** — VS Code extension surfaces same `code` + `repair` as `check-json` for new diagnostics (spot-check matrix in tests)
- [ ] **Self-host increment** — one compiler pass authored or validated in `.point` under `compiler/` (naming, fmt rule, or diagnostic catalog)
- [ ] General examples + `bun run ci` green
- [ ] Patch release **v0.1.20+** (integrator with Phase 27 or immediately after)

---

## Non-goals

- Theme toggle, SQL codegen, view emit changes (Phase 27)
- New semantic block kinds
- LLM provider CLI wrappers (Phase 18 decision)
- npm packages beyond `@hatchingpoint/point` / `@hatchingpoint/point-vscode`

---

## Workstreams

### P28-1 — Repair-plan & multi-step benchmarks (Wave 1)

**Scope:** Improve `point repair-plan` ordering, relatedRefs usage, and multistep agent-repair cases.

**Deliverables:**

- Extend `scripts/agent-repair-sufficiency.ts` with 2+ multistep cases (neutral domains)
- Tests: repair order, token budget, sufficiency gate
- Docs: `docs/site/ai/repair-plan.md` — when to use repair-plan vs check-json alone

**Touch:** `scripts/agent-repair-sufficiency.ts`, `tests/agent-repair-sufficiency.test.ts`, `benchmarks/`, docs only

---

### P28-2 — Index & explain coverage (Wave 1)

**Scope:** Close gaps between diagnostic codes and `point index` / `point explain`.

**Deliverables:**

- Audit: diagnostic code → index ref → explain summary (spreadsheet or test table)
- Fill missing explain summaries in `semantic/context.ts` for load-data, middleware, pipeline, money lint codes
- Test: `tests/agent-index-explain.test.ts` (or extend existing index tests)

**Touch:** `packages/point/src/semantic/context.ts`, `tests/*index*`, docs/site/ai/

**Do not touch:** `check-routes.ts`, `check-themes.ts`, `emit-data-load.ts`

---

### P28-3 — Agent repair fixture expansion (Wave 1)

**Scope:** Move **agent repair expansion** out of Phase 27 into Phase 28 (5+ new cases).

**Candidate fixtures (neutral):**

- `middleware-input-unavailable` (route + middleware wiring)
- `pipeline-step-type-mismatch`
- `float-money-field`
- `missing-variant-case`
- `invalid-view-bind-target` or `unknown-view-style`

**Deliverables:**

- Broken/fixed pairs under `tests/fixtures/agent-repair/`
- Register in `scripts/agent-repair-sufficiency.ts`
- Run `bun scripts/export-agent-repair-cases.ts`

**Touch:** fixtures, scripts, benchmarks only — **not** checker implementation (already on main)

---

### P28-4 — LSP diagnostic parity spot-check (Wave 2)

**Scope:** Ensure extension diagnostics match CLI `check-json` shape for Phase 26–27 codes.

**Deliverables:**

- Test matrix in `packages/point-vscode/` or root tests
- Document any intentional LSP gaps in `docs/site/ai/check-json.md`

**Touch:** `packages/point-vscode/`, tests — avoid `parse.ts` / theme emit

---

### P28-5 — Self-host compiler pass (Wave 2)

**Scope:** Extend `compiler/` with a `.point` module that validates or catalogs diagnostics/rules (Phase 21 P21-4 pattern).

**Deliverables:**

- e.g. `compiler/passes/diagnostic-catalog.point` or naming rule pass
- Wired into CI or `point check` optional pass
- Docs note in `docs/self-host-roadmap.md`

**Touch:** `compiler/`, `tests/self-host*.test.ts` — isolated from UI/theme/SQL

---

## File ownership

**Phase 27 only — Phase 28 agents must not modify:**

- `packages/point/src/semantic/parse.ts` (theme lines)
- `packages/point/src/semantic/check-themes.ts`
- `packages/point/src/core/ui-style.ts` (theme toggle API)
- `packages/point/src/core/emit-sql*.ts` or new SQL codegen modules
- `packages/point/templates/vercel-app/` (theme UX)
- `docs/site/language/ui.md` (theme toggle sections)

**Phase 28 only — Phase 27 agents must not modify:**

- `tests/fixtures/agent-repair/**`
- `benchmarks/agent-repair-cases.json`
- `scripts/agent-repair-sufficiency.ts`
- `scripts/export-agent-repair-cases.ts`
- `docs/site/ai/**` (except cross-links)
- `compiler/passes/**` (self-host)

**Shared — coordinate or sequential merge:**

- `packages/point/src/core/check.ts` — prefer **new** `check-*.ts` modules; avoid both phases editing same hunk
- `docs/codex-progress.md` — append only, one checkpoint per goal
- `CHANGELOG.md` / version bumps — integrator only

---

## Parallel execution

| Wave | Phase 27 | Phase 28 (parallel) |
|------|----------|---------------------|
| **1** | P27-3 theme toggle | P28-1 repair-plan + P28-2 index/explain |
| **2** | P27-4 SQL schema stub | P28-3 repair fixtures + P28-4 LSP parity |
| **Integrator** | v0.1.20 when both exit gates pass | Same release or v0.1.21 if 27 lands first |

---

## Sanity check

```bash
bun test tests/agent-repair-sufficiency.test.ts tests/agent-index-explain.test.ts
bun scripts/export-agent-repair-cases.ts
bun packages/point/src/cli.ts repair-plan tests/fixtures/agent-repair/missing-await-broken.point
bun run ci
```

---

## After Phase 28

- **Phase 29 (sequential):** Record → SQL codegen + validation (if P27-4 is only a spike, promote here)
- **Phase 30 (optional parallel):** Python std mirror completion (Phase 19 leftovers) — orthogonal emit path

Update [language-primitive-audit.md](./language-primitive-audit.md) only when a primitive ships — not required for Phase 28 exit.

---

## Agent dispatch

See [codex-goal-phase28.md](./codex-goal-phase28.md).
