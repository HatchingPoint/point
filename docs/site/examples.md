---
title: Examples
description: Working Point examples by language area.
quadrant: Tutorial
---

## Summary

Examples in the Point repo are working fixtures used by checks and tests. They are the best source for small, runnable patterns.

## Start here

- `examples/hello.point` for a minimal command
- `examples/math.point` for records, calculations, rules, and labels
- the standard-library usage fixture for std imports
- `examples/route.point` for HTTP routes
- `examples/view.point` for views
- `examples/workflow.point` for orchestration
- `examples/point-tests.point` for tests
- `examples/adopters/hatchingpoint/readiness-widget.point` for an interactive listing readiness widget (see [live demo](https://hatchingpoint.com/point/examples#live-demo))

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
point app new my-app
```

## Live demo

Try the App Store listing readiness widget on the public docs site — toggle checklist items and watch score and status update using the same rules as `readiness-widget.point`:

[Open live demo →](https://hatchingpoint.com/point/examples#live-demo)

## Agent workflow

When copying an example, keep the semantic block structure and run:

```bash
point check your-file.point
point fmt your-file.point
```

## See also

- [Language overview](/point/language/overview)
- [Applications](/point/language/applications)
- [Platform vision](/point/concepts/platform-vision)
- [Run, test, REPL](/point/toolchain/run-test-repl)
