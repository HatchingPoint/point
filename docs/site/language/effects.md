---
title: Effects
description: external, action, policy, and guard blocks for IO, host interop, async work, and safety boundaries.
quadrant: Reference
---

## Summary

Point separates pure product logic from effectful work. Calculations, rules, and labels stay deterministic; IO crosses explicit boundaries through `external`, `action`, `policy`, and `guard` blocks.

This is the core pattern:

```point title="effects-pattern.point"
module Effects

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync

action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

The compiler can now see that `load config` touches the filesystem. Editors, diagnostics, generated refs, and agents can reason about the boundary.

:::note
Pure blocks should not hide IO. If a block reads files, calls a network API, accesses env vars, starts a process, queries a database, or uses time/randomness, model that work as an `action` or an imported `external`.
:::

## Effect Model

| Block | Purpose | Typical use |
|-------|---------|-------------|
| `external` | Declares a typed host import | Node/npm/std bridge functions |
| `action` | Runs async or effectful work | Files, network, env, process, DB, time |
| `policy` | Pure allow/deny/require check | Auth, eligibility, workflow gates |
| `guard` | Scoped safety boundary | Pipeline output path constraints |

Pure blocks can call other pure blocks. Effectful blocks can call actions, workflows, pipelines, externals, and standard-library actions with the right `await` shape.

## external

Use `external` for host imports. Keep external declarations narrow and typed.

```point title="examples/external.point"
module Externals

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync
```

External function signatures tell Point what the host function accepts and returns:

```point
external point std env
  env get raw(name: Text): Maybe<Text> from "@hatchingpoint/point/std/env" as envGet
```

Use externals at the edge. Wrap them in domain actions or calculations when possible:

```point
action load api key
  output key: Maybe<Text>
  touches env
  return env get raw("OPENAI_API_KEY")
```

## action

An `action` is the main effect block. Actions have inputs, an output, declared `touches` metadata, and executable statements.

```point title="examples/action.point"
module Actions

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync

action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

### touches

`touches` documents the effect category:

| Effect | Meaning |
|--------|---------|
| `none` | Explicitly effect-free action wrapper |
| `file` | File reads or writes |
| `network` | HTTP, API, socket, provider calls |
| `env` | Environment variables or process config |
| `process` | Spawning or inspecting processes |
| `time` | Current time, sleep, timers |
| `random` | Randomness or non-deterministic values |
| `database` | Database queries or mutations |

The metadata appears in `point index` and gives agents/reviewers a quick way to inspect IO.

## Awaiting Actions

Action calls from actions, workflows, pipelines, and tests must be awaited when they cross an async/effect boundary.

```point title="examples/async.point"
module Async

action fetch user
  input email: Text
  output user: Text or Error
  touches network
  return email

action load user
  input email: Text
  output user: Text or Error
  touches network
  return await fetch user(email)
```

If `await` is missing, the checker reports `missing-await` with a repair hint.

## Results and Errors

Use result unions when an action can fail:

```point
action read settings
  input path: Text
  output contents: Text or Error
  touches file
  return await read settings file(path)
```

Use `Error "message"` for structured failures:

```point
workflow signup flow
  input email: Text
  output user: Text or Error
  step created user is await create user(email)
    on failure return Error "Could not create user"
  return created user
```

Prefer `T or Error` over sentinel strings such as `"failed"` when callers need to branch on failure.

## policy

A `policy` is a pure boolean gate.

```point title="examples/policy.point"
module Policies

policy adult user
  input age: Int
  require age >= 18
```

Policy forms:

| Form | Meaning |
|------|---------|
| `allow expr` | Pass when expression is true |
| `deny expr` | Fail when expression is true |
| `require expr` | Pass only when expression is true |

Policies can gate workflows and pipelines. Because they are pure, they should not perform IO directly.

## guard

`guard` blocks scope allowed output paths for pipelines.

```point title="examples/pipelines/guarded-output.point"
guard output paths
  allow "generated/**"
  allow "reports/**"
```

Pipeline steps can use guards to make file writes inspectable:

```point
pipeline document ingest
  input path: Text
  output result: Text or Error
  step parsed is await parse document(path)
    touches file scope output paths
  return parsed
```

Guards are a safety layer for agent and automation workflows. They make "where can this pipeline write?" explicit in source.

## Standard Library Effects

Many common effects are already modeled by `std.*` modules:

| Module | Effect area |
|--------|-------------|
| `std.fs` | Files |
| `std.env` | Environment variables |
| `std.http` | HTTP calls and route test assertions |
| `std.time` | Time and sleeps |
| `std.process` | Process execution |
| `std.sql` | SQLite queries |
| `std.ai` | OpenAI and Anthropic provider actions |
| `std.crypto` | Hashing and JWT helpers |

Example:

```point title="std-env-example.point"
module Config

use std.env

action load model
  output model: Text
  touches env
  return env with default(await get env var("POINT_MODEL"), "gpt-4.1-mini")
```

## Database Effects

Database work should be an `action` with `touches database`.

```point
action load notes
  output rows: Text or Error
  touches database
  return await sql query("select * from notes", [])
```

Use `std.sql` for local SQLite scripts/tests, or declare an `external` driver for production databases. See [Database interop](/point/ecosystem/database-interop).

## Agent Notes

Effect declarations are especially important for agent workflows:

- `point index` exposes effect metadata.
- `check-json` reports async and type errors with semantic refs.
- `repair-plan` can point agents toward missing `await`, wrong action arguments, or unsafe pipeline wiring.
- Guards make file writes reviewable before generated code runs.

## Common Mistakes

| Mistake | Diagnostic or symptom | Fix |
|---------|------------------------|-----|
| Calling an action from another action without `await` | `missing-await` | Add `await` |
| Returning `Error` from a non-result output | `return-type-mismatch` | Use `T or Error` |
| Doing IO in a calculation | Check/type failure or bad modeling | Move IO into an action |
| Using raw strings for failure states | Callers cannot type-check failure | Use `Error "message"` |
| Hiding network/database work behind vague names | Hard to review effects | Name the action and `touches` category clearly |

## See also

- [Actions in workflows](/point/language/workflows)
- [Database interop](/point/ecosystem/database-interop)
- [Stdlib overview](/point/stdlib/overview)
- [Diagnostics](/point/reference/diagnostics)
- [Testing effects](/point/guide/testing)
