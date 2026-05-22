---
title: Modules
description: module declarations, use imports, and multi-file project graphs.
quadrant: Reference
---

## Summary

Point programs are grouped with `module` names and connected through `use` imports. The CLI resolves a dependency graph before `check-all` and project builds.

## Syntax

```point
module Billing

record Invoice
  total: Int

use std.http
```

- `module Name` sets the module name for semantic refs
- `use std.<module>` resolves standard library files under `std/`
- `use Module from "./path.point"` links another file (see `examples/multi-file/order.point`)

## Semantics

The CLI discovers `examples/**/*.point`, `std/**/*.point`, and `compiler/**/*.point` for project commands (`check-all`, `build-all`, `build-ts-all`, etc.). Dependencies are checked in topological order. Cycles are rejected.

Public symbols from dependencies are visible to importers after `point check`.

## Compiler note

`use` links form a directed graph checked in topological order. Cycles are rejected.

## Example

From the repository std-usage example:

```point
module StdUsage

calculation pass through
  input value: Text
  output result: Text
  result is value

use std.text
use std.json
```

Multi-file layout also lives under `examples/multi-file/` in the repository.

## Common mistakes

- Broken relative paths (`Cannot resolve Point module`)
- Cyclic imports between files

## Agent diagnostic notes

- Run project-wide `point check-all` when changing shared modules
- Semantic refs include the module segment: `point://semantic/Billing/...`

## See also

- [Effects](/point/language/effects)
- [CLI reference](/point/reference/cli)
- [Language overview](/point/language/overview)
