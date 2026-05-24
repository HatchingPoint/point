# Phase 52 — Live dashboard refresh

**Status:** Complete  
**Prerequisite:** Phase 49 (v0.1.41)  
**North star:** Live dashboards without Convex — `refresh every N seconds` on data-loaded views/pages.

## Success criteria

- [x] **P52-1** Syntax: `refresh every N seconds` on view/page with `load data from action`
- [x] **P52-2** Checker: requires load data; valid duration units (seconds/minutes)
- [x] **P52-3** Emit: `setInterval` refetch in `emit-data-load.ts` with cleanup
- [x] **P52-4** Example: `examples/app/live-dashboard/` — counter or health metrics table
- [x] **P52-5** Tests + docs (`realtime.md`, UI guide)

## Non-goals

- Convex-style reactive queries
- SSE route (defer to follow-up)

## File ownership

| Owns | Does not touch |
|------|----------------|
| `parse.ts` (refresh lines) | `examples/app/job-queue`, `std/pty`, terminal emit |
| `ast.ts`, `desugar.ts`, `emit-data-load.ts` | |
| `tests/refresh-data-load.test.ts` | |

## After Phase 52

Phase 53 — std.pty capability.
