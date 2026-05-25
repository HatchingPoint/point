# Phase 74 — Datagrid app-repair + site sync v0.1.52

**Status:** Complete — v0.1.52  
**North star:** Full-app datagrid wiring repair on ops dashboard; LandingPage synced with OSS docs and benchmark exports.

## Deliverables

- [x] **P74-1** `ops-dashboard-sort-wiring` — app-repair for wrong datagrid sort column
- [x] **P74-2** Agent-app gate **8**
- [x] **P74-3** LandingPage — `sync:point-docs`, repair + app case exports, OSS/contribute links

## Verify

```bash
bun run benchmark:agent-app:gate
bun run ci
cd ../LandingPage && bun run sync:point-docs && bun run sync:agent-repair-cases && bun run sync:agent-app-cases && bun run build
```
