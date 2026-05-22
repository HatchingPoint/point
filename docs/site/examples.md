---
title: Examples
description: Working Point examples by language area.
quadrant: Tutorial
---

## Summary

Examples in the Point repo are working fixtures used by checks and tests. They are the best source for small, runnable patterns across domains.

## Start here

Pick any domain — all paths use the same check and agent commands:

| Domain | Example | What it shows |
|--------|---------|---------------|
| CLI | `examples/hello.point` | Minimal `command` + `point run` |
| Pure logic | `examples/cart-total.point` | Records, calculations, rules, loops |
| HTTP | `examples/route.point` | `route` with path params |
| UI | `examples/view.point` | Styled `view` blocks |
| Orchestration | `examples/workflow.point` | Async `workflow` steps |
| Agents | `examples/agents/support-chat.point` | `session` + streaming |
| Full app | `examples/app/dashboard/dashboard.point` | Layout, navigation, data loading |
| Stdlib | `examples/std-usage.point` | `use std.*` imports |
| Tests | `examples/point-tests.point` | Test conventions |

Also useful: `examples/math.point` (mixed logic + labels), `examples/variants/order-status.point` (tagged unions).

## Adopters (dogfood demos)

Real product shapes live under `examples/adopters/` — optional, not the default learning path:

- `examples/adopters/starter-labs/subscription-tier.point` — pricing tiers and labels
- `examples/adopters/hatchingpoint/readiness-widget.point` — interactive checklist ([live demo](https://hatchingpoint.com/point/examples#live-demo))

## Application platform (v0.1.0)

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

The App Store listing readiness widget on the public docs site uses the same controlled-input patterns as any interactive `view` — it is one adopter demo, not the language default:

[Open live demo →](https://hatchingpoint.com/point/examples#live-demo)

## Agent workflow

When copying an example, keep the semantic block structure and run:

```bash
point check your-file.point
point fmt your-file.point
```

## See also

- [Language overview](/point/language/overview)
- [Applications index](/point/language/applications)
- [Platform vision](/point/concepts/platform-vision)
- [Run, test, REPL](/point/toolchain/run-test-repl)
