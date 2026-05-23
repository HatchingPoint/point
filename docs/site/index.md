---
title: Point Language Documentation
description: Complete guide and reference for the Point language, compiler, standard library, and AI engineering workflow.
quadrant: Tutorial
---

## Summary

Point is a semantic language and compiler toolchain for product logic, applications, workflows, and coding-agent repair loops.

This documentation covers the current public `.point` language, CLI, LSP, standard library, app platform, generated targets, examples, and agent-facing tooling.

```point title="checkout.point"
module Checkout

record Cart Item
  name: Text
  unit price: Int
  quantity: Int

calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total
```

## What You Can Build

Point source is organized around semantic blocks. Each block gives the compiler, editor, and coding agents more structure than ordinary functions alone.

| Area | Blocks and tools |
|------|------------------|
| Data and pure logic | `record`, `variant`, `calculation`, `rule`, `label` |
| Effects and interop | `external`, `action`, `policy`, `guard`, `std.*` |
| HTTP and realtime | `route`, `middleware`, `stream route` |
| UI and apps | `view`, `page`, `layout`, `navigation`, `theme` |
| Orchestration | `workflow`, `schedule`, `command` |
| Agent systems | `pipeline`, `session`, `prompt`, stable refs, `check-json` |
| Targets | JavaScript, TypeScript, partial Python, AST JSON |
| Editor tooling | VS Code/Cursor extension, stdio LSP for other editors |

## Learn by Path

### If You Are New

Start with [Introduction](/point/guide/introduction/), [Quick start](/point/guide/quick-start/), and [Language tour](/point/guide/language-tour/). These pages cover installation, first files, checking, running, and the language surface in sequence.

### If You Are Writing Point Source

Use [Language overview](/point/language/overview/) as the map, then read the block-specific pages for records, calculations, rules, labels, types, effects, routes, realtime, workflows, UI, and applications.

### If You Are Building Apps

Read [Applications](/point/language/applications/), [UI](/point/language/ui/), [Routes](/point/language/routes/), [Realtime](/point/language/realtime/), [Dev server](/point/toolchain/dev/), and [Deploy](/point/toolchain/deploy/).

### If You Are Building With Agents

Read [AI overview](/point/ai/overview/), [Stable refs](/point/ai/stable-refs/), and [Check JSON](/point/ai/check-json/) to understand the repair workflow Point is designed around.

### If You Are Looking Up Facts

Use [CLI reference](/point/reference/cli/), [Grammar summary](/point/reference/grammar/), and [Diagnostics](/point/reference/diagnostics/) for command behavior, syntax, and compiler feedback.

## Docs Map

| Need | Page |
|------|------|
| Learn the language in order | [Language tour](/point/guide/language-tour/) |
| Set up a real repo | [Project structure](/point/guide/project-structure/) |
| Write idiomatic Point | [Style guide](/point/guide/style-guide/) |
| Understand stability | [Compatibility](/point/guide/compatibility/) |
| Test modules and routes | [Testing](/point/guide/testing/) |
| Understand every block kind | [Block reference](/point/reference/blocks/) |
| Look up expressions and operators | [Expressions and operators](/point/reference/expressions/) |
| Learn syntax and grammar | [Grammar summary](/point/reference/grammar/) |
| Look up CLI commands | [CLI reference](/point/reference/cli/) |
| Fix compiler errors | [Diagnostics](/point/reference/diagnostics/) |
| Find runnable examples | [Examples](/point/examples/) |
| Use standard modules | [Stdlib](/point/stdlib/overview/) |

## Language Reference

| Topic | Page |
|-------|------|
| Semantic block model | [Language overview](/point/language/overview/) |
| Data shapes | [Records](/point/language/records/) |
| Pure derived values | [Calculations](/point/language/calculations/) |
| Accumulation/scoring | [Rules](/point/language/rules/) |
| Classification | [Labels](/point/language/labels/) |
| Type system | [Types](/point/language/types/) |
| Expressions | [Expressions and operators](/point/reference/expressions/) |
| Control flow | [Control flow](/point/language/control-flow/) |
| Imports and packages | [Modules](/point/language/modules/) |
| Effects and IO | [Effects](/point/language/effects/) |
| HTTP routes | [Routes](/point/language/routes/) |
| WebSockets/live UI | [Realtime](/point/language/realtime/) |
| Async orchestration | [Workflows](/point/language/workflows/) |
| Agent blocks | [Agents](/point/language/agents/) |
| UI/app blocks | [UI](/point/language/ui/) |

## Toolchain Reference

| Tool | Page |
|------|------|
| Install CLI/editor integration | [Installation](/point/guide/installation/) |
| Run commands | [Run](/point/toolchain/run/) |
| Dev server and app mode | [Dev server](/point/toolchain/dev/) |
| Build JS/TS/Python/app outputs | [Build and emit](/point/toolchain/build-emit/) |
| Format source | [Formatting](/point/toolchain/formatting/) |
| Run tests and REPL | [Run, test, REPL](/point/toolchain/run-test-repl/) |
| Configure editors | [LSP](/point/toolchain/lsp/) and [VS Code](/point/toolchain/vscode/) |
| Deploy apps | [Deploy](/point/toolchain/deploy/) |

## AI Engineering Reference

Point is built so agents can repair source from structured compiler output instead of guessing from raw text.

| Need | Page |
|------|------|
| Understand the model | [AI overview](/point/ai/overview/) |
| Use semantic refs | [Stable refs](/point/ai/stable-refs/) |
| Read structured diagnostics | [Check JSON](/point/ai/check-json/) |
| Run repair loops | [Repair loops](/point/ai/repair-loops/) |
| Follow the recommended agent workflow | [Agent workflow](/point/ai/agent-workflow/) |
| Compare with TS/Python/prompt-only workflows | [Point vs other languages](/point/ai/vs-other-languages/) |

## Core Commands

```bash
bun install -g @hatchingpoint/point
point check myfile.point
point fmt myfile.point
point build myfile.point generated/myfile.js
point lsp
```

## Project Shape

```text
my-app/
  point.json
  package.json
  src/
    app.point
  generated/
  .point/
    lsp.mjs
    editor.json
```

Start from [Project structure](/point/guide/project-structure/) for real repo layouts, generated output policy, monorepos, and CI shape.

## Current Scope

Point is implemented today as a compiler and toolchain. Authors write semantic Point source; the compiler lowers it into checked internal structures and emits runnable targets. The documentation describes the current public syntax and tooling behavior in this repository.

For current stability expectations, see [Compatibility](/point/guide/compatibility/) and [Changelog](/point/changelog/).
