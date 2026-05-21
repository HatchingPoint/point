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
| `record` | Named data shapes | [Records](/point/language/records) |
| `calculation` | Pure derived values | [Calculations](/point/language/calculations) |
| `rule` | Scoring and accumulation | [Rules](/point/language/rules) |
| `label` | Classification to text or other types | [Labels](/point/language/labels) |
| Types | `Text`, `Int`, `List<T>`, `Maybe<T>`, unions | [Types](/point/language/types) |
| Loops and mutation | `for each`, `add to`, `set to` | [Control flow](/point/language/control-flow) |
| `module`, `use` | Multi-file programs | [Modules](/point/language/modules) |
| `external`, `action`, `policy` | Effects and boundaries | [Effects](/point/language/effects) |
| `view`, `route`, `workflow`, `command` | Application layer | [Applications](/point/language/applications) |

## Pipeline (plain English)

```text
.point source → semantic AST → core IR (in memory) → check → emit → TypeScript | JavaScript
```

Authors never write the core IR. It exists so the checker and emitters have a precise model, similar to an internal AST in other compilers.

## Agent note

Run `point index <file>` to list every declaration with a `point://semantic/` ref. Use those refs in `explain` and repair loops instead of line numbers.

## See also

- [Grammar summary](/point/reference/grammar)
- [Introduction](/point/guide/introduction)
- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
