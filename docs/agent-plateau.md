# Agent plateau — v0.1.48

**Status:** Shipped in v0.1.48  
**North star:** Point is the one-stop in-the-box shop for agentic application building — narrow diagnostics, golden repair fixtures, LSP parity, and platform UI validation so agents fix real apps in one shot.

## What “next plateau” means

| Layer | v0.1.47 | v0.1.48 plateau |
|-------|---------|-----------------|
| **UI kit validation** | Chart + datagrid + refresh | Bind select/textarea targets, toast requires submit |
| **Repair gate** | 31 single-shot | **33** single-shot at 100% sufficiency |
| **LSP parity** | Phase 26–27 spot check | Platform UI codes (chart, datagrid, refresh, toast, bind select) |
| **Agent loop** | check-json → line patch | Same loop; richer expected fields on form controls |

## Shipped in 0.1.48

### P70-1 — Bind select/textarea validation

`collectBindStatements` now includes `bindSelect` and `bindTextarea`. Wrong targets (e.g. `bind select "Role" to draft options …`) emit `invalid-view-bind-target` with repair hint `draft.role`.

### P70-2 — Toast without submit

Forms with `toast on success/error` but no `submit` line emit `toast-without-submit` with expected submit snippet.

### P70-3 — Agent repair gate 33

New fixtures: `invalid-bind-select-target`, `toast-without-submit`.

### P70-4 — LSP ↔ CLI parity expansion

Parity matrix covers platform UI repair codes, not only Phase 26–27 middleware/pipeline cases.

## Next candidates (post-0.1.48)

1. **SSE route** — push dashboards without polling (Phase 52 defer).
2. **Bind textarea repair fixture** — mirror select coverage.
3. **Agent-app benchmarks** — end-to-end feature builds scored on repair steps + token context.
4. **Multistep UI builds** — form + datagrid + chart in one repair-plan loop.

## Agent loop (unchanged contract)

```bash
point check-json src/app.point
# read diagnostics[0].code, .ref, .repair, .expected
# patch the line at diagnostics[0].span.start.line
# repeat until ok: true
```

Benchmark export: `bun scripts/export-agent-repair-cases.ts` → `benchmarks/agent-repair-cases.json`.
