---
title: Grammar summary
description: Normative EBNF-style summary of semantic Point source.
quadrant: Reference
---

## Summary

This page summarizes public **semantic** syntax. Full normative detail lives in the repository `docs/language-spec.md`. Internal core syntax (`fn`, `let`, `type`) is not author-facing.

**Version:** aligned with `@hatchingpoint/point@0.2.7`.

## Program structure

```ebnf
program      ::= moduleDecl? topLevel*
moduleDecl   ::= "module" name
topLevel     ::= record | variant | calculation | rule | label | external | action
               | policy | guard | workflow | pipeline | session | prompt
               | view | page | layout | navigation | route | middleware
               | streamRoute | schedule | command | useDecl
useDecl      ::= "use" modulePath ("from" string)?
```

Every public file needs at least one substantive top-level declaration.

## Types

| Type | Notes |
|------|-------|
| `Text`, `Int`, `Float`, `Bool`, `Void` | Primitives |
| `List<T>` | One type argument |
| `Maybe<T>` | Optional; `none` literal |
| `A or B` | Union / result |
| Record name | User-defined |
| `variant` | Tagged union with `on Case` dispatch in labels |

## Block keywords (quick reference)

| Keyword | Role |
|---------|------|
| `record` | Data shape |
| `variant` | Tagged union |
| `calculation` | Pure function |
| `rule` | Accumulation / scoring |
| `label` | Classification |
| `external` | JS/npm interop |
| `action` | Async effectful op |
| `policy` | Pure guard |
| `guard` | Pipeline file-scope guard |
| `workflow` | Multi-step async |
| `pipeline` | Agent multi-step flow |
| `session` | Conversational state |
| `prompt` | Versioned template |
| `view` | UI component |
| `page` | Full page shell |
| `layout` | App shell slots |
| `navigation` | Client route registry |
| `route` | HTTP handler |
| `middleware` | HTTP request gate |
| `stream route` | WebSocket handler |
| `schedule` | Periodic job |
| `command` | CLI entry |

## Naming in emit

Spaced names lower to camelCase. Rule outputs avoid duplicated suffixes (`cart total` + `total` → `cartTotal`).

## Agent refs

```text
point://semantic/<Module>/<kind>.<name>
point://semantic/<Module>/record.<Name>/field.<label>
```

## See also

- [Language overview](/point/language/overview)
- [Records](/point/language/records) through [Applications](/point/language/applications)
- [CLI reference](/point/reference/cli)
