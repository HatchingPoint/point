# Agent app benchmarks

Full-app scenarios for measuring agent context, feature-add tasks, refactors, and app-scale repairs.

Unlike `agent-repair/` (single-line typo fixes on mini fixtures), these cases use **real multi-block apps** (~70–105 lines) derived from `examples/app/dashboard/` and `examples/app/notes/`.

## Case types

| Category | What it simulates | CI verifies |
|----------|-------------------|-------------|
| **feature-add** | Agent scaffolds new page/action/nav on existing app | Golden passes · broken surfaces diagnostic · structure added |
| **app-repair** | Agent wired a full app but left one mistake | check-json → line fix → `point check` (full app graph) |
| **refactor** | Rename/move blocks across app (partial agent rename) | Golden structure + check |

## Cases (12)

| ID | Category | Source example |
|----|----------|----------------|
| `dashboard-add-search` | feature-add | `examples/app/dashboard/` |
| `dashboard-search-wiring` | app-repair | dashboard golden |
| `notes-add-detail` | feature-add | `examples/app/notes/` |
| `notes-detail-wiring` | app-repair | notes detail load action typo |
| `dashboard-rename-products` | refactor | dashboard items → products |
| `ops-add-dashboard` | feature-add | job-queue pattern |
| `sse-add-live-feed` | feature-add | sse-dashboard |
| `ops-dashboard-chart-wiring` | app-repair | wrong chart label field |
| `ops-dashboard-sort-wiring` | app-repair | wrong datagrid sort column |
| `ops-dashboard-filter-wiring` | app-repair | wrong datagrid filter column |
| `ops-dashboard-page-size-wiring` | app-repair | invalid datagrid page size |
| `ops-dashboard-refresh-wiring` | app-repair | refresh without load data |

## Paired Next.js scaffolds

| Scaffold | Path |
|----------|------|
| Dashboard + rename | `benchmarks/next-dashboard/` |
| Notes | `benchmarks/next-notes/` |
| Ops dashboard | `benchmarks/next-ops-dashboard/` |

Measured TypeScript agent context comes from real files listed in each `manifest.json`.

## Run

```bash
bun test tests/agent-app-benchmark.test.ts tests/agent-app-gate.test.ts tests/next-dashboard-scaffold.test.ts tests/next-notes-scaffold.test.ts tests/next-ops-dashboard-scaffold.test.ts tests/agent-app-model-eval.test.ts
bun run benchmark:agent-app
bun run benchmark:agent-app:gate
bun run benchmark:agent-app:model-eval-gate
bun run export:agent-app-cases
bun run proof:agent-app -- --skip-models
bun run benchmark:agent-app-models   # optional live API eval
```
