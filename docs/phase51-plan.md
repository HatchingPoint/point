# Phase 51 — Job queue pattern

**Status:** Done  
**Prerequisite:** Phase 49 (v0.1.41)  
**North star:** Background work is **in the box** — SQL-backed job enqueue/status + workflow runner, general example.

## Success criteria

- [x] **P51-1** `examples/app/job-queue/` — jobs table, enqueue action, poll status action, workflow step runner
- [x] **P51-2** Route `POST /api/jobs` + `GET /api/jobs/:id` wired from actions
- [x] **P51-3** Admin view: enqueue form + table of jobs with status labels
- [x] **P51-4** Tests: parse/check/build + integration smoke for job routes
- [x] **P51-5** Docs: workflows.md job-queue section + codex-progress checkpoint

## Non-goals

- Distributed queue (Redis, SQS)
- Product-specific factory keywords

## File ownership

| Owns | Does not touch |
|------|----------------|
| `examples/app/job-queue/**` | `parse.ts`, `emit-data-load.ts`, `std/pty` |
| `tests/job-queue*.test.ts` | terminal / refresh syntax |

## After Phase 51

Phase 52 — live dashboard refresh.
