---
title: Language overview
description: Semantic blocks at a glance and how they lower to typed core for emit.
quadrant: Reference
---

## Summary

Point source is organized as semantic blocks. Each block has a dedicated page in this guide with syntax, semantics, and examples from the `examples/` directory.

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
| `view`, `page`, `layout`, `navigation` | UI and app shells | [Applications](/point/language/applications) |
| `route`, `middleware`, `stream route` | HTTP and WebSockets | [Routes](/point/language/routes), [Applications](/point/language/applications) |
| `workflow`, `schedule`, `command` | Orchestration and CLI | [Applications](/point/language/applications) |
| `pipeline`, `session`, `prompt`, `guard` | Agent orchestration | [Applications](/point/language/applications) |

## Pipeline (plain English)

```text
.point source → semantic AST → core IR (in memory) → check → emit → JS | TS | PY
```

Authors never write the core IR. It exists so the checker and emitters have a precise model, similar to an internal AST in other compilers.

## Agent note

Run `point index <file>` to list every declaration with a `point://semantic/` ref. Use those refs in `explain` and repair loops instead of line numbers.

## See also

- [Grammar summary](/point/reference/grammar)
- [Introduction](/point/guide/introduction)
- [Platform vision](/point/concepts/platform-vision)
- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
