---
title: Language overview
description: Semantic blocks at a glance — the Point language reference starting point.
quadrant: Reference
---

## Summary

Point source is organized as semantic blocks. Each block has a dedicated page in this guide with syntax, semantics, and examples from the `examples/` directory.

**New here?** [Point in 60 seconds](/point/guide/point-in-60-seconds) → [Golden app demo](/point/guide/golden-app-demo).

## Block map

| Block | Purpose | Guide page |
|-------|---------|------------|
| `record`, `variant` | Named data shapes and tagged unions | [Records](/point/language/records), [Types](/point/language/types) |
| `calculation` | Pure derived values | [Calculations](/point/language/calculations) |
| `rule` | Scoring and accumulation | [Rules](/point/language/rules) |
| `label` | Classification to text or other types | [Labels](/point/language/labels) |
| Types | `Text`, `Int`, `List<T>`, `Maybe<T>`, unions | [Types](/point/language/types) |
| Loops and mutation | `for each`, `add to`, `set to` | [Control flow](/point/language/control-flow) |
| `module`, `use` | Multi-file programs | [Modules](/point/language/modules) |
| `external`, `action`, `policy` | Effects and boundaries | [Effects](/point/language/effects) |
| `view`, `page`, `layout`, `navigation` | UI and app shells | [UI](/point/language/ui) |
| `route`, `middleware` | HTTP handlers | [Routes](/point/language/routes) |
| `stream route` | WebSockets and live views | [Realtime](/point/language/realtime) |
| `workflow`, `schedule`, `command` | Orchestration and CLI | [Workflows](/point/language/workflows) |
| `pipeline`, `session`, `prompt`, `guard` | Agent orchestration | [Agents](/point/language/agents) |

## First commands

```bash
point check examples/math.point
point box examples/command.point
point launch examples/command.point hello cli
point index examples/math.point
```

## Agent note

Run `point index <file>` to list every declaration with a `point://semantic/` ref. Use those refs in `explain` and repair loops instead of line numbers.

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Golden app demo](/point/guide/golden-app-demo)
- [How Point runs](/point/concepts/how-point-runs)
- [Grammar](/point/reference/grammar)
- [Examples](/point/examples)
