---
title: Applications
description: Index of UI, HTTP, orchestration, and agent blocks for full-stack Point programs.
quadrant: Reference
---

## Summary

Application blocks connect application logic to HTTP, UI, orchestration, agents, and CLI entrypoints. Each area has a dedicated guide page — this page is the index.

## Guide pages

| Area | Blocks | Page |
|------|--------|------|
| UI | `view`, `page`, `layout`, `navigation` | [UI](/point/language/ui) |
| HTTP | `route`, `middleware` | [Routes](/point/language/routes) |
| Realtime | `stream route`, view `subscribe to` | [Realtime](/point/language/realtime) |
| Orchestration | `workflow`, `schedule`, `command` | [Workflows](/point/language/workflows) |
| Agents | `pipeline`, `session`, `prompt`, `guard output paths` | [Agents](/point/language/agents) |

## When to use which block

- **Pure logic** — `record`, `calculation`, `rule`, `label` (see [Language overview](/point/language/overview))
- **Side effects** — `action`, `external`, `policy` ([Effects](/point/language/effects))
- **HTTP API** — `route` + optional `middleware` ([Routes](/point/language/routes))
- **React UI** — `view` for fragments, `page` for document shells ([UI](/point/language/ui))
- **Multi-page app** — `layout`, `navigation`, multiple `page` blocks ([UI](/point/language/ui))
- **Background work** — `workflow` for async steps, `schedule` for intervals ([Workflows](/point/language/workflows))
- **CLI / scripts** — `command` ([Workflows](/point/language/workflows))
- **LLM flows** — `pipeline`, `session`, `prompt`, `guard` ([Agents](/point/language/agents))

## Compiler note

Application blocks share the same check and ref model as logic blocks. Views, routes, pipelines, and commands appear in `point index` with distinct semantic kinds for agent navigation.

## Demo apps

- `examples/app/dashboard/` — layout, navigation, data loading, lists
- `examples/app/notes/` — database actions in views
- `examples/app/log-viewer/` — stream route + subprocess
- `examples/full-stack-template/` — SaaS admin shell
- `examples/adopters/hatchingpoint/` — dogfood readiness demo (not the default teaching path)

## See also

- [Language overview](/point/language/overview)
- [Platform vision](/point/concepts/platform-vision)
- [How Point runs](/point/concepts/how-point-runs)
- [Examples](/point/examples)
