# Agent app benchmarks

Full-app scenarios for measuring agent context, feature-add tasks, and app-scale repairs.

Unlike `agent-repair/` (single-line typo fixes on mini fixtures), these cases use **real multi-block apps** (~84–105 lines) derived from `examples/app/dashboard/`.

## Case types

| Category | What it simulates | CI verifies |
|----------|-------------------|-------------|
| **feature-add** | Agent scaffolds new page/action/nav on existing app | Golden passes · broken surfaces diagnostic · structure added |
| **app-repair** | Agent wired a full app but left one mistake | check-json → line fix → `point check` (full app graph) |
| **refactor** | (planned) Rename/move blocks across app | Golden structure + check |

## Run

```bash
bun test tests/agent-app-benchmark.test.ts
bun run benchmark:agent-app
bun run export:agent-app-cases
```

## Roadmap

- Paired Next.js/React TS scaffolds with comparable tasks
- Live model eval on full-app feature-add (multi-edit prompts)
- Runtime/integration checks after feature-add
- Landing page side-by-side demo synced from `benchmarks/agent-app-cases.json`
