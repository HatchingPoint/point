# Agent app benchmarks

Full-app scenarios for measuring agent context, feature-add tasks, refactors, and app-scale repairs.

Unlike `agent-repair/` (single-line typo fixes on mini fixtures), these cases use **real multi-block apps** (~70–105 lines) derived from `examples/app/dashboard/` and `examples/app/notes/`.

## Case types

| Category | What it simulates | CI verifies |
|----------|-------------------|-------------|
| **feature-add** | Agent scaffolds new page/action/nav on existing app | Golden passes · broken surfaces diagnostic · structure added |
| **app-repair** | Agent wired a full app but left one mistake | check-json → line fix → `point check` (full app graph) |
| **refactor** | Rename/move blocks across app (partial agent rename) | Golden structure + check |

## Cases (4)

| ID | Category | Source example |
|----|----------|----------------|
| `dashboard-add-search` | feature-add | `examples/app/dashboard/` |
| `dashboard-search-wiring` | app-repair | dashboard golden |
| `notes-add-detail` | feature-add | `examples/app/notes/` |
| `dashboard-rename-products` | refactor | dashboard items → products |

## Paired Next.js scaffolds

| Scaffold | Path |
|----------|------|
| Dashboard + rename | `benchmarks/next-dashboard/` |
| Notes | `benchmarks/next-notes/` |

Measured TypeScript agent context comes from real files listed in each `manifest.json`.

## Run

```bash
bun test tests/agent-app-benchmark.test.ts tests/next-dashboard-scaffold.test.ts tests/next-notes-scaffold.test.ts tests/agent-app-model-eval.test.ts
bun run benchmark:agent-app
bun run export:agent-app-cases
bun run proof:agent-app -- --skip-models
bun run benchmark:agent-app-models   # optional live API eval
```
