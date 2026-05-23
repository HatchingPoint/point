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

## Complete example catalog

| Path | Area | What to inspect |
|------|------|-----------------|
| `examples/hello.point` | Command | Minimal zero-arg command for `point run` |
| `examples/command.point` | Command | Named command entrypoint behavior |
| `examples/cart-total.point` | Logic | Records, rules, totals, loops |
| `examples/math.point` | Logic | Calculations, labels, conditions |
| `examples/literals.point` | Syntax | Literal values and basic expressions |
| `examples/optional.point` | Types | `Maybe<T>` and optional fields |
| `examples/result.point` | Types | `Text or Error` result pattern |
| `examples/variants/order-status.point` | Types | Tagged unions and `on Case` dispatch |
| `examples/catalog/price-lookup.point` | Types | `Map<Text, T>` and lookup |
| `examples/multi-file/catalog.point` | Modules | Imported catalog module |
| `examples/multi-file/order.point` | Modules | Relative `use ... from "./file.point"` |
| `examples/std-usage.point` | Stdlib | Standard module imports |
| `examples/tools/path-demo.point` | Stdlib | `std.path` helpers |
| `examples/tools/yaml-config.point` | Stdlib | YAML config loading |
| `examples/tools/process-runner.point` | Stdlib | Process execution bridge |
| `examples/tools/instant-demo.point` | Stdlib | `Instant` and time helpers |
| `examples/tools/jwt-demo.point` | Stdlib | JWT helpers and env-secret pattern |
| `examples/tools/ai-demo.point` | Stdlib/AI | Provider actions and API key handling |
| `examples/tools/maybe-narrow.point` | Types | Optional narrowing with `present` |
| `examples/action.point` | Effects | File-touching action |
| `examples/async.point` | Effects | Awaiting action calls |
| `examples/external.point` | Interop | External Node/npm import boundary |
| `examples/policy.point` | Policy | Pure allow/deny/require checks |
| `examples/route.point` | HTTP | Typed HTTP route |
| `examples/api/middleware-demo.point` | HTTP | Middleware and typed routes |
| `examples/api/middleware-integration.point` | HTTP tests | Integration tests against routes |
| `examples/api/stream-echo.point` | Realtime | WebSocket stream route |
| `examples/workflow.point` | Workflow | Basic async workflow |
| `examples/workflow-retry.point` | Workflow | Retry, timeout, failure branch |
| `examples/tools/health-check-schedule.point` | Schedule | Periodic job declaration |
| `examples/pipelines/document-ingest.point` | Agents | Pipeline steps and action calls |
| `examples/pipelines/guarded-output.point` | Agents | Guarded output paths |
| `examples/agents/support-chat.point` | Agents | Session and streaming support chat |
| `examples/prompts/support-greeting.point` | Agents | Prompt template |
| `examples/view.point` | UI | Basic view rendering |
| `examples/app/todo.point` | App | Runnable app-style command and UI logic |
| `examples/app/dashboard/dashboard.point` | App | Layout, navigation, pages, data loading |
| `examples/app/notes/notes.point` | App/database | Notes UI and database actions |
| `examples/app/log-viewer/log-viewer.point` | App/realtime | Stream subscription from UI |
| `examples/full-stack-template/src/app.point` | Template | Generated full-stack app source |
| `examples/starter-template/src/app.point` | Template | Starter app source |
| `examples/point-tests.point` | Tests | Unit-style Point tests |

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
