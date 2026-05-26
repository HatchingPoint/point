# Phase 78 — Ops scaffold + notes form app-repair v0.1.56

**Status:** Draft — ready for overnight loops  
**Prerequisite:** v0.1.55 (agent-app gate 12, model-eval gate)  
**North star:** Measured TypeScript context for ops benchmarks; notes app form repair at app scale.

## Success criteria

- [ ] **P78-1** `benchmarks/next-ops-dashboard/` paired scaffold + manifest; ops agent-app cases use measured TS context (not heuristic padding)
- [ ] **P78-2** `notes-create-form-wiring` app-repair — bind textarea target on notes create form (`invalid-view-bind-target`)
- [ ] **P78-3** Agent-app gate **13** + model-eval gate **13**; `bun run ci` green
- [ ] **P78-4** Release **v0.1.56** — bump, CHANGELOG, tag, push; LandingPage `sync:agent-app-cases`

## Non-goals

- Live LLM model eval (`benchmark:agent-app-models`) — needs API keys; separate optional loop
- Compiler / language primitive changes
- Surgent repo

## File ownership (parallel safety)

| Track | Owns | Does not touch |
|-------|------|----------------|
| **Scaffold** | `benchmarks/next-ops-dashboard/**`, `scripts/paired-scaffold-*`, ops `nextDashboardCaseId` in agent-app cases | `packages/point/src/semantic/*` |
| **Notes repair** | `tests/fixtures/agent-app/notes-create-form-wiring/**`, agent-app registry + golden edits | scaffold track files |
| **Integrator** | version bumps, CHANGELOG, tag, `docs/codex-progress.md`, LandingPage sync | implementation mid-flight |

## Verify

```bash
bun test tests/next-ops-dashboard-scaffold.test.ts tests/agent-app-benchmark.test.ts
bun run benchmark:agent-app:gate
bun run benchmark:agent-app:model-eval-gate
bun run ci
```

## After Phase 78

- Phase 79: live model eval report export (optional API keys)
- Phase 80: repair gate 36+ or multistep notes feature-add
