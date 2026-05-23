---
title: Language overview
description: Semantic blocks at a glance — the Point language reference starting point.
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
| `view`, `page`, `layout`, `navigation` | UI and app shells | [UI](/point/language/ui) |
| `route`, `middleware` | HTTP handlers | [Routes](/point/language/routes) |
| `stream route` | WebSockets and live views | [Realtime](/point/language/realtime) |
| `workflow`, `schedule`, `command` | Orchestration and CLI | [Workflows](/point/language/workflows) |
| `pipeline`, `session`, `prompt`, `guard` | Agent orchestration | [Agents](/point/language/agents) |

For a compact reference of every block, purity boundary, and emitted target, see [Block reference](/point/reference/blocks). For literals, calls, maps, optionals, and operators, see [Expressions and operators](/point/reference/expressions).

## Language layers

Point has three author-visible layers:

| Layer | Blocks | Use when |
|-------|--------|----------|
| Data and pure logic | `record`, `variant`, `calculation`, `rule`, `label` | You need checked product rules, scoring, classification, and typed values |
| Effects and interop | `external`, `action`, `policy`, `guard` | You need IO, host APIs, security boundaries, or reviewable side effects |
| Application and agents | `view`, `page`, `layout`, `navigation`, `route`, `stream route`, `workflow`, `pipeline`, `session`, `prompt`, `schedule`, `command` | You need runnable apps, APIs, realtime flows, background work, or agent workflows |

The compiler treats internal core IR as an implementation detail. Authors should document and discuss semantic Point syntax, not generated TypeScript, JavaScript, Python, or core lowering names.

## Minimal grammar shape

Most executable blocks follow the same readable shape:

```point
calculation name
  input value: Text
  output result: Text
  result is value
```

Effectful blocks declare their boundary:

```point
action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

Application blocks name the runtime surface directly:

```point
route health check
  method GET
  path "/api/health"
  output body: Text
  return "ok"
```

## First commands

```bash
point check examples/math.point
point index examples/math.point
point fmt examples/math.point
```

## Agent note

Run `point index <file>` to list every declaration with a `point://semantic/` ref. Use those refs in `explain` and repair loops instead of line numbers.

## See also

- [Quick start](/point/guide/quick-start)
- [How Point runs](/point/concepts/how-point-runs)
- [Grammar](/point/reference/grammar)
- [Examples](/point/examples)
