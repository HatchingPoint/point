# Phase 72 — Agent-app benchmark expansion v0.1.50

**Status:** Complete — v0.1.50  
**North star:** Full-app agent tasks — multistep UI builds and SSE feature-adds scored at app scale, not single-line repair.

## Deliverables

- [x] **P72-1** `ops-add-dashboard` — chart + datagrid + enqueue form feature-add from job-queue pattern
- [x] **P72-2** `sse-add-live-feed` — SSE route + subscribe feature-add from sse-dashboard example
- [x] **P72-3** Agent-app CI gate — `benchmark:agent-app:gate` with ≥6 cases at 100% pass
- [x] **P72-4** Export `benchmarks/agent-app-cases.json` + fixture README

## Verify

```bash
bun test tests/agent-app-benchmark.test.ts tests/agent-app-gate.test.ts
bun run benchmark:agent-app
bun run benchmark:agent-app:gate
bun run export:agent-app-cases
bun run ci
```

## Next candidates (Phase 73+)

1. **Ops dashboard app-repair** — wrong chart field wiring on full dashboard
2. **Agent-app model eval gate** — optional live API floor separate from structural gate
3. **Bind textarea repair fixture** — repair gate 35
