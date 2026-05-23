---
title: Block reference
description: Complete index of public Point block kinds, their role, purity, and runtime target.
quadrant: Reference
---

## Summary

Point programs are built from semantic blocks. A block declares intent first, then the compiler lowers it into internal checked structures and emitted target code.

Use this page as the compact index for the current public language surface. Use [Grammar](/point/reference/grammar) for syntax shape and the language pages for examples.

## Core declarations

| Block | Role | Pure | Emits to |
|-------|------|------|----------|
| `module` | Names a source file's semantic namespace | Yes | Namespace metadata and generated names |
| `use` | Imports a relative module or package module such as `std.text` | Yes | Dependency graph and generated imports |
| `record` | Defines named product data with typed fields | Yes | Structural types/interfaces |
| `variant` | Defines a tagged union with named cases and optional payload fields | Yes | Discriminated union representation |
| `calculation` | Pure derived value with inputs and one output | Yes | Function |
| `rule` | Accumulation/scoring block with an output accumulator | Yes | Function |
| `label` | Classification block using `when`, `on Case`, and `otherwise` branches | Yes | Function |

## Effects and interop

| Block | Role | Pure | Emits to |
|-------|------|------|----------|
| `external` | Typed boundary to Node, npm, or host functions | No | Import plus typed callable wrapper |
| `action` | Async effectful operation with declared `touches` metadata | No | Async function |
| `policy` | Pure allow/deny/require checks | Yes | Boolean function or inline guard |
| `guard` | Pipeline-scoped safety rule, currently used for output path constraints | Yes | Guard metadata and checks |

Actions may touch `network`, `file`, `env`, `process`, `time`, `random`, `database`, or `none`. Calling an action from another action or workflow requires `await`.

## Application layer

| Block | Role | Pure | Emits to |
|-------|------|------|----------|
| `view` | React-oriented UI component with semantic render nodes | Mixed | Component code and style classes |
| `page` | Routeable page bound to a layout or standalone main render | Mixed | App route component |
| `layout` | Shared app shell slots such as nav and main content | Mixed | Layout component |
| `navigation` | Client route registry and labels | Yes | Router/navigation metadata |
| `route` | HTTP handler with typed method/path/body/params | No | Server route handler |
| `middleware` | HTTP request gate, commonly for auth | No | Server middleware function |
| `stream route` | WebSocket/live message route | No | Stream server handler |

UI is currently React-oriented. Routes and stream routes target the Bun server path used by `point dev`, `point serve`, and generated app builds.

## Orchestration and agents

| Block | Role | Pure | Emits to |
|-------|------|------|----------|
| `workflow` | Multi-step async process with retry/timeout/failure behavior | No | Async function |
| `pipeline` | Agent-oriented step graph with guarded IO boundaries | No | Async pipeline function |
| `session` | Conversational state and streaming interaction surface | No | Session handler/runtime binding |
| `prompt` | Versioned prompt template with typed placeholders | Yes | Template function/data |
| `schedule` | Periodic job declaration | No | Scheduler metadata/handler |
| `command` | CLI entrypoint for `point run` | No | Runnable function |

## Common nested forms

| Form | Where it appears | Meaning |
|------|------------------|---------|
| `input name: Type` | Calculations, rules, labels, actions, workflows, routes | Declares a typed parameter |
| `output name: Type` | Calculations, rules, labels, actions, workflows | Declares the block result binding |
| `return expr` | Most executable blocks | Returns a value |
| `when condition return expr` | Labels and conditional branches | Guarded return |
| `otherwise return expr` | Labels and fallback branches | Default return |
| `for each item in list` | Calculations and rules | Iteration over `List<T>` |
| `add expr to total` | Rules/calculations with mutable accumulator | Numeric/list accumulation |
| `name is expr` | Calculations and bindings | Assigns a derived value |
| `on Case return expr` | Variant labels | Handles a variant case |
| `await action(...)` | Actions and workflows | Calls an effectful operation |
| `touches file` | Actions | Declares effect category |

## Stability notes

The public semantic syntax is the author-facing language. Internal core IR names such as `fn`, `let`, and generated JavaScript names are compiler implementation details.

Stable refs use semantic names:

```text
point://semantic/<Module>/<kind>.<name>
point://semantic/<Module>/record.<Name>/field.<label>
```

Prefer these refs in docs, issues, generated repair plans, and agent workflows.

## See also

- [Language overview](/point/language/overview)
- [Grammar summary](/point/reference/grammar)
- [Diagnostics](/point/reference/diagnostics)
- [AI stable refs](/point/ai/stable-refs)
