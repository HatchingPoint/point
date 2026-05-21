---
title: Modules
description: module declarations, use imports, and multi-file project graphs.
quadrant: Reference
---

## Summary

Point programs are grouped with `module` names and connected through `use` imports. The CLI resolves a dependency graph before check and emit.

## Syntax

```point
module Billing

record Invoice
  total: Int

use std.http

use Pricing from "./pricing.point"
```

- `module Name` sets the module name for refs and emit
- `use std.<module>` resolves standard library files under `std/`
- `use Module from "./path.point"` links another file

## Semantics

The CLI discovers `examples/**/*.point`, `std/**/*.point`, and `compiler/**/*.point` for project commands (`check-all`, `build-all`, `build-ts-all`, etc.). Dependencies are checked in topological order. Cycles are rejected.

Public symbols from dependencies are visible to importers. Generated TypeScript includes import statements between emitted files.

## Lowering

`use` declarations become core `import` nodes wired at emit time. Each file still lowers its own semantic declarations to functions and types.

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
