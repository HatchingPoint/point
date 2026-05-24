---
title: Examples
description: Working Point examples by language area.
quadrant: Tutorial
---

## Summary

Examples in the Point repo are working fixtures used by checks and tests. They are the best source for small, runnable patterns across domains.

**Start here:** [Point in 60 seconds](/point/guide/point-in-60-seconds) → [Golden app demo](/point/guide/golden-app-demo).

## Golden path (evaluators)

| Step | Command / doc |
|------|----------------|
| 1 | [Golden app demo](/point/guide/golden-app-demo) — `point create`, `point dev`, `point launch` |
| 2 | `point box src/app.point` — discover capabilities + commands |
| 3 | `point check-json src/app.point` — agent repair loop |

## By domain

| Domain | Example | Launch |
|--------|---------|--------|
| CLI | `examples/command.point` | `point launch examples/command.point hello cli` |
| Pure logic | `examples/cart-total.point` | `point check` (no command) |
| Capabilities | `examples/capabilities-demo.point` | `point check` |
| HTTP | `examples/route.point` | `point check` |
| UI | `examples/view.point` | `point check` |
| Orchestration | `examples/workflow.point` | `point check` |
| Agents | `examples/agents/support-chat.point` | `point check` |
| Full app | `examples/app/dashboard/dashboard.point` | `point commands` then launch |
| Stdlib | `examples/std-usage.point` | `point check` |
| Tests | `examples/point-tests.point` | `point test examples/point-tests.point` |

Also useful: `examples/math.point` (mixed logic + labels), `examples/variants/order-status.point` (tagged unions).

## Adopters (dogfood demos)

Real product shapes under `examples/adopters/` — optional, not the default learning path:

- `examples/adopters/starter-labs/subscription-tier.point` — pricing tiers and labels
- `examples/adopters/hatchingpoint/readiness-widget.point` — interactive checklist ([live demo](https://hatchingpoint.com/point/examples#live-demo))

## Application platform

| Area | Example |
|------|---------|
| Multi-page app | `examples/app/dashboard/dashboard.point` |
| Notes + database | `examples/app/notes/notes.point` |
| WebSocket + subprocess stream | `examples/app/log-viewer/log-viewer.point` |
| Full-stack template | `examples/full-stack-template/` |
| Variant types | `examples/variants/order-status.point` |
| Middleware + typed routes | `examples/api/middleware-demo.point` |
| Workflow retry/timeout | `examples/workflow-retry.point` |
| Pipeline + guard | `examples/pipelines/guarded-output.point` |
| Session + AI | `examples/agents/support-chat.point` |
| Prompt library | `examples/prompts/support-greeting.point` |
| Integration tests | `examples/api/middleware-integration.point` |

Scaffold a new app:

```bash
point create my-app
```

## Live demo

The App Store listing readiness widget on the public docs site uses the same controlled-input patterns as any interactive `view`:

[Open live demo →](https://hatchingpoint.com/point/examples#live-demo)

## Agent workflow

```bash
point check your-file.point
point check-json your-file.point
point repair-plan your-file.point
```

## See also

- [Golden app demo](/point/guide/golden-app-demo)
- [In the box](/point/language/in-the-box)
- [Language overview](/point/language/overview)
