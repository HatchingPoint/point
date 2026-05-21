# Point Conformance Coverage Map

**Phase 21 goal:** P21-1 — Conformance expansion  
**Last updated:** 2026-05-21  
**Test count:** 339 tests (`bun test`)

This document maps **semantic blocks shipped in Phases 14–20** to **general examples**, **minimal conformance fixtures**, and **primary test files**.

---

## Fixture discovery

The conformance suite discovers `.point` files from:

| Pattern | Purpose |
|---------|---------|
| `examples/**/*.point` | General-purpose feature examples |
| `std/**/*.point` | Standard library modules |
| `compiler/**/*.point` | Self-host / compiler passes |
| `tests/conformance/fixtures/**/*.point` | Minimal per-block conformance fixtures (P21-1) |

Discovery is implemented in `tests/conformance/conformance.test.ts` and mirrored in semantic emit/desugar tests.

Project-wide `check-all` / `build-all` still scan `examples/**`, `std/**`, and `compiler/**` only — conformance fixtures are checked in targeted tests, not the global project gate.

---

## Phase 14–20 block coverage (P21-1 focus)

| Block | Phase | General example | Conformance fixture | Primary tests |
|-------|-------|-----------------|---------------------|---------------|
| **stream route** | 16 | `examples/api/stream-echo.point` | `tests/conformance/fixtures/stream-route.point` | `tests/stream-routes.test.ts`, `tests/process-stream.test.ts` |
| **pipeline** | 18 | `examples/pipelines/document-ingest.point` | `tests/conformance/fixtures/pipeline.point` | `tests/pipeline.test.ts` |
| **prompt** | 18 | `examples/prompts/support-greeting.point` | `tests/conformance/fixtures/prompt.point` | `tests/prompt-library.test.ts` |
| **session** | 18 | `examples/agents/support-chat.point` | `tests/conformance/fixtures/session.point` | `tests/session-stream.test.ts` |
| **layout** | 15 | `examples/app/dashboard/dashboard.point` | `tests/conformance/fixtures/layout-navigation.point` | `tests/point-core.test.ts`, `tests/rich-view-components.test.ts` |
| **navigation** | 15 | `examples/app/dashboard/dashboard.point` | `tests/conformance/fixtures/layout-navigation.point` | `tests/client-navigation.test.ts` |
| **database actions** | 17 | `examples/app/notes/notes.point` | `tests/conformance/fixtures/database-actions.point` | `tests/std-runtime.test.ts`, `tests/view-data-load.test.ts` |
| **schedule** | 16 | `examples/tools/health-check-schedule.point` | `tests/conformance/fixtures/schedule.point` | `tests/schedule-emit.test.ts` |
| **guard** | 18 | `examples/pipelines/guarded-output.point` | `tests/conformance/fixtures/guard.point` | `tests/guard-output.test.ts` |

---

## Extended Phase 14–20 coverage

| Feature | Phase | General example | Primary tests |
|---------|-------|-----------------|---------------|
| Route middleware + typed HTTP | 14 | `examples/api/middleware-demo.point` | `tests/middleware-routes.test.ts`, `tests/python-route-emit.test.ts` |
| Enum / variant types | 14 | `examples/variants/order-status.point` | `tests/point-core.test.ts`, `tests/semantic-desugar.test.ts` |
| `std.path` / `std.process` / `std.crypto` / `std.yaml` | 14 | `examples/tools/path-demo.point`, `examples/tools/process-runner.point`, `examples/tools/jwt-demo.point`, `examples/tools/yaml-config.point` | `tests/std-runtime.test.ts`, `tests/python-std-parity.test.ts` |
| Statement source maps | 14 | `examples/math.point` | `tests/run-bridge.test.ts` |
| View data loading | 15 | `examples/app/dashboard/dashboard.point` | `tests/view-data-load.test.ts` |
| Rich view components (form, tabs, modal) | 15 | `examples/app/dashboard/dashboard.point` | `tests/rich-view-components.test.ts` |
| Client stream subscribe | 16 | `examples/app/log-viewer/log-viewer.point` | `tests/stream-subscribe.test.ts`, `tests/process-stream.test.ts` |
| Workflow retry / timeout / policy | 16 | `examples/workflow-retry.point` | `tests/workflow-retry.test.ts`, `tests/python-workflow-emit.test.ts` |
| Database interop (`std.sql` + external) | 17 | `examples/app/notes/notes.point` | `tests/std-runtime.test.ts`, conformance `database-actions.point` |
| AI provider pack (`std.ai`) | 18 | `examples/tools/ai-demo.point` | `tests/ai-providers.test.ts` |
| Python route/workflow/command emit | 19 | `examples/api/middleware-demo.point`, `examples/workflow-retry.point` | `tests/python-route-emit.test.ts`, `tests/python-workflow-emit.test.ts`, `tests/python-parity-suite.test.ts` |
| Python std mirror | 19 | `examples/tools/path-demo.point` | `tests/python-std-parity.test.ts`, `tests/python-emit.test.ts` |
| `point dev` / full-stack template | 20 | `examples/full-stack-template/src/app.point` | `tests/point-dev.test.ts`, `tests/app-new-cli.test.ts`, `tests/integration-harness.test.ts` |

---

## Conformance test layers

| Layer | File | What it verifies |
|-------|------|------------------|
| Project gate | `tests/conformance/conformance.test.ts` | `check-all`, `build-all`, `build-ts-all`; fixture discovery; per-block minimal emit snapshots |
| Semantic parse fuzz | `tests/conformance/conformance.test.ts` | Malformed input throws; random garbage does not hang |
| Legacy parity | `tests/semantic-emit.test.ts`, `tests/semantic-desugar.test.ts` | AST pipeline matches legacy lowering (with documented skips for newer blocks) |
| Per-feature suites | See tables above | Block-specific check, emit, runtime, and index coverage |
| Python parity | `tests/python-parity-suite.test.ts` | Paired JS/Python output for selected examples |

---

## Emit snapshot expectations (minimal fixtures)

Each file under `tests/conformance/fixtures/` has a targeted emit snapshot test:

| Fixture | JS | TS | Python |
|---------|:--:|:--:|:------:|
| `stream-route.point` | ✅ | ✅ | — |
| `pipeline.point` | ✅ | ✅ | partial (actions only) |
| `prompt.point` | — | ✅ | ✅ (record types) |
| `session.point` | — | ✅ | ✅ (record types) |
| `layout-navigation.point` | — | ✅ | partial (views skipped) |
| `database-actions.point` | ✅ | — | ✅ (record types) |
| `schedule.point` | ✅ | ✅ | ✅ (actions/commands) |
| `guard.point` | ✅ | ✅ | — |

---

## Principles gate (P21-1)

```text
Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅
```

- **Semantic:** Each block is a named declaration family, not host boilerplate.
- **Agent loop:** Blocks indexed via `point index` / `point explain`; covered in feature tests.
- **Block family:** Fixtures extend existing families (`pipeline`, `session`, `layout`, etc.).
- **Effects:** Actions declare `touches`; guards scope file access.
- **General example:** Every row in the P21-1 table has a non-factory example under `examples/`.
- **Boring emit:** Snapshot tests assert readable glue identifiers, not hand-edited output.
- **No overfit:** Examples use generic domains (notes, dashboard, support chat), not product-specific keywords.

---

## Gaps and follow-ups (Phase 21)

- Python emit for `pipeline`, `session`, `layout`, `navigation`, and `schedule` runtime helpers remains partial — tracked in Phase 19 docs.
- Performance benchmarks (P21-2) and spec sync (P21-3) are separate goals.
