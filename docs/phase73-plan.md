# Phase 73 — Ops app-repair + textarea repair gate v0.1.51

**Status:** Complete — v0.1.51  
**North star:** Close agent-plateau gaps — full-app chart wiring repair + bind textarea single-shot fixture.

## Deliverables

- [x] **P73-1** `ops-dashboard-chart-wiring` — app-repair on multistep ops dashboard (`invalid-chart-field`)
- [x] **P73-2** `invalid-bind-textarea-target` — mirror select bind repair fixture
- [x] **P73-3** Agent repair gate **35** + agent-app gate **7**
- [x] **P73-4** LSP parity for textarea bind case

## Verify

```bash
bun scripts/agent-repair-gate.ts
bun run benchmark:agent-app:gate
bun run ci
```

## Next candidates (Phase 74+)

1. **Datagrid app-repair** — wrong sort column on full ops dashboard
2. **LandingPage sync** — OSS page + agent-app cases export
3. **Agent-app model eval gate** — optional live API floor
